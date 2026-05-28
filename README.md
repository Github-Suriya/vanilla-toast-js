# Vanilla Toast

A lightweight standalone toast notification library for Vanilla JavaScript. It is framework independent, mobile friendly, accessible, and ships with npm and CDN-ready builds.

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

The IIFE build exposes `window.vanillaToast`, `window.VanillaToast.toast`, and the convenience alias `window.toast`.

## npm Usage

```ts
import { toast } from 'vanilla-toast';
import 'vanilla-toast/style.css';

toast('My first toast');
toast.success('Saved!');
toast.error('Something went wrong');
```

## API

```ts
toast('Message');

toast.success('Saved');
toast.error('Failed');
toast.warning('Warning');
toast.info('Info');
toast.loading('Loading');
```

Every toast method returns an id:

```ts
const id = toast.loading('Uploading...');

toast.update(id, {
  title: 'Upload complete',
  type: 'success',
});

toast.dismiss(id);
toast.dismissAll();
```

Dismiss all visible toasts:

```ts
toast.dismiss();
toast.dismissAll();
```

## Promise Toasts

```ts
toast.promise(fetch('/api/save'), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Save failed',
});
```

Messages can also be functions or full toast options:

```ts
toast.promise(fetchUser(), {
  loading: { title: 'Loading user...', closeButton: true },
  success: (user) => `Welcome ${user.name}`,
  error: (error) => ({
    title: 'Unable to load user',
    description: String(error),
  }),
});
```

## Custom Content

```ts
const element = document.createElement('div');
element.innerHTML = '<strong>Custom toast</strong>';

toast.custom(element, {
  duration: 6000,
});
```

## Configuration

```ts
toast.configure({
  position: 'bottom-right',
  duration: 4000,
  richColors: true,
  closeButton: true,
  maxVisible: 5,
  theme: 'system',
  animation: 'slide',
});
```

Per-toast positioning overrides the global default:

```ts
toast.success('Saved!', {
  position: 'top-right',
  closeButton: true,
});
```

Supported positions:

- `top-left`
- `top-center`
- `top-right`
- `bottom-left`
- `bottom-center`
- `bottom-right`

Supported animations:

- `slide`
- `fade`
- `scale`
- `bounce`

## Toast Options

```ts
toast.success('Event created', {
  description: 'Sunday at 9:00 AM',
  duration: 5000,
  richColors: true,
  closeButton: true,
  progressBar: true,
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
  cancel: {
    label: 'Cancel',
    onClick: () => console.log('Cancel'),
  },
});
```

## Features

- Pure Vanilla JavaScript with TypeScript types
- ESM, UMD, and IIFE builds
- Global `vanillaToast` for CDN usage
- Convenience `toast` alias for script tags
- Independent containers for each toast position
- Stacking with hover expansion
- Queue visibility via `maxVisible`
- Auto dismiss with progress bar
- Pause on hover and focus
- Swipe dismiss with touch and pointer support
- Escape key dismiss
- Dark, light, and system themes
- Rich colors
- Promise and update handling
- Accessible `role="status"` and `aria-live="polite"`

## CSS Customization

```css
:root {
  --vt-bg: #ffffff;
  --vt-color: #171717;
  --vt-gap: 14px;
  --vt-width: 356px;
  --vt-radius: 8px;
  --vt-shadow: 0 10px 32px rgba(0, 0, 0, 0.12);
  --vt-z-index: 999999;
}
```

## TypeScript

Types are included. The package exports `ToastOptions`, `ToastId`, `ToasterOptions`, and related API types.

```ts
import type { ToastOptions } from 'vanilla-toast';

const options: ToastOptions = {
  description: 'Typed options',
  closeButton: true,
};
```

## Build

```bash
npm run build
```

The build outputs:

```text
dist/
  vanilla-toast.es.js
  vanilla-toast.umd.js
  vanilla-toast.iife.js
  vanilla-toast.css
  index.d.ts
```
