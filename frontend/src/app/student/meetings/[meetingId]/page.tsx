// src/app/student/meetings/[meetingId]/page.tsx
"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Radio, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-1"
        onClick={() => router.push("/student/meetings")}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Meetings
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : meeting ? (
        <>
          {/* Title + status */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold text-foreground">
                {meeting.title}
              </h1>
              <Badge
                variant="outline"
                className={cn("text-[11px] font-medium shrink-0", meta.className)}
              >
                {meta.label}
              </Badge>
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-lg border border-border/60 bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(meeting.startTime).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {new Date(meeting.startTime).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Action */}
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

            {/* Invite / join request status notice */}
            {!meeting.isInvited &&
              !requested &&
              !meeting.joinRequest && (
                <p className="text-[11px] text-muted-foreground">
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