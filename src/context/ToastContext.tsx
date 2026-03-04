import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { CheckCircle, Info, XCircle } from "lucide-react";

export type ToastType = "info" | "success" | "error";

export const TOAST_CONFIG = {
  defaultDurations: {
    info: 3000,
    success: 3000,
    error: 4500,
  },
  maxStack: 5,
};

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  visible: boolean;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, durationMs?: number) => string;
  hideToast: (id?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let idCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const animationMs = 240;
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      // clear any outstanding timers on unmount
      Object.values(timers.current).forEach((t) =>
        clearTimeout(t as unknown as number)
      );
      timers.current = {};
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id] as unknown as number);
      delete timers.current[id];
    }
  };

  const hideToast = (id?: string) => {
    if (id) {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      );
      // schedule removal after animation
      window.setTimeout(
        () => removeToast(id),
        animationMs
      ) as unknown as number;
      return;
    }
    // hide all
    setToasts((prev) => prev.map((t) => ({ ...t, visible: false })));
    // schedule removals
    window.setTimeout(() => setToasts([]), animationMs) as unknown as number;
  };

  const showToast = (
    message: string,
    type: ToastType = "info",
    durationMs?: number
  ) => {
    const duration = durationMs ?? TOAST_CONFIG.defaultDurations[type] ?? 3000;
    const id = `${Date.now()}-${++idCounter}`;

    setToasts((prev) => {
      const next = [{ id, message, type, duration, visible: false }, ...prev];
      // enforce max stack
      return next.slice(0, TOAST_CONFIG.maxStack);
    });

    // animate in on next tick
    window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: true } : t))
      );
    }, 10) as unknown as number;

    // schedule auto-hide
    const hideTimer = window.setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      );
      // remove after animation
      window.setTimeout(
        () => removeToast(id),
        animationMs
      ) as unknown as number;
    }, duration) as unknown as number;

    timers.current[id] = hideTimer;
    return id;
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Toast UI rendered at root so it's available globally (bottom-center) */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="flex flex-col items-center gap-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto max-w-2xl w-full px-4 py-3 rounded-lg shadow-lg text-white transform transition-opacity transition-transform duration-200 flex items-center justify-center gap-3 ${
                t.visible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              } ${
                t.type === "error"
                  ? "bg-red-600"
                  : t.type === "success"
                  ? "bg-emerald-600"
                  : "bg-slate-800"
              }`}
            >
              <span className="flex-shrink-0">
                {t.type === "error" ? (
                  <XCircle className="w-5 h-5" />
                ) : t.type === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </span>
              <div className="text-sm text-center">{t.message}</div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

export default ToastContext;
