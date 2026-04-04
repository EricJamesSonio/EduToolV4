// filepath: frontend/src/app/educator/classes/[classId]/attendance/[sessionId]/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, Clock, FileText,
  ChevronLeft, Save, Users, Zap, RotateCcw, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAttendanceSession, useBulkSetAttendance } from "@/hooks/educator/useAttendance";
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
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  present: { label: "Present", icon: <CheckCircle2 className="h-3.5 w-3.5" />, variant: "default" },
  absent:  { label: "Absent",  icon: <XCircle className="h-3.5 w-3.5" />,      variant: "destructive" },
  late:    { label: "Late",    icon: <Clock className="h-3.5 w-3.5" />,         variant: "secondary" },
  excused: { label: "Excused", icon: <FileText className="h-3.5 w-3.5" />,      variant: "outline" },
};

const ALL_STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed
        ${selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
        }`}
    >
      {cfg.icon}
      {cfg.label}
    </button>
  );
}

export default function AttendanceSessionPage() {
  const { classId, sessionId } = useParams<{ classId: string; sessionId: string }>();
  const router = useRouter();

  const { data: session, isLoading } = useAttendanceSession(classId, sessionId);
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

  const setStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((r) =>
        r.studentId === studentId ? { ...r, status, dirty: true, autoSet: false } : r
      )
    );
  }, []);

  const markAllPresent = useCallback(() => {
    setRows((prev) => prev.map((r) => ({ ...r, status: "present", dirty: true, autoSet: false })));
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
        rows.map((r) => ({ studentId: r.studentId, status: r.status }))
      );
      setRows((prev) => prev.map((r) => ({ ...r, dirty: false })));
      toast.success("Attendance saved successfully.");
    } catch {
      toast.error("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const dirtyCount = rows.filter((r) => r.dirty).length;
  const stats = rows.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
    {} as Record<AttendanceStatus, number>
  );

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
      <p className="text-sm text-muted-foreground py-12 text-center">Session not found.</p>
    );
  }

  const dateLabel = new Date(session.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const sessionLabel = `Session ${session.weekNumber}.${session.sessionNumber}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push(`/educator/classes/${classId}/attendance`)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Attendance
          </button>
          <h1 className="text-xl font-semibold">{dateLabel}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sessionLabel}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {dirtyCount > 0 && (
            <Button variant="outline" size="sm" onClick={resetDirty} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Save className="h-3.5 w-3.5" />
            }
            {saving ? "Saving..." : dirtyCount > 0 ? `Save (${dirtyCount})` : "Save All"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {ALL_STATUSES.map((s) => (
          <div key={s} className="rounded-lg border px-4 py-3">
            <p className="text-lg font-bold">{stats[s] ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{STATUS_CONFIG[s].label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={markAllPresent} className="gap-1.5">
          <Zap className="h-3.5 w-3.5" />
          Mark All Present
        </Button>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {rows.length} students
        </span>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Users className="h-8 w-8 opacity-40" />
          <p className="text-sm">No students enrolled in this session.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-[2rem_1fr_1fr_auto] gap-4 px-4 py-2.5 bg-muted/50 border-b">
            <span />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID Code</span>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</span>
          </div>

          <div className="divide-y">
            {rows.map((row, idx) => (
              <div
                key={row.studentId}
                className={`grid grid-cols-[2rem_1fr_1fr_auto] gap-4 items-center px-4 py-3 transition-colors
                  ${row.dirty ? "bg-muted/30" : "hover:bg-muted/20"}`}
              >
                <span className="text-xs text-muted-foreground text-right font-mono">{idx + 1}</span>

                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-muted border flex items-center justify-center text-xs font-bold shrink-0">
                    {row.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.studentName}</p>
                    {row.autoSet && (
                      <span className="text-[10px] text-green-600 font-medium">auto-set</span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-mono text-muted-foreground">{row.studentCode}</span>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
        </div>
      )}

      {/* Floating save bar */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-3 bg-background border rounded-xl px-4 py-2.5 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium">
              {dirtyCount} unsaved change{dirtyCount !== 1 ? "s" : ""}
            </span>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Save className="h-3.5 w-3.5" />
              }
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}