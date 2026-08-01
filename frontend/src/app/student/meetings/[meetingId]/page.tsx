"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Video, Calendar, Clock, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { isWithinInterval, addMinutes, isPast } from "date-fns";
import { useStudentMeeting, useRequestJoinMeeting } from "@/hooks/student/useStudentMeetings";
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

export default function StudentMeetingDetailPage(): React.JSX.Element {
  const { meetingId } = useParams<{ meetingId: string }>();
  const searchParams = useSearchParams();
  const classId = searchParams.get("classId") ?? "";
  const router = useRouter();

  const { data: rawMeeting, isLoading } = useStudentMeeting(classId, meetingId);
  const { mutate: requestJoin, isPending } = useRequestJoinMeeting();

  const meeting =
    rawMeeting && typeof rawMeeting === "object" && "id" in rawMeeting
      ? rawMeeting
      : (((rawMeeting as unknown) as Record<string, unknown>)
          ?.data as typeof rawMeeting | undefined);

  const [requested, setRequested] = useState(
    meeting?.joinRequest?.status === "pending"
  );

  const computedStatus = meeting
    ? getMeetingStatus(meeting.startTime, meeting.status)
    : "upcoming";

  const isLive = computedStatus === "live";
  const isEnded = computedStatus === "ended";

  const STATUS_META = {
    live:     { label: "Live",     className: "bg-green-600 text-white border-transparent" },
    upcoming: { label: "Upcoming", className: "bg-blue-50 text-blue-700 border-blue-200"  },
    ended:    { label: "Ended",    className: "bg-muted text-muted-foreground"             },
  };
  const meta = STATUS_META[computedStatus];

  const handleRequestJoin = () => {
    requestJoin(meetingId, {
      onSuccess: () => {
        setRequested(true);
        toast.success("Join request sent to your educator.");
      },
      onError: () => toast.error("Failed to send join request."),
    });
  };

  const colorIdx = meetingId ? meetingId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={meeting?.title ?? "Meeting"}
        breadcrumbs={[
          { label: "Meetings", href: "/student/meetings" },
          { label: meeting?.title ?? "Meeting" },
        ]}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : meeting ? (
        <>
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className={cn("rounded-md p-2.5 shrink-0", WEEK_COLORS[colorIdx % WEEK_COLORS.length])}>
                <Video className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={cn("text-[11px] font-medium shrink-0", meta.className)}>
                    {meta.label}
                  </Badge>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(meeting.startTime).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {new Date(meeting.startTime).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              {meeting.isInvited ? (
                <Button
                  className={cn(
                    "gap-1.5",
                    isLive
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : ""
                  )}
                  disabled={!isLive || isEnded}
                  onClick={() =>
                    router.push(
                      `/student/meetings/${meetingId}/room?classId=${classId}`
                    )
                  }
                >
                  {isLive ? (
                    <>
                      <Radio className="h-4 w-4 animate-pulse" />
                      Join Room
                    </>
                  ) : isEnded ? (
                    <>
                      <Video className="h-4 w-4" />
                      Meeting Ended
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      Not Live Yet
                    </>
                  )}
                </Button>
              ) : requested ||
                meeting.joinRequest?.status === "pending" ? (
                <Button variant="outline" disabled>
                  Request Sent — Awaiting Educator Approval
                </Button>
              ) : meeting.joinRequest?.status === "accepted" ? (
                <Button
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  disabled={!isLive}
                  onClick={() =>
                    router.push(
                      `/student/meetings/${meetingId}/room?classId=${classId}`
                    )
                  }
                >
                  <Radio className="h-4 w-4" />
                  {isLive ? "Join Room" : "Not Live Yet"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleRequestJoin}
                  disabled={isPending || isEnded}
                >
                  Request to Join
                </Button>
              )}
            </div>

            {!meeting.isInvited &&
              !requested &&
              !meeting.joinRequest && (
                <p className="text-xs text-muted-foreground">
                  You are not invited to this meeting. You can request to join
                  and your educator will approve or decline.
                </p>
              )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Meeting not found.</p>
      )}
    </div>
  );
}
