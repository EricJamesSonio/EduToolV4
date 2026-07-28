"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import {
  useAttendanceGrid,
  useSaveAttendanceGrid,
} from "@/hooks/educator/useAttendance";
import type {
  AttendanceGridData,
  AttendanceGridSession,
} from "@/api/educator/attendance.api";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "P",
  absent: "A",
  late: "L",
  excused: "E",
};

const STATUS_CHIP: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500 hover:bg-emerald-600 text-white",
  absent: "bg-red-500 hover:bg-red-600 text-white",
  late: "bg-amber-500 hover:bg-amber-600 text-white",
  excused: "bg-blue-500 hover:bg-blue-600 text-white",
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500 text-white",
  absent: "bg-red-500 text-white",
  late: "bg-amber-500 text-white",
  excused: "bg-blue-500 text-white",
};

const EMPTY_CELL =
  "bg-card text-muted-foreground/50 border border-dashed border-border/70";

const ALL_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
];

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, "0");
    return `${h}:${m} ${ampm}`;
  } catch {
    return iso;
  }
}

function CellPopover({
  current,
  onSelect,
  onClose,
}: {
  current: AttendanceStatus | null;
  onSelect: (s: AttendanceStatus) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 flex gap-0.5 rounded-md border bg-popover p-1 shadow-lg"
    >
      {ALL_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={cn(
            "flex items-center justify-center h-7 w-7 rounded text-xs font-bold transition-colors",
            current === s
              ? STATUS_COLOR[s]
              : "text-muted-foreground hover:bg-muted",
          )}
          title={s}
        >
          {current === s ? <Check className="h-3 w-3" /> : STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}

function Cell({
  status,
  enabled,
  onSelect,
}: {
  status: AttendanceStatus | null;
  enabled: boolean;
  onSelect: (status: AttendanceStatus) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!enabled) {
    return (
      <div className="flex items-center justify-center h-8 w-full rounded text-[11px] font-bold tabular-nums bg-card border border-border/40 text-muted-foreground/25 cursor-not-allowed">
        —
      </div>
    );
  }

  const className = status
    ? cn(
        "flex items-center justify-center h-8 w-full rounded text-[11px] font-bold tabular-nums transition-colors relative",
        STATUS_CHIP[status],
      )
    : cn(
        "flex items-center justify-center h-8 w-full rounded text-[11px] font-bold tabular-nums transition-colors relative",
        EMPTY_CELL,
        "hover:bg-muted/60 hover:text-muted-foreground/60",
      );

  return (
    <div className="relative inline-flex w-full">
      <button onClick={() => setOpen((v) => !v)} className={className}>
        {status ? STATUS_LABEL[status] : "—"}
      </button>
      {open && (
        <CellPopover
          current={status}
          onSelect={(s) => {
            onSelect(s);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

interface Props {
  classId: string;
}

export function AttendanceGrid({ classId }: Props) {
  const { data, isLoading } = useAttendanceGrid(classId);
  const mutation = useSaveAttendanceGrid(classId);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [local, setLocal] = useState<Record<string, AttendanceStatus>>({});

  const { students, sessions } = data ?? { students: [], sessions: [] };

  // Group sessions by week number
  const weekGroups = useMemo(() => {
    const map = new Map<number, AttendanceGridSession[]>();
    for (const s of sessions) {
      if (!map.has(s.weekNumber)) map.set(s.weekNumber, []);
      map.get(s.weekNumber)!.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [sessions]);

  const getStatus = useCallback(
    (studentId: string, sessionId: string): AttendanceStatus | null => {
      const key = `${sessionId}_${studentId}`;
      if (local[key] !== undefined) return local[key];
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return null;
      const raw = session.records[studentId];
      if (
        raw === "present" ||
        raw === "absent" ||
        raw === "late" ||
        raw === "excused"
      )
        return raw as AttendanceStatus;
      return null;
    },
    [sessions, local],
  );

  const handleCellSelect = useCallback(
    (studentId: string, sessionId: string, status: AttendanceStatus) => {
      const key = `${sessionId}_${studentId}`;
      setLocal((prev) => ({ ...prev, [key]: status }));
      setDirty((prev) => new Set(prev).add(key));
    },
    [],
  );

  const handleSave = async () => {
    const bySession = new Map<
      string,
      { studentId: string; status: AttendanceStatus }[]
    >();
    for (const key of dirty) {
      const [sessionId, studentId] = key.split("_");
      const status = local[key];
      if (!status) continue;
      if (!bySession.has(sessionId)) bySession.set(sessionId, []);
      bySession.get(sessionId)!.push({ studentId, status });
    }

    const batches = Array.from(bySession.entries()).map(
      ([sessionId, records]) => ({
        sessionId,
        records,
      }),
    );

    try {
      await mutation.mutateAsync(batches);
      setDirty(new Set());
      setLocal({});
    } catch {
      // error handled by toast in page
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading attendance grid...
      </div>
    );
  }

  if (students.length === 0 || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground">
        <p>No attendance data available.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Generate sessions first by visiting the Lessons page.
        </p>
      </div>
    );
  }

  const totalCols = sessions.length + 1; // +1 for student name column

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-emerald-500" /> P
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-red-500" /> A
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-amber-500" /> L
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded bg-blue-500" /> E
          </span>
        </div>

        {dirty.size > 0 && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            Save {dirty.size} change{dirty.size > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Scrollable table */}
      <div className="overflow-auto rounded-lg border border-border/60 bg-card">
        <table className="w-full text-sm border-collapse">
          {/* Column headers */}
          <thead>
            {/* Week group header row */}
            <tr className="bg-card">
              <th className="sticky left-0 z-10 bg-card px-3 py-1.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px] border-r border-b border-border/40">
                Student
              </th>
              {weekGroups.map(([weekNum, weekSessions]) => {
                const colorIdx = (weekNum - 1) % WEEK_COLORS.length;
                return (
                  <th
                    key={weekNum}
                    colSpan={weekSessions.length}
                    className={cn(
                      "px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider border-r border-b border-border/40 last:border-r-0",
                      WEEK_COLORS[colorIdx],
                    )}
                  >
                    Week {weekNum}
                  </th>
                );
              })}
            </tr>

            {/* Session date header row */}
            <tr className="bg-card">
              <th className="sticky left-0 z-10 bg-card px-3 py-1.5 border-r border-b border-border/40" />
              {sessions.map((s) => (
                <th
                  key={s.id}
                  className="px-1.5 py-1 text-center text-[10px] font-medium text-muted-foreground border-r border-b border-border/40 last:border-r-0 min-w-[44px]"
                >
                  <div>{format(new Date(s.date), "MMM d")}</div>
                  <div className="text-[9px] text-muted-foreground/60">
                    {formatTime(s.date)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-t border-border/30 hover:bg-muted/10 transition-colors"
              >
                <td className="sticky left-0 z-10 bg-card px-3 py-1.5 text-xs font-medium text-foreground truncate max-w-[140px] border-r border-border/40 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                  {student.name}
                </td>
                {sessions.map((s) => {
                  const status = getStatus(student.id, s.id);
                  const date = new Date(s.date);
                  const isFuture = date > new Date();
                  return (
                    <td
                      key={s.id}
                      className="px-1 py-1 border-r border-border/30 last:border-r-0"
                    >
                      <Cell
                        status={status}
                        enabled={!isFuture}
                        onSelect={(st) =>
                          handleCellSelect(student.id, s.id, st)
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
