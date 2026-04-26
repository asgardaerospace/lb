"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ToastTone = "info" | "success" | "warning" | "error";

interface Toast {
  id: string;
  tone: ToastTone;
  title: string;
  body?: string;
  /** Auto-dismiss after this many ms; 0 disables auto-dismiss. */
  duration: number;
}

interface ToastInput {
  tone?: ToastTone;
  title: string;
  body?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4500;

const TONE: Record<ToastTone, string> = {
  info: "border-sky-500/30 bg-sky-500/10 text-sky-100",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-100",
};

const ICON: Record<ToastTone, string> = {
  info: "ℹ",
  success: "✓",
  warning: "⚠",
  error: "⚠",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next: Toast = {
      id,
      tone: input.tone ?? "info",
      title: input.title,
      body: input.body,
      duration: input.duration ?? DEFAULT_DURATION,
    };
    setToasts((prev) => [...prev, next]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback that no-ops when used outside the provider — keeps optional
    // toast calls in shared components from crashing if mounted in isolation.
    return {
      toast: () => "",
      dismiss: () => {},
    };
  }
  return ctx;
}

function Toaster({
  toasts,
  dismiss,
}: {
  toasts: Toast[];
  dismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (toast.duration <= 0) return;
    const t = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(t);
  }, [toast.duration, onDismiss]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={`pointer-events-auto flex items-start gap-2 rounded-md border px-3 py-2 shadow-2xl backdrop-blur ${TONE[toast.tone]}`}
    >
      <span className="mt-0.5 select-none text-sm leading-none" aria-hidden>
        {ICON[toast.tone]}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold leading-snug">
          {toast.title}
        </div>
        {toast.body && (
          <div className="mt-0.5 text-[12px] opacity-90">{toast.body}</div>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-m-1 ml-2 rounded p-1 text-current/70 transition hover:text-current"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden
        >
          <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
