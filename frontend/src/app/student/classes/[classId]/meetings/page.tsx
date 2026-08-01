"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Video, Calendar, Radio, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  ListItemCardAction,
  listItemCardClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { isWithinInterval, addMinutes, isPast } from "date-fns";
import { useStudentMeetings, useRequestJoinMeeting } from "@/hooks/student/useStudentMeetings";
import type { StudentMeeting } from "@/api/student/meeting.api";
import { toast } from "sonner";

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

function MeetingCard({
  meeting,
  classId,
}: {
  meeting: StudentMeeting;
  classId: string;
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
    if (meeting.isInvited && isLive) {
      return (
        <ListItemCardAction
          icon={Radio}
          label="Join"
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() =>
            router.push(`/student/classes/${classId}/meetings/${meeting.id}/room`)
          }
        />
      );
    }
    if (meeting.isInvited && !isLive && !isEnded) {
      return (
        <ListItemCardAction
          label="Not Live Yet"
          mobileLabel="Soon"
          disabled
        />
      );
    }
    if (requested || meeting.joinRequest?.status === "pending") {
      return (
        <ListItemCardAction
          label="Request Sent"
          mobileLabel="Sent"
          disabled
        />
      );
    }
    return (
      <ListItemCardAction
        label="Request to Join"
        mobileLabel="Request"
        onClick={handleRequestJoin}
        disabled={isPending || isEnded}
      />
    );
  };

  return (
    <div className={listItemCardClass}>
      <div className="flex items-start gap-3">
        <div className={cn("rounded-md p-2 sm:p-2.5 shrink-0",
          WEEK_COLORS[meeting.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % WEEK_COLORS.length])}>
          <Video className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(listItemTitleClass, "truncate")}>
              {meeting.title}
            </h3>
            <Badge variant="outline" className={cn("text-[11px] font-medium shrink-0", meta.className)}>
              {meta.label}
            </Badge>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(meeting.startTime).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {new Date(meeting.startTime).toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {!isLive && (
          <ListItemCardAction
            icon={Eye}
            label="View Details"
            onClick={() =>
              router.push(`/student/classes/${classId}/meetings/${meeting.id}?classId=${classId}`)
            }
          />
        )}
        <div className="ml-auto">{renderAction()}</div>
      </div>
    </div>
  );
}

function MeetingCardSkeleton() {
  return (
    <div className={listItemCardClass}>
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 rounded-md shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-5 w-16 rounded-md shrink-0" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
    </div>
  );
}

export default function StudentClassMeetingsPage(): React.JSX.Element {
  const { classId } = useParams<{ classId: string }>();

  const { data: rawData, isLoading } = useStudentMeetings(classId);
  const meetings: StudentMeeting[] = Array.isArray(rawData)
    ? rawData
    : (((rawData as unknown) as Record<string, unknown>)?.data as StudentMeeting[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings"
        breadcrumbs={[
          { label: "My Classes", href: "/student/classes" },
          { label: "Class", href: `/student/classes/${classId}` },
          { label: "Meetings" },
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <MeetingCardSkeleton key={i} />)}
        </div>
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No meetings for this class"
          description="Meetings will appear here once your educator schedules them."
        />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {meetings.map((m) => (
            <MeetingCard key={m.id} meeting={m} classId={classId} />
          ))}
        </div>
      )}
    </div>
  );
}
