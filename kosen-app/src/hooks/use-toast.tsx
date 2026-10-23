"use client";

import * as React from "react";
import Link from "next/link";

type ToastVariant = "default" | "error" | "success";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  actionHref?: string;
  actionLabel?: string;
};

type ToastItem = ToastInput & { id: number };

type ToastContextValue = {
  toast: (input: ToastInput) => number;
  dismiss: (id: number) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<ToastVariant, string> = {
  default: "border-orange-subtle-2 bg-background text-black-1",
  error: "border-negative-subtle bg-noti-negative-subtle text-negative-primary",
  success: "border-green-200 bg-green-50 text-green-900",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const nextId = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = React.useCallback(
    (input: ToastInput) => {
      const id = ++nextId.current;
      setToasts((current) => [...current, { ...input, id }]);
      window.setTimeout(() => dismiss(id), 5000);
      return id;
    },
    [dismiss],
  );

  const contextValue = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.variant === "error" ? "alert" : "status"}
            className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg ${TOAST_STYLES[item.variant ?? "default"]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description && (
                  <p className="text-sm opacity-90">{item.description}</p>
                )}
                {item.actionHref && item.actionLabel && (
                  <Link
                    href={item.actionHref}
                    className="inline-block text-sm font-medium underline underline-offset-2"
                  >
                    {item.actionLabel}
                  </Link>
                )}
              </div>
              <button
                type="button"
                className="text-sm opacity-70 hover:opacity-100"
                onClick={() => dismiss(item.id)}
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
