// src/app/educator/classes/[classId]/meetings/[meetingId]/page.tsx
"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, isPast, isWithinInterval, addMinutes } from "date-fns";
import {
  Calendar, Radio, Pencil, Video,
  UserPlus, UserMinus, Check, X, Users,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMeeting,
  useEnrolledStudents,
  useUpdateMeeting,
  useRespondToJoinRequest,
} from "@/hooks/educator/useMeeting";
import { WEEK_COLORS } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { AxiosError } from "axios";
import type { EnrolledStudent } from "@/types/educator/meeting.types";
import {
  loadAttendance,
  formatDuration,
  type SavedAttendance,
} from "@/utils/meetingAttendanceStorage";

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

// ── Attendance card shown on ended meetings ───────────────────────────────────

function AttendanceCard({ attendance }: { attendance: SavedAttendance }) {
  const [open, setOpen] = useState(false);

  const sorted = [...attendance.records].sort((a, b) => {
    if (a.role !== b.role) return a.role === "educator" ? -1 : 1;
    return b.totalSeconds - a.totalSeconds;
  });

  const avgSeconds = sorted.length > 0
    ? Math.round(sorted.reduce((s, r) => s + r.totalSeconds, 0) / sorted.length)
    : 0;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header — always visible, clickable to expand */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Attendance Record</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sorted.length} participant{sorted.length !== 1 ? "s" : ""} · avg {formatDuration(avgSeconds)}
            </p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground" />
        }
      </button>

      {/* Expanded table */}
      {open && (
        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground">
                <TableHead className="text-primary-foreground">Participant</TableHead>
                <TableHead className="text-primary-foreground">Role</TableHead>
                <TableHead className="text-primary-foreground">Sessions</TableHead>
                <TableHead className="text-primary-foreground text-right">Total Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((record) => (
                <TableRow key={record.userId} className="bg-white">
                  {/* Name */}
                  <TableCell className="font-medium">{record.name}</TableCell>

                  {/* Role badge */}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        record.role === "educator"
                          ? "border-indigo-200 text-indigo-700 bg-indigo-50"
                          : "border-green-200 text-green-700 bg-green-50"
                      )}
                    >
                      {record.role}
                    </Badge>
                  </TableCell>

                  {/* Session breakdown */}
                  <TableCell>
                    {record.sessions.length === 1 ? (
                      <span className="text-sm text-muted-foreground">1 session</span>
                    ) : (
                      <div className="space-y-0.5">
                        {record.sessions.map((s, i) => {
                          const elapsed = s.leftAt > 0
                            ? Math.round((s.leftAt - s.joinedAt) / 1000)
                            : Math.round((Date.now() - s.joinedAt) / 1000);
                          return (
                            <p key={i} className="text-xs text-muted-foreground">
                              Session {i + 1}: {formatDuration(elapsed)}
                            </p>
                          );
                        })}
                      </div>
                    )}
                  </TableCell>

                  {/* Total */}
                  <TableCell className="text-right">
                    <span className={cn(
                      "text-sm font-semibold",
                      record.totalSeconds >= 60 ? "text-green-700" : "text-muted-foreground"
                    )}>
                      {formatDuration(record.totalSeconds)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
            Saved locally on {format(new Date(attendance.savedAt), "MMM d, yyyy · h:mm a")} · resets when browser data is cleared
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

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

  // Load saved attendance from localStorage (only present if educator ended the meeting)
  const [savedAttendance, setSavedAttendance] = useState<SavedAttendance | null>(null);
  useEffect(() => {
    setSavedAttendance(loadAttendance(meetingId));
  }, [meetingId]);

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

  const computedStatus  = getMeetingStatus(meeting.startTime, meeting.status);
  const isLive          = computedStatus === "live";
  const isEnded         = computedStatus === "ended";
  const invitedIds      = new Set(meeting.invites.map((i) => i.studentId));
  const pendingRequests = meeting.joinRequests.filter((r) => r.status === "pending");
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
    <div className="space-y-6">
      <PageHeader
        title={meeting.title}
        description="View meeting details and join when live."
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
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn("rounded-md p-2.5 shrink-0", WEEK_COLORS[meetingId.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % WEEK_COLORS.length])}>
            <Video className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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
              <p className="text-sm text-muted-foreground mt-3">{meeting.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Attendance record (only for ended meetings that have saved data) ── */}
      {isEnded && savedAttendance && (
        <AttendanceCard attendance={savedAttendance} />
      )}

      {/* Invited Students */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {invitedIds.size} student{invitedIds.size !== 1 ? "s" : ""} invited
          </p>
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

        {invitedIds.size === 0 ? (
          <p className="text-sm text-muted-foreground">No students invited yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground">
                <TableHead className="text-primary-foreground">Student</TableHead>
                <TableHead className="text-primary-foreground">Email</TableHead>
                {!isEnded && <TableHead className="text-primary-foreground text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {meeting.invites.map((invite) => {
                const student = students.find((s) => s.id === invite.studentId);
                return (
                  <TableRow key={invite.id} className="bg-white">
                    <TableCell className="font-medium">{student?.fullName ?? invite.studentId}</TableCell>
                    <TableCell className="text-muted-foreground">{student?.email ?? "—"}</TableCell>
                    {!isEnded && (
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setShowRemoveConfirm(invite.studentId)}
                          disabled={updateMutation.isPending}
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Join Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {pendingRequests.length} pending request{pendingRequests.length !== 1 ? "s" : ""}
          </p>
          <Table>
            <TableHeader>
              <TableRow className="bg-primary text-primary-foreground">
                <TableHead className="text-primary-foreground">Student</TableHead>
                <TableHead className="text-primary-foreground">Email</TableHead>
                <TableHead className="text-primary-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((req) => {
                const student = students.find((s) => s.id === req.studentId);
                return (
                  <TableRow key={req.id} className="bg-white">
                    <TableCell className="font-medium">{student?.fullName ?? req.studentId}</TableCell>
                    <TableCell className="text-muted-foreground">{student?.email ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

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