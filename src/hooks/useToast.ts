import { useState } from "react";

type ToastType = "success" | "error" | "info";

interface ToastState {
    message: string;
    type: ToastType;
}

export function useToast() {
    const [toast, setToast] = useState<ToastState | null>(null);

    const showToast = (message: string, type: ToastType = "info") => {
        setToast({ message, type });

        setTimeout(() => {
            setToast(null);
        }, 2500);
    };

    return {
        toast,
        showToast,
    };
}