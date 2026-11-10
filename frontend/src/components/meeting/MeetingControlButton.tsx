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
        "relative inline-flex shrink-0 items-center justify-center rounded-full border border-transparent shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        wide ? "h-11 w-16" : "h-11 w-11",
        danger
          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/85",
        active && !danger && "ring-2 ring-accent",
        hideOnMobile && "meeting-ctrl-btn--hide-mobile",
        mobileOnly && "meeting-ctrl-btn--mobile-only",
      )}
    >
      {children}
      {badge > 0 && (
        <span className="pointer-events-none absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}