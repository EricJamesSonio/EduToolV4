"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, isPast, isWithinInterval, addMinutes } from "date-fns";
import {
  Calendar, Users, Radio, ArrowLeft, Pencil,
  UserPlus, UserMinus, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMeeting,
  useEnrolledStudents,
  useUpdateMeeting,
  useRespondToJoinRequest,
} from "@/hooks/educator/useMeeting";
import { cn } from "@/lib/utils";
import type { AxiosError } from "axios";
import type { EnrolledStudent } from "@/types/educator/meeting.types";

interface Props {
  params: Promise<{ classId: string; meetingId: string }>;
}

function getMeetingStatus(startTime: string, status: string): "upcoming" | "live" | "ended" {
  if (status === "ended") return "ended";
  const start = new Date(startTime);
  const live = isWithinInterval(new Date(), {
    start: addMinutes(start, -15),
    end:   addMinutes(start, 180),
  });
  if (live) return "live";
  if (isPast(start)) return "ended";
  return "upcoming";
}

export default function MeetingDetailPage({ params }: Props) {
  const { classId, meetingId } = use(params);
  const router = useRouter();

  const { data: meeting, isLoading }   = useMeeting(classId, meetingId);
  const { data: studentsRaw }          = useEnrolledStudents(classId);
  const updateMutation                 = useUpdateMeeting(classId);
  const respondMutation                = useRespondToJoinRequest(classId, meetingId);

  const students: EnrolledStudent[] = Array.isArray(studentsRaw) ? studentsRaw : [];
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [showAddInvite, setShowAddInvite]         = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-muted-foreground">Meeting not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const computedStatus = getMeetingStatus(meeting.startTime, meeting.status);
  const isLive         = computedStatus === "live";
  const isEnded        = computedStatus === "ended";
  const invitedIds     = new Set(meeting.invites.map((i) => i.studentId));
  const pendingRequests = meeting.joinRequests.filter((r) => r.status === "pending");

  // Students not yet invited (for add invite)
  const uninvitedStudents = students.filter((s) => !invitedIds.has(s.id));

  const handleRemoveInvite = (studentId: string) => {
    const newIds = [...invitedIds].filter((id) => id !== studentId);
    updateMutation.mutate(
      { meetingId, dto: { invitedStudentIds: newIds } },
      {
        onSuccess: () => toast.success("Invite removed."),
        onError: (err: unknown) => {
          const e = err as AxiosError<{ message: string }>;
          toast.error(e?.response?.data?.message ?? "Failed to remove invite.");
        },
      }
    );
    setShowRemoveConfirm(null);
  };

  const handleAddInvite = (studentId: string) => {
    const newIds = [...invitedIds, studentId];
    updateMutation.mutate(
      { meetingId, dto: { invitedStudentIds: newIds } },
      {
        onSuccess: () => toast.success("Student invited."),
        onError: (err: unknown) => {
          const e = err as AxiosError<{ message: string }>;
          toast.error(e?.response?.data?.message ?? "Failed to add invite.");
        },
      }
    );
  };

  const handleRespond = (reqId: string, status: "accepted" | "declined") => {
    respondMutation.mutate(
      { reqId, status },
      {
        onSuccess: () => toast.success(status === "accepted" ? "Request accepted." : "Request declined."),
        onError: (err: unknown) => {
          const e = err as AxiosError<{ message: string }>;
          toast.error(e?.response?.data?.message ?? "Failed to respond.");
        },
      }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={meeting.title}
        breadcrumbs={[
          { label: "Meetings", href: `/educator/classes/${classId}/meetings` },
          { label: meeting.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {!isEnded && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/educator/classes/${classId}/meetings/${meetingId}/edit`)}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
            {isLive && (
              <Button
                size="sm"
                className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => router.push(`/educator/classes/${classId}/meetings/${meetingId}/room`)}
              >
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                Enter Room
              </Button>
            )}
          </div>
        }
      />

      {/* Meeting info card */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge
            variant={isLive ? "default" : isEnded ? "outline" : "secondary"}
            className={cn("text-xs", isLive && "bg-green-600 text-white")}
          >
            {isLive ? "Live" : isEnded ? "Ended" : "Upcoming"}
          </Badge>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {format(new Date(meeting.startTime), "MMMM d, yyyy · h:mm a")}
          </span>
        </div>
        {meeting.description && (
          <p className="text-sm text-muted-foreground">{meeting.description}</p>
        )}
      </div>

      {/* Invite Manager */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Invited Students</h2>
            <p className="text-sm text-muted-foreground">{invitedIds.size} invited</p>
          </div>
          {!isEnded && uninvitedStudents.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddInvite((v) => !v)}
              className="gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add Student
            </Button>
          )}
        </div>

        {/* Add invite list */}
        {showAddInvite && (
          <ScrollArea className="max-h-40 rounded-md border">
            <div className="p-2 space-y-1">
              {uninvitedStudents.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">{s.fullName}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 h-7 px-2 text-xs"
                    onClick={() => handleAddInvite(s.id)}
                    disabled={updateMutation.isPending}
                  >
                    <UserPlus className="h-3 w-3" />
                    Invite
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Invited list */}
        {invitedIds.size === 0 ? (
          <p className="text-sm text-muted-foreground">No students invited yet.</p>
        ) : (
          <div className="space-y-1">
            {meeting.invites.map((invite) => {
              const student = students.find((s) => s.id === invite.studentId);
              return (
                <div key={invite.id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">{student?.fullName ?? invite.studentId}</p>
                    {student?.email && (
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    )}
                  </div>
                  {!isEnded && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setShowRemoveConfirm(invite.studentId)}
                      disabled={updateMutation.isPending}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Join Requests */}
      {pendingRequests.length > 0 && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div>
            <h2 className="font-semibold">Join Requests</h2>
            <p className="text-sm text-muted-foreground">{pendingRequests.length} pending</p>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((req) => {
              const student = students.find((s) => s.id === req.studentId);
              return (
                <div key={req.id} className="flex items-center justify-between px-3 py-2 rounded-md border">
                  <div>
                    <p className="text-sm font-medium">{student?.fullName ?? req.studentId}</p>
                    {student?.email && (
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 gap-1 text-xs text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => handleRespond(req.id, "accepted")}
                      disabled={respondMutation.isPending}
                    >
                      <Check className="h-3 w-3" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 gap-1 text-xs text-destructive border-destructive/20 hover:bg-destructive/5"
                      onClick={() => handleRespond(req.id, "declined")}
                      disabled={respondMutation.isPending}
                    >
                      <X className="h-3 w-3" />
                      Decline
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Remove invite confirm */}
      <ConfirmDialog
        open={!!showRemoveConfirm}
        onOpenChange={(o) => { if (!o) setShowRemoveConfirm(null); }}
        title="Remove invite?"
        message="This student will no longer be invited to this meeting."
        confirmLabel="Remove"
        destructive
        onConfirm={() => showRemoveConfirm && handleRemoveInvite(showRemoveConfirm)}
      />
    </div>
  );
}