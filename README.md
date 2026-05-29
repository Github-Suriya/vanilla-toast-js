# Vanilla Toast

A lightweight, standalone toast notification library for Vanilla JavaScript. Vanilla Toast ships with TypeScript types, CDN-ready bundles, smooth stacked animations, promise handling, swipe dismissal, accessible controls, and zero framework dependencies.

## Installation

```bash
npm install vanilla-toast
```

## CDN Usage

```html
<link rel="stylesheet" href="https://unpkg.com/vanilla-toast/dist/vanilla-toast.css" />
<script src="https://unpkg.com/vanilla-toast/dist/vanilla-toast.iife.js"></script>
<script>
  vanillaToast.success('Saved!');
</script>
```

The browser bundle exposes `window.vanillaToast`, `window.VanillaToast.toast`, and the convenience alias `window.toast`.

## NPM Usage

```ts
import { toast } from 'vanilla-toast';
import 'vanilla-toast/style.css';

toast.success('Saved!');
```

## Basic Examples

```ts
toast('Event created');

toast('Event created', {
  description: 'Sunday at 9:00 AM',
  closeButton: true,
});
```

## Toast Types

```ts
toast('Default message');
toast.success('Saved');
toast.error('Failed');
toast.warning('Check your input');
toast.info('New version available');
toast.loading('Uploading...');
```

## Positioning

Each position gets an independent container and stack.

```ts
toast.success('Top right', { position: 'top-right' });
toast.info('Bottom center', { position: 'bottom-center' });
```

Supported positions:

- `top-left`
- `top-center`
- `top-right`
- `bottom-left`
- `bottom-center`
- `bottom-right`

## Close Button

```ts
toast.success('Saved', {
  closeButton: true,
});
```

Enable close buttons globally:

```ts
toast.configure({
  closeButton: true,
});
```

Close buttons are keyboard focusable and use `aria-label="Close notification"`.

## Progress Bar

The progress bar mirrors the auto-dismiss timer. It pauses while the stack is hovered or while focus is inside a toast, then resumes when interaction leaves.

```ts
toast.info('Syncing...', {
  duration: 6000,
  progressBar: true,
});
```

Disable it per toast:

```ts
toast('Plain message', {
  progressBar: false,
});
```

## Promise Toasts

```ts
toast.promise(fetch('/api/save'), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Save failed',
});
```

Messages may be strings, option objects, or functions.

```ts
toast.promise(loadUser(), {
  loading: { title: 'Loading user...', closeButton: true },
  success: (user) => `Welcome ${user.name}`,
  error: (error) => ({
    title: 'Unable to load user',
    description: String(error),
  }),
});
```

## Update Toasts

```ts
const id = toast.loading('Uploading...', {
  closeButton: true,
});

toast.update(id, {
  title: 'Upload complete',
  type: 'success',
  duration: 3000,
});
```

Updates preserve the toast id and rebuild event listeners safely.

## Dismiss Toast

```ts
const id = toast.success('Saved');

toast.dismiss(id);
```

Dismissal plays the exit animation, clears timers, removes listeners, removes the DOM node, and updates the stack.

## Dismiss All

```ts
toast.dismissAll();
```

`toast.dismiss()` with no id is also supported for compatibility.

## Configuration

```ts
toast.configure({
  position: 'bottom-right',
  duration: 4000,
  richColors: false,
  closeButton: true,
  progressBar: true,
  maxVisible: 5,
  theme: 'system',
  animation: 'slide',
  pauseOnHover: true,
  swipeToDismiss: true,
  keyboardDismiss: true,
  expandOnHover: true,
});
```

## Themes

```ts
toast.configure({
  theme: 'dark',
});
```

Supported themes:

- `light`
- `dark`
- `system`

Customize with CSS variables:

```css
:root {
  --vt-bg: #ffffff;
  --vt-color: #171717;
  --vt-border: #e8e8e8;
  --vt-gap: 14px;
  --vt-width: 356px;
  --vt-radius: 8px;
  --vt-shadow: 0 10px 32px rgba(0, 0, 0, 0.12);
  --vt-z-index: 999999;
}
```

## Animations

```ts
toast.success('Saved', {
  animation: 'bounce',
});
```

Supported animations:

- `slide`
- `fade`
- `scale`
- `bounce`

Animations use GPU-friendly transforms and respect `prefers-reduced-motion`.

## TypeScript Support

Types are included and exported from the package.

```ts
import type {
  ToastId,
  ToastOptions,
  ToastPosition,
  ToasterOptions,
  VanillaToastOptions,
} from 'vanilla-toast';

const options: ToastOptions = {
  position: 'top-right',
  closeButton: true,
};
```

## API Reference

```ts
toast(message: string, options?: ToastOptions): ToastId;
toast.success(message: string, options?: ToastOptions): ToastId;
toast.error(message: string, options?: ToastOptions): ToastId;
toast.warning(message: string, options?: ToastOptions): ToastId;
toast.info(message: string, options?: ToastOptions): ToastId;
toast.loading(message: string, options?: ToastOptions): ToastId;
toast.custom(element: HTMLElement, options?: ToastOptions): ToastId;
toast.update(id: ToastId, options: ToastUpdateOptions): void;
toast.dismiss(id?: ToastId): void;
toast.dismissAll(): void;
toast.promise<T>(promise: Promise<T> | (() => Promise<T>), messages: ToastPromiseMessages<T>, options?: ToastOptions): Promise<T>;
toast.configure(options: Partial<ToasterOptions>): void;
```

## Migration Guide

1. Install `vanilla-toast`.
2. Import the CSS once in your app entry.
3. Replace script-tag usage with `vanillaToast` or keep using the `toast` alias.
4. Replace custom CSS selectors with the `vt-*` class names and `--vt-*` variables.
5. Use `toast.dismissAll()` for explicit all-toast dismissal.

## FAQ

**Does Vanilla Toast require a framework?**

No. It works with plain HTML, Vite, Astro, Laravel, Rails, static sites, and framework apps.

**Can I use it from a CDN?**

Yes. Include `vanilla-toast.css` and `vanilla-toast.iife.js`.

**Can users dismiss with the keyboard?**

Yes. Close buttons are native buttons, and `Escape` dismisses the newest active toast by default.

**Can I disable swipe dismissal?**

Yes.

```ts
toast.configure({ swipeToDismiss: false });
```

## Examples

Action toast:

```ts
toast('File deleted', {
  action: {
    label: 'Undo',
    onClick: () => restoreFile(),
  },
  closeButton: true,
});
```

Rich color toast:

```ts
toast.error('Payment failed', {
  description: 'Please check your card details.',
  richColors: true,
});
```

Persistent loading toast:

```ts
const id = toast.loading('Processing...', {
  duration: Infinity,
});
```

## Browser Support

Vanilla Toast targets modern evergreen browsers and uses standard DOM APIs, CSS custom properties, pointer events, and `requestAnimationFrame`.

## License

MIT
