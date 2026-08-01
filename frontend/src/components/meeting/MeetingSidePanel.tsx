"use client";

import { cn } from "@/lib/utils";

interface MeetingSidePanelProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Side panel for chat / participants / join-requests.
 * Desktop: inline fixed-width sidebar to the right of the stage.
 * Mobile: slide-up bottom sheet overlaying the full-bleed stage.
 */
export function MeetingSidePanel({ title, onClose, children, className }: MeetingSidePanelProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/60 sm:hidden animate-[meeting-fade-in_150ms_ease-out]"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={cn(
          // Mobile: bottom sheet
          "fixed inset-x-0 bottom-0 z-[56] max-h-[78vh] rounded-t-2xl border-t border-zinc-800 bg-zinc-900 flex flex-col",
          "animate-[meeting-sheet-up_250ms_ease-out]",
          // Desktop: inline sidebar
          "sm:relative sm:inset-x-auto sm:bottom-auto sm:z-auto sm:max-h-none sm:rounded-none sm:border-t-0 sm:border-l sm:w-72 sm:animate-none",
          className,
        )}
      >
        {/* Mobile drag handle */}
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-zinc-700 sm:hidden" />
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
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </>
  );
}
