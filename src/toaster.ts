import { layoutToasts, markRemoving, mountToast } from './animations';
import { bindSwipeGesture } from './gestures';
import { ToastQueue } from './queue';
import { applyTheme, defaultOptions } from './theme';
import type {
  InternalToast,
  ToastId,
  ToastOptions,
  ToastPromiseMessages,
  ToastType,
  ToastUpdateOptions,
  ToasterOptions,
} from './types';
import { afterTransition, createToastId, isBrowser, mergeDefined, removeElement, safeText } from './utils';

const icons: Partial<Record<ToastType, string>> & { close: string } = {
  success:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>',
  error:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>',
  info:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
  warning:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>',
  close:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
};

export class Toaster {
  private options: ToasterOptions = { ...defaultOptions };
  private queue = new ToastQueue();
  private container?: HTMLElement;
  private expanded = false;
  private keyboardCleanup?: () => void;

  configure(options: Partial<ToasterOptions>): void {
    this.options = mergeDefined(this.options, options as Partial<ToasterOptions>);
    if (this.container) {
      this.container.dataset.position = this.options.position;
      this.container.dataset.animation = this.options.animation;
      applyTheme(this.container, this.options.theme);
      this.layout();
    }
  }

  show(message: string, options: ToastOptions = {}): ToastId {
    if (!isBrowser) return options.id ?? '';
    this.ensureContainer();

    const resolved = this.resolveOptions(message, options);
    const existing = this.queue.get(resolved.id!);
    if (existing) {
      this.update(existing.id, resolved);
      return existing.id;
    }

    const element = this.createToastElement(resolved);
    this.container!.appendChild(element);

    const height = element.getBoundingClientRect().height;
    const toast: InternalToast = {
      id: resolved.id!,
      title: resolved.title!,
      description: resolved.description,
      type: resolved.type ?? 'default',
      dismissible: resolved.dismissible ?? true,
      duration: resolved.duration!,
      remaining: resolved.duration!,
      createdAt: Date.now(),
      startedAt: Date.now(),
      height,
      visible: true,
      removed: false,
      element,
      cleanup: [],
      options: resolved,
    };

    this.bindToastEvents(toast);
    this.queue.add(toast);
    mountToast(toast);
    this.layout();
    this.startTimer(toast);

    return toast.id;
  }

  custom(element: HTMLElement, options: ToastOptions = {}): ToastId {
    return this.show('', { ...options, title: '', icon: null, data: { ...options.data, customElement: element } });
  }

  update(id: ToastId, options: ToastUpdateOptions): void {
    const toast = this.queue.get(id);
    if (!toast || toast.removed) return;

    const nextOptions = this.resolveOptions(options.title ?? toast.title, {
      ...toast.options,
      ...options,
      id,
      type: options.type ?? toast.type,
    });

    toast.options = nextOptions;
    toast.title = nextOptions.title!;
    toast.description = nextOptions.description;
    toast.type = nextOptions.type ?? 'default';
    toast.dismissible = nextOptions.dismissible ?? true;
    toast.duration = nextOptions.duration!;
    toast.remaining = nextOptions.duration!;
    toast.startedAt = Date.now();
    const nextElement = this.createToastElement(nextOptions);
    toast.element.replaceWith(nextElement);
    toast.element = nextElement;
    toast.cleanup.forEach((cleanup) => cleanup());
    toast.cleanup = [];
    this.bindToastEvents(toast);
    toast.height = toast.element.getBoundingClientRect().height;
    toast.element.dataset.mounted = 'true';
    this.startTimer(toast);
    this.layout();
  }

  dismiss(id?: ToastId): void {
    if (id === undefined) {
      this.queue.active().forEach((toast) => this.removeToast(toast.id));
      return;
    }
    this.removeToast(id);
  }

  promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options: ToastOptions = {}): Promise<T> {
    const id = this.show('', this.messageToOptions(messages.loading, { ...options, type: 'loading', duration: Infinity }));
    const task = typeof promise === 'function' ? promise() : promise;

    task
      .then((data) => {
        this.update(id, this.messageToOptions(typeof messages.success === 'function' ? messages.success(data) : messages.success, {
          type: 'success',
          duration: options.duration ?? this.options.duration,
        }));
      })
      .catch((error) => {
        this.update(id, this.messageToOptions(typeof messages.error === 'function' ? messages.error(error) : messages.error, {
          type: 'error',
          duration: options.duration ?? this.options.duration,
        }));
      });

    return task;
  }

  private resolveOptions(message: string, options: ToastOptions): ToastOptions {
    const type = options.type ?? 'default';
    const duration = options.duration ?? (type === 'loading' ? Infinity : this.options.duration);

    return {
      ...options,
      id: createToastId(options.id),
      title: options.title ?? message,
      type,
      duration,
      richColors: options.richColors ?? this.options.richColors,
      closeButton: options.closeButton ?? this.options.closeButton,
      progressBar: options.progressBar ?? this.options.progressBar,
      animation: options.animation ?? this.options.animation,
      position: options.position ?? this.options.position,
      dismissible: options.dismissible ?? true,
    };
  }

  private messageToOptions(message: string | ToastOptions, fallback: ToastOptions): ToastOptions {
    return typeof message === 'string' ? { ...fallback, title: message } : { ...fallback, ...message };
  }

  private ensureContainer(): void {
    if (this.container) return;

    const container = document.createElement('div');
    container.dataset.sonnerToaster = 'true';
    container.dataset.position = this.options.position;
    container.dataset.animation = this.options.animation;
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    applyTheme(container, this.options.theme);

    container.addEventListener('mouseenter', () => {
      if (!this.options.expandOnHover) return;
      this.expanded = true;
      this.pauseAll();
      this.layout();
    });

    container.addEventListener('mouseleave', () => {
      if (!this.options.expandOnHover) return;
      this.expanded = false;
      this.resumeAll();
      this.layout();
    });

    document.body.appendChild(container);
    this.container = container;
    this.bindKeyboard();
  }

  private bindKeyboard(): void {
    if (!this.options.keyboardDismiss || this.keyboardCleanup) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const toast = this.queue.firstActive();
      if (toast) this.removeToast(toast.id);
    };
    document.addEventListener('keydown', onKeyDown);
    this.keyboardCleanup = () => document.removeEventListener('keydown', onKeyDown);
  }

  private createToastElement(options: ToastOptions): HTMLElement {
    const toast = document.createElement('div');
    toast.className = `sonner-toast${options.className ? ` ${options.className}` : ''}`;
    toast.dataset.toastId = String(options.id);
    toast.dataset.type = options.type ?? 'default';
    toast.dataset.rich = String(Boolean(options.richColors));
    toast.dataset.animation = options.animation ?? this.options.animation;
    toast.dataset.swiping = 'false';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.tabIndex = -1;

    const customElement = options.data?.customElement;
    if (customElement instanceof HTMLElement) {
      toast.classList.add('sonner-toast-custom');
      toast.appendChild(customElement);
      return toast;
    }

    const icon = this.createIcon(options);
    if (icon) toast.appendChild(icon);

    const content = document.createElement('div');
    content.className = 'sonner-content';

    const title = document.createElement('p');
    title.className = 'sonner-title';
    title.appendChild(safeText(options.title ?? ''));
    content.appendChild(title);

    if (options.description) {
      const description = document.createElement('p');
      description.className = 'sonner-description';
      description.appendChild(safeText(options.description));
      content.appendChild(description);
    }

    const actions = this.createActions(options);
    if (actions) content.appendChild(actions);

    toast.appendChild(content);

    if (options.progressBar && Number.isFinite(options.duration)) {
      const progress = document.createElement('span');
      progress.className = 'sonner-progress';
      progress.style.animationDuration = `${options.duration}ms`;
      toast.appendChild(progress);
    }

    if (options.closeButton) {
      const close = document.createElement('button');
      close.className = 'sonner-close';
      close.type = 'button';
      close.ariaLabel = 'Dismiss toast';
      close.innerHTML = icons.close;
      toast.appendChild(close);
    }

    return toast;
  }

  private createIcon(options: ToastOptions): HTMLElement | null {
    if (options.icon === null) return null;
    const wrapper = document.createElement('div');
    wrapper.className = 'sonner-icon';
    wrapper.setAttribute('aria-hidden', 'true');

    if (options.type === 'loading') {
      const spinner = document.createElement('span');
      spinner.className = 'sonner-spinner';
      wrapper.appendChild(spinner);
      return wrapper;
    }

    if (options.icon instanceof HTMLElement) {
      wrapper.appendChild(options.icon);
      return wrapper;
    }

    if (typeof options.icon === 'string') {
      wrapper.innerHTML = options.icon;
      return wrapper;
    }

    const icon = icons[options.type ?? 'default'];
    if (!icon) return null;
    wrapper.innerHTML = icon;
    return wrapper;
  }

  private createActions(options: ToastOptions): HTMLElement | null {
    if (!options.action && !options.cancel) return null;

    const actions = document.createElement('div');
    actions.className = 'sonner-action-container';

    if (options.cancel) {
      const cancel = document.createElement('button');
      cancel.className = 'sonner-button sonner-cancel-button';
      cancel.type = 'button';
      cancel.appendChild(safeText(options.cancel.label));
      actions.appendChild(cancel);
    }

    if (options.action) {
      const action = document.createElement('button');
      action.className = 'sonner-button sonner-action-button';
      action.type = 'button';
      action.appendChild(safeText(options.action.label));
      actions.appendChild(action);
    }

    return actions;
  }

  private bindToastEvents(toast: InternalToast): void {
    const element = toast.element;
    const close = element.querySelector<HTMLButtonElement>('.sonner-close');
    const action = element.querySelector<HTMLButtonElement>('.sonner-action-button');
    const cancel = element.querySelector<HTMLButtonElement>('.sonner-cancel-button');

    const onClose = () => this.removeToast(toast.id);
    close?.addEventListener('click', onClose);
    if (close) toast.cleanup.push(() => close.removeEventListener('click', onClose));

    const onAction = (event: MouseEvent) => {
      toast.options.action?.onClick(event, toast.id);
      this.removeToast(toast.id);
    };
    action?.addEventListener('click', onAction);
    if (action) toast.cleanup.push(() => action.removeEventListener('click', onAction));

    const onCancel = (event: MouseEvent) => {
      toast.options.cancel?.onClick(event, toast.id);
      this.removeToast(toast.id);
    };
    cancel?.addEventListener('click', onCancel);
    if (cancel) toast.cleanup.push(() => cancel.removeEventListener('click', onCancel));

    if (this.options.pauseOnHover) {
      const pause = () => this.pauseTimer(toast);
      const resume = () => this.resumeTimer(toast);
      element.addEventListener('mouseenter', pause);
      element.addEventListener('mouseleave', resume);
      element.addEventListener('focusin', pause);
      element.addEventListener('focusout', resume);
      toast.cleanup.push(() => {
        element.removeEventListener('mouseenter', pause);
        element.removeEventListener('mouseleave', resume);
        element.removeEventListener('focusin', pause);
        element.removeEventListener('focusout', resume);
      });
    }

    if (this.options.swipeToDismiss) {
      toast.cleanup.push(bindSwipeGesture(toast, {
        position: this.options.position,
        onDismiss: () => this.removeToast(toast.id),
      }));
    }
  }

  private startTimer(toast: InternalToast): void {
    if (toast.timer) window.clearTimeout(toast.timer);
    if (!Number.isFinite(toast.remaining) || toast.remaining <= 0) return;

    toast.startedAt = Date.now();
    toast.timer = window.setTimeout(() => this.removeToast(toast.id), toast.remaining);
  }

  private pauseTimer(toast: InternalToast): void {
    if (!toast.timer || !Number.isFinite(toast.remaining)) return;
    window.clearTimeout(toast.timer);
    toast.timer = undefined;
    toast.remaining = Math.max(0, toast.remaining - (Date.now() - toast.startedAt));
    toast.pausedAt = Date.now();
    toast.element.dataset.paused = 'true';
  }

  private resumeTimer(toast: InternalToast): void {
    if (toast.removed || toast.timer || !toast.pausedAt) return;
    toast.pausedAt = undefined;
    toast.element.dataset.paused = 'false';
    this.startTimer(toast);
  }

  private pauseAll(): void {
    this.queue.active().forEach((toast) => this.pauseTimer(toast));
  }

  private resumeAll(): void {
    this.queue.active().forEach((toast) => this.resumeTimer(toast));
  }

  private removeToast(id: ToastId): void {
    const toast = this.queue.get(id);
    if (!toast || toast.removed) return;

    toast.removed = true;
    if (toast.timer) window.clearTimeout(toast.timer);
    markRemoving(toast);
    this.layout();

    afterTransition(toast.element, () => {
      toast.cleanup.forEach((cleanup) => cleanup());
      removeElement(toast.element);
      this.queue.remove(id);
      this.layout();
      this.cleanupContainer();
    });
  }

  private layout(): void {
    if (!this.container) return;
    layoutToasts(this.queue.active(), this.options, this.expanded);
  }

  private cleanupContainer(): void {
    if (!this.container || this.queue.active().length > 0) return;
    this.keyboardCleanup?.();
    this.keyboardCleanup = undefined;
    removeElement(this.container);
    this.container = undefined;
    this.expanded = false;
  }
}
