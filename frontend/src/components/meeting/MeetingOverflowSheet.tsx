"use client";

import { cn } from "@/lib/utils";
import { MeetingBottomSheet } from "./MeetingBottomSheet";
import type { LucideIcon } from "lucide-react";

export interface MeetingOverflowAction {
  key: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  danger?: boolean;
  badge?: number;
  onClick: () => void;
}

interface MeetingOverflowSheetProps {
  open: boolean;
  onClose: () => void;
  actions: MeetingOverflowAction[];
}

/**
 * "More" bottom sheet on mobile. Holds the lower-frequency meeting
 * controls (slides, chat, participants, join requests, reactions,
 * hand raise, fullscreen) that are always-visible buttons on desktop.
 */
export function MeetingOverflowSheet({
  open,
  onClose,
  actions,
}: MeetingOverflowSheetProps) {
  return (
    <MeetingBottomSheet open={open} onClose={onClose} title="More">
      <div className="grid grid-cols-3 gap-2 p-3 pb-6">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              onClick={action.onClick}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-3 shadow-sm transition-colors",
                action.danger
                  ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/85",
                action.active && !action.danger && "ring-2 ring-accent",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-center text-[10px] leading-tight">{action.label}</span>
              {!!action.badge && action.badge > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                  {action.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </MeetingBottomSheet>
  );
}