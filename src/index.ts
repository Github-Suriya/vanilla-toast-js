import './styles/sonner.css';
import { toast } from './toast';

if (typeof window !== 'undefined') {
  window.toast = toast;
  window.VanillaSonner = { toast };
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
