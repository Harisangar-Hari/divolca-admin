import { useToast } from "../store/toastStore";

export default function ToastContainer() {
    const { toasts } = useToast();

    return (
        <div className="fixed top-4 right-4 space-y-2 z-[9999]">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`
            px-4 py-3 rounded-lg shadow-lg text-white
            transition-all duration-300
            cursor-pointer
            ${t.type === "success"
                            ? "bg-green-600"
                            : t.type === "error"
                                ? "bg-red-600"
                                : "bg-gray-800"
                        }
          `}
                >
                    {t.message}
                </div>
            ))}
        </div>
    );
}