import type { ToasterOptions, ToastTheme } from './types';

export const defaultOptions: ToasterOptions = {
  position: 'bottom-right',
  duration: 4000,
  richColors: false,
  closeButton: false,
  progressBar: true,
  maxVisible: 5,
  gap: 14,
  theme: 'system',
  animation: 'slide',
  pauseOnHover: true,
  swipeToDismiss: true,
  keyboardDismiss: true,
  expandOnHover: true,
};

export function resolveTheme(theme: ToastTheme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(element: HTMLElement, theme: ToastTheme): void {
  element.dataset.theme = resolveTheme(theme);
}
