"use client";

import { ArrowLeft } from "lucide-react";
import type { LiveMeeting } from "@/types/admin/live-meeting.types";

interface AdminRoomHeaderProps {
  meeting: LiveMeeting | null;
  status: string;
  onBack: () => void;
}

export function AdminRoomHeader({ meeting, status, onBack }: AdminRoomHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to live meetings"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="!m-0 truncate text-sm font-semibold text-foreground">
          {meeting?.title ?? "Live meeting"}
        </h1>
        {meeting && (
          <p className="truncate text-xs text-muted-foreground">
            {meeting.subjectName} - Host: {meeting.educatorName}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground">
        {status}
      </span>
    </div>
  );
}