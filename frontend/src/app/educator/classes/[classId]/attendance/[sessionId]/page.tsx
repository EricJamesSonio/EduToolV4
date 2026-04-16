"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  ChevronLeft,
  Save,
  Users,
  Zap,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAttendanceSession,
  useBulkSetAttendance,
} from "@/hooks/educator/useAttendance";

import { Button } from "@/components/ui/button";
import type { AttendanceStatus } from "@/types/educator/attendance.types";

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

  useEffect(() => {
    if (!session) return;

    setRows(
      session.records.map((r) => ({
        recordId: r.id,
        studentId: r.studentId,
        studentName: r.studentName,
        studentCode: r.studentCode,
        status: r.status,
        autoSet: r.autoSet,
        dirty: false,
      }))
    );
  }, [session]);

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

    setRows(
      session.records.map((r) => ({
        recordId: r.id,
        studentId: r.studentId,
        studentName: r.studentName,
        studentCode: r.studentCode,
        status: r.status,
        autoSet: r.autoSet,
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

        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving..." : dirtyCount ? `Save (${dirtyCount})` : "Save"}
        </Button>
      </div>

      {/* Stats */}
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

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        {rows.map((row, idx) => (
          <div
            key={row.studentId}
            className="flex justify-between px-4 py-3 border-b"
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
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating save */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
          <Button onClick={handleSave}>
            Save {dirtyCount} changes
          </Button>
        </div>
      )}
    </div>
  );
}