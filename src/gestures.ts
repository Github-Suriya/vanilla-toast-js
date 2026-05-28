import type { InternalToast, ToastPosition } from './types';
import { clamp } from './utils';

interface GestureOptions {
  position: ToastPosition;
  onDismiss: () => void;
}

export function bindSwipeGesture(toast: InternalToast, options: GestureOptions): () => void {
  const element = toast.element;
  let startX = 0;
  let startY = 0;
  let deltaX = 0;
  let deltaY = 0;
  let swiping = false;
  let pointerId: number | null = null;

  const reset = () => {
    element.dataset.swiping = 'false';
    element.style.setProperty('--vt-swipe-x', '0px');
    element.style.setProperty('--vt-swipe-y', '0px');
    element.style.setProperty('--vt-swipe-opacity', '1');
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!toast.dismissible || event.button !== 0) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    deltaX = 0;
    deltaY = 0;
    swiping = true;
    element.dataset.swiping = 'true';
    element.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!swiping || pointerId !== event.pointerId) return;
    deltaX = event.clientX - startX;
    deltaY = event.clientY - startY;
    const primaryDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
    const opacity = 1 - clamp(Math.abs(primaryDelta) / 180, 0, 0.65);

    element.style.setProperty('--vt-swipe-x', `${deltaX}px`);
    element.style.setProperty('--vt-swipe-y', `${deltaY}px`);
    element.style.setProperty('--vt-swipe-opacity', String(opacity));
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!swiping || pointerId !== event.pointerId) return;
    const threshold = 80;
    const shouldDismiss = Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold;

    swiping = false;
    pointerId = null;
    element.releasePointerCapture?.(event.pointerId);

    if (shouldDismiss) {
      options.onDismiss();
      return;
    }

    reset();
  };

  element.addEventListener('pointerdown', onPointerDown, { passive: true });
  element.addEventListener('pointermove', onPointerMove, { passive: true });
  element.addEventListener('pointerup', onPointerUp, { passive: true });
  element.addEventListener('pointercancel', onPointerUp, { passive: true });

  return () => {
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointermove', onPointerMove);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('pointercancel', onPointerUp);
  };
}
