import './styles/vanilla-toast.css';
import { toast } from './toast';

if (typeof window !== 'undefined') {
  window.vanillaToast = toast;
  window.toast = toast;
  window.VanillaToast = { toast };
}

export { toast };
export type {
  ToastAction,
  ToastAnimation,
  ToastApi,
  ToastId,
  ToastOptions,
  ToastPosition,
  ToastPromiseMessages,
  ToastTheme,
  ToastType,
  ToastUpdateOptions,
  ToasterOptions,
} from './types';
