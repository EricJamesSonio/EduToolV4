"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronLeft,
  Save,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAttendanceSession,
  useBulkSetAttendance,
} from "@/hooks/educator/useAttendance";

import { Button } from "@/components/ui/button";
import type { AttendanceStatus } from "@/types/educator/attendance.types";
import type { AttendanceRecord } from "@/api/educator/attendance.api";

interface RowState {
  recordId: string | null;
  studentId: string;
  studentName: string;
  studentCode: string;
  status: AttendanceStatus;
  autoSet: boolean;
  dirty: boolean;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    label: string;
    icon: React.ReactNode;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  present: {
    label: "Present",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    variant: "default",
  },
  absent: {
    label: "Absent",
    icon: <XCircle className="h-3.5 w-3.5" />,
    variant: "destructive",
  },
  late: {
    label: "Late",
    icon: <Clock className="h-3.5 w-3.5" />,
    variant: "secondary",
  },
  excused: {
    label: "Excused",
    icon: <FileText className="h-3.5 w-3.5" />,
    variant: "outline",
  },
};

const ALL_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
];

function StatusChip({
  status,
  selected,
  onClick,
  disabled,
}: {
  status: AttendanceStatus;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const cfg = STATUS_CONFIG[status];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors
        ${
          selected
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-background text-muted-foreground border-border hover:text-foreground"
        }`}
    >
      {cfg.icon}
      {cfg.label}
    </button>
  );
}

export default function AttendanceSessionPage() {
  const { classId, sessionId } = useParams<{
    classId: string;
    sessionId: string;
  }>();

  const router = useRouter();

  const { data: session, isLoading } = useAttendanceSession(
    classId,
    sessionId
  );

  const bulkSet = useBulkSetAttendance(classId, sessionId);

  const [rows, setRows] = useState<RowState[]>([]);
  const [saving, setSaving] = useState(false);

  // Merge enrolled students with existing attendance records
  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>()
    for (const r of session?.records ?? []) {
      map.set(r.student_id, r)
    }
    return map
  }, [session])

  useEffect(() => {
    if (!session) return;

    const studentList = session.students ?? [];

    setRows(
      studentList.length > 0
        ? studentList.map((s) => {
            const existing = recordMap.get(s.id)
            return {
              recordId: existing?.id ?? null,
              studentId: s.id,
              studentName: s.name,
              studentCode: s.code,
              status: existing?.status ?? 'present',
              autoSet: false,
              dirty: false,
            }
          })
        : session.records.map((r) => ({
            recordId: r.id,
            studentId: r.student_id,
            studentName: r.student_name ?? '',
            studentCode: r.student_code ?? '',
            status: r.status,
            autoSet: false,
            dirty: false,
          }))
    );
  }, [session, recordMap]);

  const setStatus = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setRows((prev) =>
        prev.map((r) =>
          r.studentId === studentId
            ? { ...r, status, dirty: true, autoSet: false }
            : r
        )
      );
    },
    []
  );

  const markAllPresent = useCallback(() => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        status: "present",
        dirty: true,
        autoSet: false,
      }))
    );
  }, []);

  const resetDirty = useCallback(() => {
    if (!session) return;

    const recMap = new Map<string, AttendanceRecord>()
    for (const r of session.records) {
      recMap.set(r.student_id, r)
    }

    const studentList = session.students ?? [];

    setRows(
      studentList.length > 0
        ? studentList.map((s) => {
            const existing = recMap.get(s.id)
            return {
              recordId: existing?.id ?? null,
              studentId: s.id,
              studentName: s.name,
              studentCode: s.code,
              status: existing?.status ?? 'present',
              autoSet: false,
              dirty: false,
            }
          })
        : session.records.map((r) => ({
            recordId: r.id,
            studentId: r.student_id,
            studentName: r.student_name ?? '',
            studentCode: r.student_code ?? '',
            status: r.status,
            autoSet: false,
            dirty: false,
          }))
    );
  }, [session]);

  const handleSave = async () => {
    setSaving(true);

    try {
      await bulkSet.mutateAsync(
        rows.map((r) => ({
          studentId: r.studentId,
          status: r.status,
        }))
      );

      setRows((prev) =>
        prev.map((r) => ({ ...r, dirty: false }))
      );

      toast.success("Attendance saved successfully.");
    } catch {
      toast.error("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const dirtyCount = rows.filter((r) => r.dirty).length;

  const stats = rows.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<AttendanceStatus, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading session...
      </div>
    );
  }

  if (!session) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Session not found.
      </p>
    );
  }

  const dateLabel = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const sessionLabel = `Session ${session.week_number}.${session.sub_index}`;

  const sessionDate = new Date(session.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isFuture = sessionDate > today

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() =>
              router.push(
                `/educator/classes/${classId}/attendance`
              )
            }
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <h1 className="text-xl font-semibold">{dateLabel}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {sessionLabel}
          </p>
        </div>

        {isFuture ? (
          <span className="text-xs text-muted-foreground italic">
            Attendance cannot be taken for future sessions
          </span>
        ) : (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || dirtyCount === 0}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? "Saving..." : dirtyCount ? `Save (${dirtyCount})` : "Saved"}
          </Button>
        )}
      </div>

      {/* Future session notice */}
      {isFuture && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/10 dark:border-amber-800 px-4 py-3">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            This session is scheduled for <strong>{dateLabel}</strong>. Attendance can only be marked on or after this date.
          </p>
        </div>
      )}

      {/* Stats */}
      {!isFuture && (
        <div className="grid grid-cols-4 gap-3">
          {ALL_STATUSES.map((s) => (
            <div key={s} className="rounded-lg border px-4 py-3">
              <p className="text-lg font-bold">{stats[s] ?? 0}</p>
              <p className="text-xs text-muted-foreground">
                {STATUS_CONFIG[s].label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No enrolled students found.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.studentId}
              className="flex items-center justify-between px-4 py-3 border-b last:border-0"
            >
              <div>
                <p className="font-medium">{row.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {row.studentCode}
                </p>
              </div>

              <div className="flex gap-2">
                {ALL_STATUSES.map((s) => (
                  <StatusChip
                    key={s}
                    status={s}
                    selected={row.status === s}
                    onClick={() => setStatus(row.studentId, s)}
                    disabled={isFuture}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating save */}
      {!isFuture && dirtyCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <Button onClick={handleSave}>
            Save {dirtyCount} changes
          </Button>
        </div>
      )}
    </div>
  );
}