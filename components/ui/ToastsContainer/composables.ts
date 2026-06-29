export type ToastType = 'success' | 'error' | 'warning';

interface AddToast {
  title: string;
  description?: string;
  delay?: number;
  manual?: boolean;
  noProgress?: boolean;
  noBorder?: boolean;
  type?: ToastType;
  customComponent?: Component;
  loader?: {
    show: boolean;
    color: string;
  };
  icon?: {
    name: string;
    color: string;
  };
}

type Toast = AddToast & {
  id: string;
};

const DEFAULT_DELAY = 5000;
const MAX_VISIBLE_TOASTS = 3;

const toasts = ref<Toast[]>([]);

export const useToasts = () => {
  const add = (toast: AddToast) => {
    const toastToAdd: Toast = {
      ...toast,
      type: toast.type ?? 'success',
      id: Math.random().toString(36).substring(2, 9),
    };

    if (toastToAdd.type === 'error') {
      toastToAdd.delay = 0;
    } else if (toast.delay !== 0) {
      toastToAdd.delay = toast.delay ?? DEFAULT_DELAY;
    }

    toasts.value.push(toastToAdd);

    if (toasts.value.length > MAX_VISIBLE_TOASTS) {
      toasts.value.splice(0, toasts.value.length - MAX_VISIBLE_TOASTS);
    }

    return toastToAdd;
  };

  const update = (id: string, updates: Partial<AddToast>) => {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index === -1) return;

    const current = toasts.value[index];
    if (!current) return;
    const updated = { ...current, ...updates };

    if (updates.delay !== undefined && updates.delay !== 0) {
      updated.delay = updates.delay;
    }

    toasts.value.splice(index, 1, updated);
  };

  const remove = (id: string) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  };

  return {
    toasts,
    add,
    update,
    remove,
  };
};
