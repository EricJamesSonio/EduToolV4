"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  useAttendanceGrid,
  useSaveAttendanceGrid,
} from "@/hooks/educator/useAttendance";
import type { AttendanceGridSession } from "@/api/educator/attendance.api";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "P",
  absent: "A",
  late: "L",
  excused: "E",
};

const STATUS_FILL: Record<AttendanceStatus, string> = {
  present: "bg-success hover:bg-success/90 text-white",
  absent: "bg-destructive hover:bg-destructive/90 text-white",
  late: "bg-warning hover:bg-warning/90 text-white",
  excused: "bg-info hover:bg-info/90 text-white",
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: "bg-success text-white",
  absent: "bg-destructive text-white",
  late: "bg-warning text-white",
  excused: "bg-info text-white",
};

const STATUS_NAME: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

const ALL_STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
];

const CELL_BASE =
  "flex h-12 w-full items-center justify-center text-xs font-bold tabular-nums transition-colors";

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
      className="absolute left-1/2 top-full z-50 mt-1 flex -translate-x-1/2 gap-0.5 rounded-md border bg-popover p-1 shadow-lg"
    >
      {ALL_STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded text-xs font-bold transition-colors",
            current === s
              ? STATUS_COLOR[s]
              : "text-muted-foreground hover:bg-muted",
          )}
          title={STATUS_NAME[s]}
        >
          {current === s ? <Check className="h-3 w-3" /> : STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  );
}

// The cell IS the status block: the whole table cell is filled with the
// status colour and the whole cell is the click target.
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
    // Future session: a recorded status (set automatically from an
    // assessment submission) is shown but cannot be changed.
    if (status) {
      return (
        <div
          title={`${STATUS_NAME[status]} (recorded from an assessment, locked until the day)`}
          className={cn(CELL_BASE, "cursor-not-allowed", STATUS_COLOR[status])}
        >
          {STATUS_LABEL[status]}
        </div>
      );
    }

    return (
      <div
        className={cn(
          CELL_BASE,
          "cursor-not-allowed bg-muted/20 text-muted-foreground/25",
        )}
      >
        —
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={status ? STATUS_NAME[status] : "Mark attendance"}
        className={cn(
          CELL_BASE,
          status
            ? STATUS_FILL[status]
            : "bg-card text-muted-foreground/40 hover:bg-muted/60 hover:text-muted-foreground/70",
        )}
      >
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

  const sessionById = useMemo(
    () => new Map(sessions.map((s) => [s.id, s])),
    [sessions],
  );

  const getStatus = useCallback(
    (studentId: string, sessionId: string): AttendanceStatus | null => {
      const key = `${sessionId}_${studentId}`;
      if (local[key] !== undefined) return local[key];
      const raw = sessionById.get(sessionId)?.records[studentId];
      if (
        raw === "present" ||
        raw === "absent" ||
        raw === "late" ||
        raw === "excused"
      ) {
        return raw as AttendanceStatus;
      }
      return null;
    },
    [sessionById, local],
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
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading attendance grid...
      </div>
    );
  }

  if (students.length === 0 || sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-muted-foreground">
        <p>No attendance data available.</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Generate sessions first by visiting the Lessons page.
        </p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Legend:</span>
          {ALL_STATUSES.map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                  STATUS_COLOR[s],
                )}
              >
                {STATUS_LABEL[s]}
              </span>
              {STATUS_NAME[s]}
            </span>
          ))}
        </div>

        {dirty.size > 0 && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={mutation.isPending}
            className="gap-1.5"
          >
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save {dirty.size} change{dirty.size > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Scrollable table */}
      <div className="overflow-auto rounded-lg border border-border/60 bg-card">
        <table className="w-full border-collapse text-sm">
          <thead>
            {/* Week group header row */}
            <tr className="bg-card">
              <th className="sticky left-0 z-10 min-w-[180px] whitespace-nowrap border-b border-r border-border/40 bg-card px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Student
              </th>
              {weekGroups.map(([weekNum, weekSessions]) => (
                <th
                  key={weekNum}
                  colSpan={weekSessions.length}
                  className="border-b border-r border-border/40 bg-primary px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-primary-foreground last:border-r-0"
                >
                  Week {weekNum}
                </th>
              ))}
            </tr>

            {/* Session date header row */}
            <tr className="bg-card">
              <th className="sticky left-0 z-10 border-b border-r border-border/40 bg-card px-3 py-1.5" />
              {sessions.map((s) => (
                <th
                  key={s.id}
                  className="min-w-[56px] border-b border-r border-border/40 px-1.5 py-1 text-center text-[10px] font-medium text-muted-foreground last:border-r-0"
                >
                  <div>{format(new Date(s.date), "MMM d")}</div>
                  <div className="text-[9px] text-muted-foreground/60">
                    {formatTime(s.date)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-t border-border/30 transition-colors hover:bg-muted/10"
              >
                <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border/40 bg-card px-3 py-2 text-xs font-medium text-foreground shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                  {student.name}
                </td>
                {sessions.map((s) => (
                  <td
                    key={s.id}
                    className="border-r border-border/30 p-0 last:border-r-0"
                  >
                    <Cell
                      status={getStatus(student.id, s.id)}
                      enabled={new Date(s.date) <= now}
                      onSelect={(st) => handleCellSelect(student.id, s.id, st)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}