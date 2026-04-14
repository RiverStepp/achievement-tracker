import { useEffect, useState } from "react";

export type ToastTone = "default" | "destructive";

export type ToastItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastTone;
  duration?: number;
  createdAt: number;
};

let memoryState: ToastItem[] = [];
const listeners = new Set<(toasts: ToastItem[]) => void>();

const emit = () => {
  for (const listener of listeners) {
    listener(memoryState);
  }
};

const dismissTimeouts = new Map<string, number>();

function scheduleDismiss(id: string, duration = 15000) {
  const existing = dismissTimeouts.get(id);
  if (existing) {
    window.clearTimeout(existing);
  }

  const timeoutId = window.setTimeout(() => {
    dismiss(id);
  }, duration);

  dismissTimeouts.set(id, timeoutId);
}

export function dismiss(id?: string) {
  if (id) {
    const timeoutId = dismissTimeouts.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      dismissTimeouts.delete(id);
    }

    memoryState = memoryState.filter((toast) => toast.id !== id);
    emit();
    return;
  }

  for (const timeoutId of dismissTimeouts.values()) {
    window.clearTimeout(timeoutId);
  }
  dismissTimeouts.clear();
  memoryState = [];
  emit();
}

export function toast({
  title,
  description,
  variant = "default",
  duration = 15000,
}: Omit<ToastItem, "id" | "createdAt">) {
  const id = crypto.randomUUID();
  memoryState = [
    ...memoryState,
    {
      id,
      title,
      description,
      variant,
      duration,
      createdAt: Date.now(),
    },
  ];
  emit();
  scheduleDismiss(id, duration);

  return {
    id,
    dismiss: () => dismiss(id),
  };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(memoryState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}
