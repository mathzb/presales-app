import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { ReactNode } from "react";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

export default function Alert({
  type = "info",
  title,
  children,
  onClose,
}: AlertProps) {
  const config = {
    info: {
      icon: Info,
      containerClass:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200",
      iconClass: "text-blue-600 dark:text-blue-400",
      titleClass: "text-blue-900 dark:text-blue-200",
    },
    success: {
      icon: CheckCircle,
      containerClass:
        "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200",
      iconClass: "text-emerald-600 dark:text-emerald-400",
      titleClass: "text-emerald-900 dark:text-emerald-200",
    },
    warning: {
      icon: AlertCircle,
      containerClass:
        "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200",
      iconClass: "text-amber-600 dark:text-amber-400",
      titleClass: "text-amber-900 dark:text-amber-200",
    },
    error: {
      icon: XCircle,
      containerClass:
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200",
      iconClass: "text-red-600 dark:text-red-400",
      titleClass: "text-red-900 dark:text-red-200",
    },
  };

  const { icon: Icon, containerClass, iconClass, titleClass } = config[type];

  return (
    <div className={`rounded-lg border p-4 ${containerClass} relative`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconClass}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold mb-1 ${titleClass}`}>{title}</h4>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Close alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
