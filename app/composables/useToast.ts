import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const toasts = ref<Toast[]>([]);

export function useToast() {
  function addToast(message: string, type: ToastType = 'info', duration = 10000) {
    const id = Math.random().toString(36).substring(2, 9);

    // Add to top of stack
    toasts.value.unshift({ id, message, type, duration });

    // Limit to 3 toasts max
    if (toasts.value.length > 3) {
      toasts.value.pop();
    }
  }

  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  }

  return {
    toasts,
    addToast,
    removeToast,
  };
}
