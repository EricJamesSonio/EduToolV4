"use client";

import { cn } from "@/lib/utils";

interface MeetingControlButtonProps {
  onClick: () => void;
  label: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  hideOnMobile?: boolean;
  mobileOnly?: boolean;
  wide?: boolean;
  badge?: number;
  children: React.ReactNode;
}

export function MeetingControlButton({
  onClick,
  label,
  active = false,
  danger = false,
  disabled = false,
  hideOnMobile = false,
  mobileOnly = false,
  wide = false,
  badge = 0,
  children,
}: MeetingControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        wide ? "h-11 w-16" : "h-11 w-11",
        danger
          ? "border-transparent bg-destructive text-white hover:bg-destructive/90"
          : active
            ? "border-primary/30 bg-primary/15 text-primary hover:bg-primary/20"
            : "border-border/60 bg-muted text-foreground hover:bg-muted/70",
        hideOnMobile && "meeting-ctrl-btn--hide-mobile",
        mobileOnly && "meeting-ctrl-btn--mobile-only",
      )}
    >
      {children}
      {badge > 0 && (
        <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[9px] font-bold text-warning-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}