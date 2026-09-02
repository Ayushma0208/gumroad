import { create } from "zustand";

export type ToastMessage = {
  id: string;
  title: string;
  description?: string;
};

type ToastState = {
  toasts: ToastMessage[];
  show: (input: Omit<ToastMessage, "id">) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (input) => {
    const id = `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    set({ toasts: [...get().toasts.slice(-2), { ...input, id }] });
    window.setTimeout(() => {
      get().dismiss(id);
    }, 2800);
  },
  dismiss: (id) =>
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),
}));
