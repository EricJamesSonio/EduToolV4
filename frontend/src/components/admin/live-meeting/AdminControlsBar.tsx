"use client";

import { useRef } from "react";
import { useMeetingControlsHeight } from "@/hooks/meeting/useMeetingControlsHeight";

export function AdminControlsBar({ children }: { children: React.ReactNode }) {
  const barRef = useRef<HTMLDivElement>(null);
  useMeetingControlsHeight(barRef);

  return (
    <div
      ref={barRef}
      className="meeting-controls relative z-[57] flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-border bg-card px-2 py-2"
    >
      {children}
    </div>
  );
}