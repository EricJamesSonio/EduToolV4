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
                "relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-1 transition-colors",
                action.active && !action.danger
                  ? "bg-primary/15 text-primary"
                  : action.danger
                    ? "text-destructive hover:bg-destructive/10"
                    : "bg-muted text-foreground hover:bg-muted/70",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] leading-tight text-center">{action.label}</span>
              {!!action.badge && action.badge > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-warning text-warning-foreground text-[9px] font-bold flex items-center justify-center">
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
