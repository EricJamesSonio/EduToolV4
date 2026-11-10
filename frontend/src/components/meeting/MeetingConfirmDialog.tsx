"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface MeetingConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function MeetingConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: MeetingConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="meeting-confirm-title"
    >
      <div
        className="absolute inset-0 bg-black/60 animate-[meeting-fade-in_150ms_ease-out]"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
        <h2
          id="meeting-confirm-title"
          className="text-base font-semibold text-foreground"
        >
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-9 rounded-lg border border-border bg-muted px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "h-9 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50",
              danger
                ? "border border-[#E85D4E] bg-[#FF6B6B] text-[#0B1E3A] hover:bg-[#FF6B6B]/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}