"use client";

import Link from "next/link";
import { Radio, Users } from "lucide-react";
import type { LiveMeeting } from "@/types/admin/live-meeting.types";

interface LiveMeetingCardProps {
  meeting: LiveMeeting;
}

export function LiveMeetingCard({ meeting }: LiveMeetingCardProps) {
  const classLabel = meeting.subjectCode
    ? `${meeting.subjectName} (${meeting.subjectCode})`
    : meeting.subjectName;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{meeting.title}</h3>
          <p className="truncate text-xs text-muted-foreground">{classLabel}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-600">
          <Radio className="h-3 w-3" />
          Live
        </span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Host: {meeting.educatorName}</p>
        <p className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {meeting.participantCount} in the room
        </p>
        {meeting.isEphemeral && <p>Started from class chat</p>}
      </div>

      <Link
        href={`/admin/live-meetings/${meeting.id}`}
        className="mt-auto inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Watch
      </Link>
    </div>
  );
}