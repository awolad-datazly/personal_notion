"use client";

import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";

export type ToastMessage = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

let toastListeners: Array<(toast: ToastMessage) => void> = [];

export const toast = {
  success: (message: string) => emitToast(message, "success"),
  error: (message: string) => emitToast(message, "error"),
  info: (message: string) => emitToast(message, "info"),
};

function emitToast(message: string, type: ToastMessage["type"]) {
  const newToast: ToastMessage = {
    id: Math.random().toString(36).substring(2, 9),
    type,
    message,
  };
  toastListeners.forEach((listener) => listener(newToast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    function handleToast(newToast: ToastMessage) {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    }

    toastListeners.push(handleToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handleToast);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center max-w-md w-full px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-zinc-700/80 bg-zinc-900/95 px-4 py-2.5 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {t.type === "success" ? (
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
          ) : t.type === "error" ? (
            <AlertCircle className="size-4 text-red-400 shrink-0" />
          ) : (
            <Info className="size-4 text-zinc-300 shrink-0" />
          )}
          <span className="text-sm font-medium text-zinc-100">{t.message}</span>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="ml-2 text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
