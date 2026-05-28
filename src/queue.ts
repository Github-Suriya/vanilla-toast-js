import type { InternalToast, ToastPosition } from './types';

export class ToastQueue {
  private items: InternalToast[] = [];

  add(toast: InternalToast): void {
    this.items.unshift(toast);
  }

  remove(id: string | number): InternalToast | undefined {
    const found = this.items.find((toast) => toast.id === id);
    this.items = this.items.filter((toast) => toast.id !== id);
    return found;
  }

  get(id: string | number): InternalToast | undefined {
    return this.items.find((toast) => toast.id === id);
  }

  active(): InternalToast[] {
    return this.items.filter((toast) => !toast.removed);
  }

  activeByPosition(position: ToastPosition): InternalToast[] {
    return this.items.filter((toast) => !toast.removed && toast.position === position);
  }

  all(): InternalToast[] {
    return [...this.items];
  }

  clear(): InternalToast[] {
    const items = this.items;
    this.items = [];
    return items;
  }

  firstActive(): InternalToast | undefined {
    return this.active()[0];
  }
}
