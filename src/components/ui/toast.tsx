"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "gold";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Global toast state — simple event-based system, no external library needed
const listeners: Array<(toast: Toast) => void> = [];

export function showToast(message: string, type: ToastType = "success") {
  const toast: Toast = { id: Math.random().toString(36).slice(2), message, type };
  listeners.forEach((fn) => fn(toast));
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === "success" && <CheckCircle size={18} className="shrink-0" />}
          {t.type === "error"   && <XCircle     size={18} className="shrink-0" />}
          {t.type === "gold"    && <AlertCircle  size={18} className="shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
            className="opacity-50 hover:opacity-100 transition shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
