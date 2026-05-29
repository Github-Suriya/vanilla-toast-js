import { layoutToasts, markRemoving, mountToast } from './animations';
import { bindSwipeGesture } from './gestures';
import { ToastQueue } from './queue';
import { applyTheme, defaultOptions } from './theme';
import type {
  InternalToast,
  ToastId,
  ToastOptions,
  ToastPosition,
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
  private containers = new Map<ToastPosition, HTMLElement>();
  private expandedPositions = new Set<ToastPosition>();
  private pendingLayouts = new Set<ToastPosition>();
  private containerCleanups = new Map<ToastPosition, () => void>();
  private hoverCloseFrames = new Map<ToastPosition, number>();
  private lastPointerPosition = { x: 0, y: 0 };
  private layoutFrame?: number;
  private keyboardCleanup?: () => void;

  configure(options: Partial<ToasterOptions>): void {
    this.options = mergeDefined(this.options, options as Partial<ToasterOptions>);
    this.containers.forEach((container) => {
      container.dataset.animation = this.options.animation;
      applyTheme(container, this.options.theme);
    });
    this.queue.active().forEach((toast) => this.scheduleLayout(toast.position));
  }

  show(message: string, options: ToastOptions = {}): ToastId {
    if (!isBrowser) return options.id ?? '';

    const resolved = this.resolveOptions(message, options);
    const position = resolved.position!;
    const container = this.ensureContainer(position);
    const existing = this.queue.get(resolved.id!);
    if (existing) {
      this.update(existing.id, resolved);
      return existing.id;
    }

    const element = this.createToastElement(resolved);
    container.appendChild(element);

    const height = element.getBoundingClientRect().height;
    const toast: InternalToast = {
      id: resolved.id!,
      title: resolved.title!,
      description: resolved.description,
      type: resolved.type ?? 'default',
      position,
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
    this.scheduleLayout(position);
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
    const previousPosition = toast.position;
    toast.position = nextOptions.position!;
    toast.dismissible = nextOptions.dismissible ?? true;
    toast.duration = nextOptions.duration!;
    toast.remaining = nextOptions.duration!;
    toast.startedAt = Date.now();
    const nextElement = this.createToastElement(nextOptions);
    toast.element.replaceWith(nextElement);
    toast.element = nextElement;
    if (previousPosition !== toast.position) {
      this.ensureContainer(toast.position).appendChild(toast.element);
    }
    toast.cleanup.forEach((cleanup) => cleanup());
    toast.cleanup = [];
    this.bindToastEvents(toast);
    toast.height = toast.element.getBoundingClientRect().height;
    toast.element.dataset.mounted = 'true';
    this.startTimer(toast);
    this.scheduleLayout(previousPosition);
    this.scheduleLayout(toast.position);
    this.cleanupContainer(previousPosition);
  }

  dismiss(id?: ToastId): void {
    if (id === undefined) {
      this.dismissAll();
      return;
    }
    this.removeToast(id);
  }

  dismissAll(): void {
    this.queue.active().forEach((toast) => this.removeToast(toast.id));
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

  private ensureContainer(position: ToastPosition): HTMLElement {
    const cached = this.containers.get(position);
    if (cached?.isConnected) return cached;

    const selector = `[data-vt-toaster][data-position="${position}"], .vt-container.${position}`;
    const existing = document.querySelector<HTMLElement>(selector);
    const container = existing ?? document.createElement('div');
    container.classList.add('vt-container', position);
    container.dataset.vtToaster = 'true';
    container.dataset.position = position;
    container.dataset.animation = this.options.animation;
    if (!existing) container.dataset.vtCreated = 'true';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    applyTheme(container, this.options.theme);

    const onPointerMove = (event: PointerEvent) => {
      this.lastPointerPosition = { x: event.clientX, y: event.clientY };
    };

    const onPointerEnter = (event: PointerEvent) => {
      this.lastPointerPosition = { x: event.clientX, y: event.clientY };
      if (!this.options.expandOnHover) return;
      this.expandPosition(position);
    };

    const onPointerLeave = (event: PointerEvent) => {
      this.lastPointerPosition = { x: event.clientX, y: event.clientY };
      if (!this.options.expandOnHover) return;
      this.scheduleCollapseIfOutside(position, container);
    };

    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerenter', onPointerEnter);
    container.addEventListener('pointerleave', onPointerLeave);
    this.containerCleanups.set(position, () => {
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerenter', onPointerEnter);
      container.removeEventListener('pointerleave', onPointerLeave);
    });

    if (!existing) document.body.appendChild(container);
    this.containers.set(position, container);
    this.bindKeyboard();
    return container;
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
    toast.className = `vt-toast${options.className ? ` ${options.className}` : ''}`;
    toast.dataset.toastId = String(options.id);
    toast.dataset.type = options.type ?? 'default';
    toast.dataset.rich = String(Boolean(options.richColors));
    toast.dataset.close = String(Boolean(options.closeButton));
    toast.dataset.animation = options.animation ?? this.options.animation;
    toast.dataset.swiping = 'false';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.tabIndex = -1;

    const customElement = options.data?.customElement;
    if (customElement instanceof HTMLElement) {
      toast.classList.add('vt-toast-custom');
      toast.appendChild(customElement);
      return toast;
    }

    const icon = this.createIcon(options);
    if (icon) toast.appendChild(icon);

    const content = document.createElement('div');
    content.className = 'vt-content';

    const title = document.createElement('p');
    title.className = 'vt-title';
    title.appendChild(safeText(options.title ?? ''));
    content.appendChild(title);

    if (options.description) {
      const description = document.createElement('p');
      description.className = 'vt-description';
      description.appendChild(safeText(options.description));
      content.appendChild(description);
    }

    const actions = this.createActions(options);
    if (actions) content.appendChild(actions);

    toast.appendChild(content);

    if (options.progressBar && Number.isFinite(options.duration)) {
      const progress = document.createElement('span');
      progress.className = 'vt-progress';
      progress.style.animationDuration = `${options.duration}ms`;
      toast.appendChild(progress);
    }

    if (options.closeButton) {
      const close = document.createElement('button');
      close.className = 'vt-close';
      close.type = 'button';
      close.setAttribute('aria-label', 'Close notification');
      close.innerHTML = icons.close;
      toast.appendChild(close);
    }

    return toast;
  }

  private createIcon(options: ToastOptions): HTMLElement | null {
    if (options.icon === null) return null;
    const wrapper = document.createElement('div');
    wrapper.className = 'vt-icon';
    wrapper.setAttribute('aria-hidden', 'true');

    if (options.type === 'loading') {
      const spinner = document.createElement('span');
      spinner.className = 'vt-spinner';
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
    actions.className = 'vt-action-container';

    if (options.cancel) {
      const cancel = document.createElement('button');
      cancel.className = 'vt-button vt-cancel-button';
      cancel.type = 'button';
      cancel.appendChild(safeText(options.cancel.label));
      actions.appendChild(cancel);
    }

    if (options.action) {
      const action = document.createElement('button');
      action.className = 'vt-button vt-action-button';
      action.type = 'button';
      action.appendChild(safeText(options.action.label));
      actions.appendChild(action);
    }

    return actions;
  }

  private bindToastEvents(toast: InternalToast): void {
    const element = toast.element;
    const close = element.querySelector<HTMLButtonElement>('.vt-close');
    const action = element.querySelector<HTMLButtonElement>('.vt-action-button');
    const cancel = element.querySelector<HTMLButtonElement>('.vt-cancel-button');

    const stopPointerGesture = (event: PointerEvent) => event.stopPropagation();
    const onClose = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.removeToast(toast.id);
    };
    close?.addEventListener('click', onClose);
    close?.addEventListener('pointerdown', stopPointerGesture);
    if (close) {
      toast.cleanup.push(() => {
        close.removeEventListener('click', onClose);
        close.removeEventListener('pointerdown', stopPointerGesture);
      });
    }

    const onAction = (event: MouseEvent) => {
      event.stopPropagation();
      toast.options.action?.onClick(event, toast.id);
      this.removeToast(toast.id);
    };
    action?.addEventListener('click', onAction);
    action?.addEventListener('pointerdown', stopPointerGesture);
    if (action) {
      toast.cleanup.push(() => {
        action.removeEventListener('click', onAction);
        action.removeEventListener('pointerdown', stopPointerGesture);
      });
    }

    const onCancel = (event: MouseEvent) => {
      event.stopPropagation();
      toast.options.cancel?.onClick(event, toast.id);
      this.removeToast(toast.id);
    };
    cancel?.addEventListener('click', onCancel);
    cancel?.addEventListener('pointerdown', stopPointerGesture);
    if (cancel) {
      toast.cleanup.push(() => {
        cancel.removeEventListener('click', onCancel);
        cancel.removeEventListener('pointerdown', stopPointerGesture);
      });
    }

    if (this.options.pauseOnHover) {
      const pause = () => this.pauseTimer(toast);
      const resume = () => {
        if (!this.expandedPositions.has(toast.position)) {
          this.resumeTimer(toast);
        }
      };
      element.addEventListener('focusin', pause);
      element.addEventListener('focusout', resume);
      toast.cleanup.push(() => {
        element.removeEventListener('focusin', pause);
        element.removeEventListener('focusout', resume);
      });
    }

    if (this.options.swipeToDismiss) {
      toast.cleanup.push(bindSwipeGesture(toast, {
        position: toast.position,
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

  private pausePosition(position: ToastPosition): void {
    this.queue.activeByPosition(position).forEach((toast) => this.pauseTimer(toast));
  }

  private resumePosition(position: ToastPosition): void {
    this.queue.activeByPosition(position).forEach((toast) => this.resumeTimer(toast));
  }

  private expandPosition(position: ToastPosition): void {
    const closeFrame = this.hoverCloseFrames.get(position);
    if (closeFrame) {
      window.cancelAnimationFrame(closeFrame);
      this.hoverCloseFrames.delete(position);
    }

    if (!this.expandedPositions.has(position)) {
      this.expandedPositions.add(position);
      this.scheduleLayout(position);
    }

    this.pausePosition(position);
  }

  private collapsePosition(position: ToastPosition): void {
    if (!this.expandedPositions.has(position)) return;
    this.expandedPositions.delete(position);
    this.resumePosition(position);
    this.scheduleLayout(position);
  }

  private scheduleCollapseIfOutside(position: ToastPosition, container: HTMLElement): void {
    const existing = this.hoverCloseFrames.get(position);
    if (existing) window.cancelAnimationFrame(existing);

    // Let the browser settle hit-testing before deciding whether the stack was truly left.
    const frame = window.requestAnimationFrame(() => {
      this.hoverCloseFrames.delete(position);
      const target = document.elementFromPoint(this.lastPointerPosition.x, this.lastPointerPosition.y);
      if (target instanceof Element && container.contains(target)) {
        return;
      }
      this.collapsePosition(position);
    });

    this.hoverCloseFrames.set(position, frame);
  }

  private removeToast(id: ToastId): void {
    const toast = this.queue.get(id);
    if (!toast || toast.removed) return;

    toast.removed = true;
    if (toast.timer) window.clearTimeout(toast.timer);
    markRemoving(toast);
    this.scheduleLayout(toast.position);

    afterTransition(toast.element, () => {
      toast.cleanup.forEach((cleanup) => cleanup());
      removeElement(toast.element);
      this.queue.remove(id);
      this.scheduleLayout(toast.position);
      this.cleanupContainer(toast.position);
    });
  }

  private scheduleLayout(position: ToastPosition): void {
    this.pendingLayouts.add(position);
    if (this.layoutFrame) return;

    this.layoutFrame = window.requestAnimationFrame(() => {
      const positions = [...this.pendingLayouts];
      this.pendingLayouts.clear();
      this.layoutFrame = undefined;
      positions.forEach((nextPosition) => this.layout(nextPosition));
    });
  }

  private layout(position: ToastPosition): void {
    const container = this.containers.get(position);
    if (!container) return;
    const height = layoutToasts(this.queue.activeByPosition(position), this.options, this.expandedPositions.has(position));
    container.style.height = height ? `${height}px` : '0px';
  }

  private cleanupContainer(position: ToastPosition): void {
    const container = this.containers.get(position);
    if (!container || this.queue.activeByPosition(position).length > 0) return;

    this.containerCleanups.get(position)?.();
    this.containerCleanups.delete(position);
    const hoverFrame = this.hoverCloseFrames.get(position);
    if (hoverFrame) {
      window.cancelAnimationFrame(hoverFrame);
      this.hoverCloseFrames.delete(position);
    }

    if (container.dataset.vtCreated === 'true') {
      removeElement(container);
    }

    this.containers.delete(position);
    this.expandedPositions.delete(position);

    if (this.queue.active().length === 0) {
      this.keyboardCleanup?.();
      this.keyboardCleanup = undefined;
    }
  }
}
