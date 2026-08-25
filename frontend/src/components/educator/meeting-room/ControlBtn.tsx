"use client";

import { cn } from "@/lib/utils";

interface ControlBtnProps {
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  label: string;
  hideOnMobile?: boolean;
  mobileOnly?: boolean;
  children: React.ReactNode;
}

export function ControlBtn({
  onClick, active, danger, disabled, label, hideOnMobile = false, mobileOnly = false, children,
}: ControlBtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "meeting-ctrl-btn flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50",
        active  && !danger && "bg-[#BFDBFE] text-[#0B1E3A] border border-[#93C5FD]",
        danger  && "text-[#0B1E3A] bg-[#FF6B6B] border border-[#E85D4E] hover:bg-[#FF6B6B]/90",
        !active && !danger && "text-muted-foreground hover:bg-muted hover:text-foreground",
        hideOnMobile && "meeting-ctrl-btn--hide-mobile",
        mobileOnly  && "meeting-ctrl-btn--mobile-only",
      )}
    >
      {children}
      <span className="meeting-ctrl-label text-[10px] leading-none whitespace-nowrap">{label}</span>
    </button>
  );
}