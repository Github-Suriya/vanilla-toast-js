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

export interface ToastAction {
  label: string;
  onClick: (event: MouseEvent, toastId: ToastId) => void;
}

export interface ToastOptions {
  id?: ToastId;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  icon?: string | HTMLElement | null;
  action?: ToastAction;
  cancel?: ToastAction;
  richColors?: boolean;
  closeButton?: boolean;
  progressBar?: boolean;
  animation?: ToastAnimation;
  position?: ToastPosition;
  dismissible?: boolean;
  className?: string;
  data?: Record<string, unknown>;
}

export interface ToastUpdateOptions extends ToastOptions {
  title?: string;
}

export interface ToastPromiseMessages<T = unknown> {
  loading: string | ToastOptions;
  success: string | ToastOptions | ((data: T) => string | ToastOptions);
  error: string | ToastOptions | ((error: unknown) => string | ToastOptions);
}

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
