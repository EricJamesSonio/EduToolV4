// src/app/student/meetings/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Video, Calendar, Radio, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { isWithinInterval, addMinutes, isPast } from "date-fns";
import { useStudentMeetings, useRequestJoinMeeting } from "@/hooks/student/useStudentMeetings";
import { useStudentClasses } from "@/hooks/student/useStudentClassess";
import type { StudentMeeting } from "@/api/student/meeting.api";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMeetingStatus(
  startTime: string,
  status: string
): "upcoming" | "live" | "ended" {
  if (status === "ended") return "ended";
  const start = new Date(startTime);
  const live = isWithinInterval(new Date(), {
    start: addMinutes(start, -15),
    end: addMinutes(start, 180),
  });
  if (live) return "live";
  if (isPast(start)) return "ended";
  return "upcoming";
}

const STATUS_META = {
  live:     { label: "Live",     className: "bg-green-600 text-white border-transparent" },
  upcoming: { label: "Upcoming", className: "bg-blue-50 text-blue-700 border-blue-200"  },
  ended:    { label: "Ended",    className: "bg-muted text-muted-foreground border-border/60" },
};

// ── Row ───────────────────────────────────────────────────────────────────────

function MeetingRow({
  meeting,
  classId,
  className: subjectName,
}: {
  meeting: StudentMeeting;
  classId: string;
  className: string;
}) {
  const router = useRouter();
  const { mutate: requestJoin, isPending } = useRequestJoinMeeting();
  const [requested, setRequested] = useState(
    meeting.joinRequest?.status === "pending"
  );

  const computedStatus = getMeetingStatus(meeting.startTime, meeting.status);
  const meta = STATUS_META[computedStatus];
  const isLive = computedStatus === "live";
  const isEnded = computedStatus === "ended";

  const handleRequestJoin = () => {
    requestJoin(meeting.id, {
      onSuccess: () => {
        setRequested(true);
        toast.success("Join request sent to educator.");
      },
      onError: () => toast.error("Failed to send join request."),
    });
  };

  const renderAction = () => {
    if (isEnded) {
      return (
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            router.push(`/student/meetings/${meeting.id}?classId=${classId}`)
          }
        >
          View Details
        </Button>
      );
    }
    if (meeting.isInvited && isLive) {
      return (
        <Button
          size="sm"
          className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
          onClick={() =>
            router.push(`/student/meetings/${meeting.id}/room?classId=${classId}`)
          }
        >
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          Join
        </Button>
      );
    }
    if (meeting.isInvited && !isLive) {
      return (
        <Button size="sm" variant="outline" disabled>
          Not Live Yet
        </Button>
      );
    }
    // Not invited
    if (requested || meeting.joinRequest?.status === "pending") {
      return (
        <Button size="sm" variant="outline" disabled>
          Request Sent
        </Button>
      );
    }
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleRequestJoin}
        disabled={isPending || isEnded}
      >
        Request to Join
      </Button>
    );
  };

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3">
      <div className="shrink-0 h-9 w-9 rounded-md bg-muted flex items-center justify-center">
        <Video className="h-4 w-4 text-muted-foreground/60" />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground truncate">
            {meeting.title}
          </span>
          <Badge variant="outline" className={cn("text-[11px] font-medium shrink-0", meta.className)}>
            {meta.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(meeting.startTime).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(meeting.startTime).toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="text-muted-foreground/60">{subjectName}</span>
        </div>
      </div>

      <div className="shrink-0">{renderAction()}</div>
    </div>
  );
}

function MeetingRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 px-4 py-3">
      <Skeleton className="h-9 w-9 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-24 rounded-md shrink-0" />
    </div>
  );
}

// ── ClassMeetings — fetches meetings for one class ────────────────────────────

function ClassMeetings({
  classId,
  subjectName,
}: {
  classId: string;
  subjectName: string;
}) {
  const { data: rawData, isLoading } = useStudentMeetings(classId);
  const meetings: StudentMeeting[] = Array.isArray(rawData)
    ? rawData
    : (((rawData as unknown) as Record<string, unknown>)
        ?.data as StudentMeeting[]) ?? [];

  if (isLoading) {
    return (
      <>
        <MeetingRowSkeleton />
        <MeetingRowSkeleton />
      </>
    );
  }

  return (
    <>
      {meetings.map((m) => (
        <MeetingRow
          key={m.id}
          meeting={m}
          classId={classId}
          className={subjectName}
        />
      ))}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentMeetingsPage(): React.JSX.Element {
  const { data: classesRaw, isLoading: classesLoading } = useStudentClasses();

  const classes = Array.isArray(classesRaw)
    ? classesRaw
    : (((classesRaw as unknown) as Record<string, unknown>)?.data as typeof classesRaw[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Meetings" />

      {classesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <MeetingRowSkeleton key={i} />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Video className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No meetings yet</p>
        </div>
      ) : (
        <div className="space-y-2">
        {classes
        .filter((c): c is NonNullable<typeof c> => c != null)
        .map((c) => (
            <ClassMeetings
            key={c.class.id}
            classId={c.class.id}
            subjectName={c.class.subjectName ?? ""}
            />
        ))}
        </div>
      )}
    </div>
  );
}