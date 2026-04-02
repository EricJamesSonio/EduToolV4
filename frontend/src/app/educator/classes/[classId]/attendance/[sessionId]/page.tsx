"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2, XCircle, Clock, FileText,
  ChevronLeft, Save, Users, Zap, RotateCcw
} from "lucide-react";
import { toast } from "sonner";

import {
  useAttendanceSession,
  useBulkSetAttendance,
} from "@/hooks/educator/useAttendance";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
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
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  present: {
    label: "Present",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  absent: {
    label: "Absent",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/40",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  late: {
    label: "Late",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/40",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  excused: {
    label: "Excused",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/40",
    icon: <FileText className="w-3.5 h-3.5" />,
  },
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
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150
        ${selected
          ? `${cfg.bg} ${cfg.border} ${cfg.color}`
          : "bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
        }
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
      `}
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
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center text-zinc-600 text-sm">
        Session not found.
      </div>
    );
  }

  const sessionDate = new Date(session.date);
  const dateLabel = sessionDate.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  // sessionNumber is the correct frontend field name (maps to sub_index on the backend)
  const sessionLabel = `Session ${session.weekNumber}.${session.sessionNumber}`;

  return (
    <div className="min-h-screen bg-[#0f0f11]">
      <div className="h-[3px] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500" />

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* Page Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <button
              onClick={() => router.push(`/educator/classes/${classId}/attendance`)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-3 group"
            >
              <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Attendance
            </button>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Attendance &mdash; {dateLabel}
            </h1>
            <p className="text-sm text-zinc-500 mt-1 font-medium">{sessionLabel}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {dirtyCount > 0 && (
              <button
                onClick={resetDirty}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-900/30"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving…" : dirtyCount > 0 ? `Save All (${dirtyCount} changed)` : "Save All"}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {ALL_STATUSES.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = stats[s] ?? 0;
            return (
              <div
                key={s}
                className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${cfg.bg} ${cfg.border}`}
              >
                <span className={cfg.color}>{cfg.icon}</span>
                <div>
                  <p className={`text-lg font-bold leading-none ${cfg.color}`}>{count}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">{cfg.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={markAllPresent}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-all"
          >
            <Zap className="w-3.5 h-3.5" />
            Mark All Present
          </button>
          <span className="flex items-center gap-1.5 text-xs text-zinc-600">
            <Users className="w-3.5 h-3.5" />
            {rows.length} students
          </span>
        </div>

        {/* Attendance Table */}
        {rows.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No students enrolled in this session.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="grid grid-cols-[2.5rem_1fr_1fr_auto] gap-4 px-5 py-3 bg-zinc-900/80 border-b border-zinc-800">
              <span />
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Student</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">ID Code</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Status</span>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {rows.map((row, idx) => (
                <div
                  key={row.studentId}
                  className={`grid grid-cols-[2.5rem_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 transition-colors
                    ${row.dirty ? "bg-violet-500/5" : "hover:bg-zinc-900/40"}
                  `}
                >
                  <span className="text-xs font-mono text-zinc-600 text-right">{idx + 1}</span>

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-bold text-zinc-400 shrink-0">
                      {row.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white leading-none">{row.studentName}</p>
                      {row.autoSet && (
                        <span className="text-[10px] text-emerald-500 font-medium">auto-set</span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-mono text-zinc-500">{row.studentCode}</span>

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

        {/* Floating Save Bar */}
        {dirtyCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-3 shadow-2xl shadow-black/50">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-sm text-zinc-300 font-medium">
                {dirtyCount} unsaved change{dirtyCount !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-50"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving…" : "Save All"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}