import type { InternalToast, ToasterOptions } from './types';
import { isCenterPosition, isTopPosition, raf } from './utils';

export function mountToast(toast: InternalToast): void {
  raf(() => {
    toast.element.dataset.mounted = 'true';
  });
}

export function markRemoving(toast: InternalToast): void {
  toast.element.dataset.removed = 'true';
}

export function layoutToasts(toasts: InternalToast[], options: ToasterOptions, expanded: boolean): void {
  const position = toasts[0]?.position ?? options.position;
  const top = isTopPosition(position);
  let offset = 0;

  toasts.forEach((toast, index) => {
    const element = toast.element;
    const hidden = index >= options.maxVisible && !expanded;
    const direction = top ? 1 : -1;
    const collapsedOffset = index * options.gap * direction;
    const expandedOffset = offset * direction;
    const scale = expanded ? 1 : Math.max(0.86, 1 - index * 0.045);
    const y = expanded ? expandedOffset : collapsedOffset;

    element.style.zIndex = String(toasts.length - index);
    element.style.opacity = hidden ? '0' : '1';
    element.style.pointerEvents = hidden ? 'none' : 'auto';
    element.style.setProperty('--vt-y', `${y}px`);
    element.style.setProperty('--vt-scale', String(scale));
    element.style.setProperty('--vt-x', isCenterPosition(position) ? '-50%' : '0px');
    element.dataset.front = index === 0 ? 'true' : 'false';

    offset += toast.height + options.gap;
  });
}
