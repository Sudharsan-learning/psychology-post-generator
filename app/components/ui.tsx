"use client";

import { useEffect } from "react";

export type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  durationMs?: number;
}

const ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const COLORS: Record<ToastVariant, string> = {
  success: "bg-emerald-950 border-emerald-700 text-emerald-200",
  error: "bg-red-950 border-red-700 text-red-200",
  info: "bg-neutral-900 border-neutral-700 text-neutral-200",
};

export function Toast({
  message,
  variant = "info",
  onClose,
  durationMs = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onClose]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border shadow-xl
        flex items-center gap-2 text-sm font-semibold backdrop-blur-sm
        animate-in fade-in slide-in-from-bottom-4 duration-200
        ${COLORS[variant]}`}
    >
      <span className="text-base leading-none">{ICONS[variant]}</span>
      {message}
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  theme: "dark" | "light";
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  theme,
}: ConfirmModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDark = theme === "dark";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Panel */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-2xl border shadow-2xl p-6 ${
          isDark
            ? "bg-neutral-900 border-neutral-800 text-neutral-100"
            : "bg-white border-neutral-200 text-neutral-900"
        }`}
      >
        <h2
          id="confirm-title"
          className={`text-base font-bold mb-2 ${
            destructive ? "text-red-400" : isDark ? "text-white" : "text-neutral-900"
          }`}
        >
          {title}
        </h2>
        <p className={`text-sm mb-5 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
          {message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              isDark
                ? "border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                : "border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              destructive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-pink-600 hover:bg-pink-700 text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
