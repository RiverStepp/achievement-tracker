import { CheckCircle2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToastItem } from "@/components/ui/use-toast";

type ToastProps = {
  toast: ToastItem;
  onDismiss: (id: string) => void;
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const isDestructive = toast.variant === "destructive";
  const duration = toast.duration ?? 15000;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border bg-app-panel/85 px-4 py-3 text-app-text shadow-md shadow-app-border backdrop-blur-md",
        isDestructive ? "border-rose-500/50" : "border-app-border"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 pr-8">
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-bg",
            isDestructive ? "text-rose-300" : "text-emerald-300"
          )}
        >
          {isDestructive ? (
            <XCircle className="h-4 w-4" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <p className="font-medium text-app-text">
            {toast.title ?? (isDestructive ? "Something went wrong" : "Success")}
          </p>
          {toast.description ? (
            <p className="mt-1 text-sm text-app-muted">{toast.description}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className="absolute right-3 top-3 rounded-md p-1 text-app-muted transition-colors hover:bg-app-bg hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-app-bg/70">
        <div
          className={cn(
            "h-full origin-left animate-toast-progress",
            isDestructive ? "bg-rose-400/80" : "bg-emerald-400/80"
          )}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}
