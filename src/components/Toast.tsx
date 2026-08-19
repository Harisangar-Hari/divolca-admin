interface ToastProps {
    message: string;
    type?: "success" | "error" | "info";
}

export default function Toast({ message, type = "info" }: ToastProps) {
    return (
        <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white
      animate-fade-in
      ${type === "success" ? "bg-green-600" : ""}
      ${type === "error" ? "bg-red-600" : ""}
      ${type === "info" ? "bg-blue-600" : ""}`}
        >
            {message}
        </div>
    );
}