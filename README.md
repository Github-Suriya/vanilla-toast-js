# Vanilla Sonner

A lightweight, framework-independent toast notification library inspired by Sonner. It ships as a publishable npm package and as CDN-ready ESM, UMD, and IIFE bundles.

## Installation

```bash
npm install vanilla-sonner
```

## CDN Usage

```html
<link rel="stylesheet" href="https://unpkg.com/vanilla-sonner/dist/vanilla-sonner.css" />
<script src="https://unpkg.com/vanilla-sonner/dist/vanilla-sonner.iife.js"></script>
<script>
  toast.success('Saved!');
</script>
```

The IIFE build exposes both `window.toast` and `window.VanillaSonner.toast`.

## npm Usage

```ts
import { toast } from 'vanilla-sonner';
import 'vanilla-sonner/style.css';

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
```

Dismiss all visible toasts:

```ts
toast.dismiss();
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
- Global `toast` for CDN usage
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

## TypeScript

Types are included. The package exports `ToastOptions`, `ToastId`, `ToasterOptions`, and related API types.

```ts
import type { ToastOptions } from 'vanilla-sonner';

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
  vanilla-sonner.es.js
  vanilla-sonner.umd.js
  vanilla-sonner.iife.js
  vanilla-sonner.css
  index.d.ts
```
