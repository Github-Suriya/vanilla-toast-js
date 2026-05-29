export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export type ToastTheme = 'light' | 'dark' | 'system';

export type ToastAnimation = 'slide' | 'fade' | 'scale' | 'bounce';

export type ToastId = string | number;

/** A clickable action rendered inside a toast. */
export interface ToastAction {
  /** Button label shown to the user. */
  label: string;
  /** Called when the action button is clicked. The toast id is passed as the second argument. */
  onClick: (event: MouseEvent, toastId: ToastId) => void;
}

/** Options for a single Vanilla Toast notification. */
export interface ToastOptions {
  /** Custom id. Reusing an id updates the existing toast. */
  id?: ToastId;
  /** Primary toast text. Usually passed as the first argument instead. */
  title?: string;
  /** Secondary text shown below the title. */
  description?: string;
  /** Visual intent and icon. */
  type?: ToastType;
  /** Auto-dismiss duration in milliseconds. Use Infinity for persistent toasts. */
  duration?: number;
  /** Custom icon markup or element. Set to null to hide the icon. */
  icon?: string | HTMLElement | null;
  /** Primary action button. */
  action?: ToastAction;
  /** Secondary action button. */
  cancel?: ToastAction;
  /** Use tinted backgrounds for success, error, warning, and info toasts. */
  richColors?: boolean;
  /** Render an accessible close button. */
  closeButton?: boolean;
  /** Render the auto-dismiss progress indicator. */
  progressBar?: boolean;
  /** Animation preset used for entry, layout, and exit transitions. */
  animation?: ToastAnimation;
  /** Screen position for this toast. Overrides the global default. */
  position?: ToastPosition;
  /** Whether pointer swipe and close interactions may dismiss the toast. */
  dismissible?: boolean;
  /** Extra class name added to the toast element. */
  className?: string;
  /** Internal or integration metadata. */
  data?: Record<string, unknown>;
}

/** Options accepted by toast.update(). */
export interface ToastUpdateOptions extends ToastOptions {
  title?: string;
}

/** Messages used by toast.promise(). */
export interface ToastPromiseMessages<T = unknown> {
  loading: string | ToastOptions;
  success: string | ToastOptions | ((data: T) => string | ToastOptions);
  error: string | ToastOptions | ((error: unknown) => string | ToastOptions);
}

/** Global Vanilla Toast configuration. */
export interface ToasterOptions {
  position: ToastPosition;
  duration: number;
  richColors: boolean;
  closeButton: boolean;
  progressBar: boolean;
  maxVisible: number;
  gap: number;
  theme: ToastTheme;
  animation: ToastAnimation;
  pauseOnHover: boolean;
  swipeToDismiss: boolean;
  keyboardDismiss: boolean;
  expandOnHover: boolean;
}

export type VanillaToastOptions = ToastOptions;
export type VanillaToastConfig = ToasterOptions;

export interface InternalToast extends Required<Pick<ToastOptions, 'type' | 'dismissible'>> {
  id: ToastId;
  title: string;
  description?: string;
  position: ToastPosition;
  duration: number;
  remaining: number;
  createdAt: number;
  startedAt: number;
  pausedAt?: number;
  height: number;
  visible: boolean;
  removed: boolean;
  element: HTMLElement;
  timer?: number;
  cleanup: Array<() => void>;
  options: ToastOptions;
}

export interface ToastApi {
  (message: string, options?: ToastOptions): ToastId;
  success(message: string, options?: Omit<ToastOptions, 'type'>): ToastId;
  error(message: string, options?: Omit<ToastOptions, 'type'>): ToastId;
  warning(message: string, options?: Omit<ToastOptions, 'type'>): ToastId;
  info(message: string, options?: Omit<ToastOptions, 'type'>): ToastId;
  loading(message: string, options?: Omit<ToastOptions, 'type'>): ToastId;
  custom(element: HTMLElement, options?: ToastOptions): ToastId;
  dismiss(id?: ToastId): void;
  dismissAll(): void;
  update(id: ToastId, options: ToastUpdateOptions): void;
  promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options?: ToastOptions): Promise<T>;
  configure(options: Partial<ToasterOptions>): void;
}

declare global {
  interface Window {
    vanillaToast?: ToastApi;
    toast?: ToastApi;
    VanillaToast?: {
      toast: ToastApi;
    };
  }
}
