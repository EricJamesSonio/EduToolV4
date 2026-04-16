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
import type {
  AttendanceStatus,
  AttendanceRecord,
} from "@/types/educator/attendance.types";

interface RowState {
  recordId: string;
  studentId: string;
  status: AttendanceStatus;
  dirty: boolean;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; icon: React.ReactNode }
> = {
  present: {
    label: "Present",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  absent: {
    label: "Absent",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  late: {
    label: "Late",
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  excused: {
    label: "Excused",
    icon: <FileText className="h-3.5 w-3.5" />,
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
}: {
  status: AttendanceStatus;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[status];

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs border rounded ${
        selected ? "bg-primary text-white" : "text-muted-foreground"
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
        studentId: r.student_id,
        status: r.status,
        dirty: false,
      }))
    );
  }, [session]);

  const setStatus = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setRows((prev) =>
        prev.map((r) =>
          r.studentId === studentId
            ? { ...r, status, dirty: true }
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
      }))
    );
  }, []);

  const resetDirty = useCallback(() => {
    if (!session) return;

    setRows(
      session.records.map((r) => ({
        recordId: r.id,
        studentId: r.student_id,
        status: r.status,
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

      toast.success("Attendance saved");
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const dirtyCount = rows.filter((r) => r.dirty).length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <p className="text-center py-10">Session not found</p>
    );
  }

  const label = `Session ${session.week_number}.${session.sub_index}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between">
        <div>
          <button
            onClick={() =>
              router.push(
                `/educator/classes/${classId}/attendance`
              )
            }
            className="text-xs text-muted-foreground"
          >
            ← Back
          </button>

          <h1 className="text-xl font-semibold">
            {label}
          </h1>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : `Save (${dirtyCount})`}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded">
        {rows.map((row, idx) => (
          <div
            key={row.studentId}
            className="flex justify-between p-3 border-b"
          >
            <span>{idx + 1}</span>

            <span>{row.studentId}</span>

            <div className="flex gap-1">
              {ALL_STATUSES.map((s) => (
                <StatusChip
                  key={s}
                  status={s}
                  selected={row.status === s}
                  onClick={() =>
                    setStatus(row.studentId, s)
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}