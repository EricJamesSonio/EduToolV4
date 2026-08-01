"use client";

import { cn } from "@/lib/utils";

interface MeetingBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Extra padding/sizing for the body region */
  className?: string;
  children: React.ReactNode;
}

/**
 * Mobile-only slide-up drawer used for secondary meeting content
 * (chat, participants, slides, overflow menu). Renders nothing on
 * tablet/desktop — those sizes use the inline sidebar/rail instead.
 */
export function MeetingBottomSheet({
  open,
  onClose,
  title,
  className,
  children,
}: MeetingBottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] sm:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 animate-[meeting-fade-in_150ms_ease-out]"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-[78vh] rounded-t-2xl border-t border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col animate-[meeting-sheet-up_250ms_ease-out]">
        {/* Drag handle */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-zinc-700" />
        {title && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 shrink-0">
            <span className="text-sm font-medium text-white capitalize">{title}</span>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className={cn("flex-1 overflow-hidden", className)}>{children}</div>
      </div>
    </div>
  );
}
