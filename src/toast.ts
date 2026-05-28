import { Toaster } from './toaster';
import type { ToastApi, ToastOptions } from './types';

const toaster = new Toaster();

const base = (message: string, options?: ToastOptions) => toaster.show(message, options);

export const toast = Object.assign(base, {
  success: (message: string, options?: Omit<ToastOptions, 'type'>) => toaster.show(message, { ...options, type: 'success' }),
  error: (message: string, options?: Omit<ToastOptions, 'type'>) => toaster.show(message, { ...options, type: 'error' }),
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) => toaster.show(message, { ...options, type: 'warning' }),
  info: (message: string, options?: Omit<ToastOptions, 'type'>) => toaster.show(message, { ...options, type: 'info' }),
  loading: (message: string, options?: Omit<ToastOptions, 'type'>) => toaster.show(message, { ...options, type: 'loading' }),
  custom: toaster.custom.bind(toaster),
  dismiss: toaster.dismiss.bind(toaster),
  dismissAll: toaster.dismissAll.bind(toaster),
  update: toaster.update.bind(toaster),
  promise: toaster.promise.bind(toaster),
  configure: toaster.configure.bind(toaster),
}) satisfies ToastApi;
