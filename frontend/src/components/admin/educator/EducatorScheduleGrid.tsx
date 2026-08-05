"use client";

import { useMemo } from "react";
import type { Class } from "@/types/admin/class.types";
import { WEEKDAYS } from "./EducatorClassAssignmentManager";

interface EducatorScheduleGridProps {
  classes: Class[];
  isLoading?: boolean;
}

interface ScheduleBlock {
  key: string;
  classId: string;
  weekday: number;
  startMin: number;
  endMin: number;
  label: string;
  sublabel: string;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sat, Sun appended only if used
const MIN_INTERVAL_CANDIDATES = [30, 15, 10, 5, 1];
const PX_PER_MINUTE = 1.1;

const BLOCK_COLORS = [
  "bg-blue-500/15 border-blue-500/40 text-blue-700 dark:text-blue-300",
  "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300",
  "bg-violet-500/15 border-violet-500/40 text-violet-700 dark:text-violet-300",
  "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300",
  "bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300",
];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function colorForClass(classId: string): string {
  let hash = 0;
  for (let i = 0; i < classId.length; i++) {
    hash = (hash * 31 + classId.charCodeAt(i)) >>> 0;
  }
  return BLOCK_COLORS[hash % BLOCK_COLORS.length];
}

export function EducatorScheduleGrid({ classes, isLoading }: EducatorScheduleGridProps) {
  const blocks = useMemo<ScheduleBlock[]>(() => {
    const result: ScheduleBlock[] = [];
    for (const cls of classes) {
      for (const s of cls.schedules ?? []) {
        result.push({
          key: s.id,
          classId: cls.id,
          weekday: s.weekday,
          startMin: toMinutes(s.startTime),
          endMin: toMinutes(s.endTime),
          label: cls.subjectName ?? cls.title ?? "Class",
          sublabel: cls.sectionName ?? "",
        });
      }
    }
    return result;
  }, [classes]);

  const days = useMemo(() => {
    const used = new Set(blocks.map((b) => b.weekday));
    return DAY_ORDER.filter((d) => d !== 0 || used.has(0));
  }, [blocks]);

const { gridStart, gridEnd, interval } = useMemo(() => {
    if (blocks.length === 0) {
      return { gridStart: 0, gridEnd: 0, interval: 30 };
    }

    const starts = blocks.map((b) => b.startMin);
    const ends = blocks.map((b) => b.endMin);
    const start = Math.min(...starts);
    const rawEnd = Math.max(...ends);

    const offsets = [...starts, ...ends]
      .map((t) => t - start)
      .filter((o) => o > 0);

    const rawGcd = offsets.length > 0 ? offsets.reduce((a, b) => gcd(a, b)) : 30;

    const chosen =
      MIN_INTERVAL_CANDIDATES.find((c) => rawGcd % c === 0) ??
      MIN_INTERVAL_CANDIDATES[MIN_INTERVAL_CANDIDATES.length - 1];

    // Pad one interval past the last class so its end time gets its own
    // visible row/label instead of coinciding with the grid's bottom edge.
    const end = rawEnd + chosen;

    return { gridStart: start, gridEnd: end, interval: chosen };
  }, [blocks]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 animate-pulse bg-muted rounded-md" />
        ))}
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-md">
        <p className="text-sm font-medium not-interactive">No schedule to display</p>
        <p className="text-xs text-muted-foreground not-interactive">
          Assign this educator to a class with a schedule.
        </p>
      </div>
    );
  }

  const totalMinutes = gridEnd - gridStart;
  const numRows = Math.max(1, Math.ceil(totalMinutes / interval));
  const labelStep = Math.max(1, Math.round(30 / interval));
  const timeColWidth = 64;

  return (
    <div className="border rounded-md overflow-x-auto bg-card">
      <div
        className="grid min-w-[640px]"
        style={{
          gridTemplateColumns: `${timeColWidth}px repeat(${days.length}, 1fr)`,
          gridTemplateRows: `auto repeat(${numRows}, ${interval * PX_PER_MINUTE}px)`,
        }}
      >
        {/* Header row */}
        <div className="sticky top-0 z-10 bg-card border-b border-r" />
        {days.map((d) => (
          <div
            key={`head-${d}`}
            className="sticky top-0 z-10 bg-card border-b border-r last:border-r-0 py-2 text-center text-xs font-semibold text-muted-foreground not-interactive"
          >
            {WEEKDAYS[d]}
          </div>
        ))}

        {/* Time labels */}
        {Array.from({ length: numRows }).map((_, i) => {
          const min = gridStart + i * interval;
          const showLabel = i % labelStep === 0;
          return (
            <div
              key={`time-${i}`}
              className="border-r border-b text-[10px] text-muted-foreground text-right pr-1.5 not-interactive"
              style={{ gridRow: i + 2, gridColumn: 1 }}
            >
              {showLabel ? toLabel(min) : ""}
            </div>
          );
        })}

        {/* Day column backgrounds (grid lines) */}
        {days.map((d, dayIdx) =>
          Array.from({ length: numRows }).map((_, i) => (
            <div
              key={`cell-${d}-${i}`}
              className="border-r border-b last:border-r-0"
              style={{ gridRow: i + 2, gridColumn: dayIdx + 2 }}
            />
          ))
        )}

        {/* Class blocks */}
        {blocks.map((b) => {
          const dayIdx = days.indexOf(b.weekday);
          if (dayIdx === -1) return null;

          const rowStart = 2 + Math.round((b.startMin - gridStart) / interval);
          const rowSpan = Math.max(1, Math.round((b.endMin - b.startMin) / interval));

          return (
            <div
              key={b.key}
              className={`m-0.5 rounded-md border px-1.5 py-1 overflow-hidden ${colorForClass(b.classId)}`}
              style={{
                gridRow: `${rowStart} / span ${rowSpan}`,
                gridColumn: dayIdx + 2,
              }}
            >
              <p className="text-[11px] font-medium leading-tight truncate not-interactive">
                {b.label}
              </p>
              {b.sublabel && (
                <p className="text-[10px] opacity-80 leading-tight truncate not-interactive">
                  {b.sublabel}
                </p>
              )}
              <p className="text-[9px] opacity-70 leading-tight not-interactive">
                {toLabel(b.startMin)}–{toLabel(b.endMin)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}