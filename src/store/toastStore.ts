import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastState {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType) => void;
    removeToast: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
    toasts: [],

    showToast: (message, type = "info") => {
        const id = Date.now().toString();

        set((state) => ({
            toasts: [...state.toasts, { id, message, type }],
        }));

        // auto remove after 3 sec
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, 3000);
    },

    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        })),
}));