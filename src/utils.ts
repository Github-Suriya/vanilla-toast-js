import type { ToastId, ToastOptions, ToastPosition } from './types';

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

let counter = 0;

export function createToastId(id?: ToastId): ToastId {
  if (id !== undefined) return id;
  counter += 1;
  return `sonner-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function raf(callback: () => void): number {
  return window.requestAnimationFrame(callback);
}

export function afterTransition(element: HTMLElement, callback: () => void, fallback = 420): () => void {
  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;
    element.removeEventListener('transitionend', finish);
    window.clearTimeout(timeout);
    callback();
  };
  const timeout = window.setTimeout(finish, fallback);
  element.addEventListener('transitionend', finish);
  return finish;
}

export function safeText(value: string): Text {
  return document.createTextNode(value);
}

export function removeElement(element: HTMLElement): void {
  element.parentElement?.removeChild(element);
}

export function isTopPosition(position: ToastPosition): boolean {
  return position.startsWith('top');
}

export function isCenterPosition(position: ToastPosition): boolean {
  return position.endsWith('center');
}

export function normalizeToastOptions(message: string | ToastOptions, options: ToastOptions = {}): ToastOptions {
  if (typeof message === 'string') {
    return { ...options, title: message };
  }

  return { ...message, ...options, title: options.title ?? message.title };
}

export function mergeDefined<T extends object>(base: T, patch: Partial<T>): T {
  const next = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  });
  return next;
}
