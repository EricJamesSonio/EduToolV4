"use client";

import { useMemo, useState } from "react";
import type { Class } from "@/types/admin/class.types";
import { WEEKDAYS } from "./EducatorClassAssignmentManager";
import { minutesToTime } from "@/utils/classes.utils";

export interface ScheduleRange {
  weekday: number;
  startMin: number;
  endMin: number;
}

export interface DraftCell {
  weekday: number;
  minute: number;
}

interface EducatorScheduleGridProps {
  classes: Class[];
  isLoading?: boolean;

  interactive?: boolean;
  showAllDays?: boolean;
  pickedRanges?: ScheduleRange[];
  maxPicks?: number;
  draftStart?: DraftCell | null;
  windowStartMin?: number;
  windowEndMin?: number;
  stepMin?: number;
  onDraftStart?: (cell: DraftCell) => void;
  onPickRange?: (range: ScheduleRange) => void;
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

interface PositionedBlock extends ScheduleBlock {
  col: number;
  colCount: number;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MIN_INTERVAL_CANDIDATES = [30, 15, 10, 5, 1];
const PX_PER_MINUTE = 1.1;
const TIME_COL_WIDTH = 64;

const BLOCK_COLORS = [
  "bg-chart-1/15 border-[var(--chart-1)]/30 text-[var(--chart-1)]",
  "bg-chart-2/15 border-[var(--chart-2)]/30 text-[var(--chart-2)]",
  "bg-chart-3/15 border-[var(--chart-3)]/30 text-[var(--chart-3)]",
  "bg-chart-4/15 border-[var(--chart-4)]/30 text-[var(--chart-4)]",
  "bg-chart-5/15 border-[var(--chart-5)]/30 text-[var(--chart-5)]",
  "bg-chart-6/15 border-[var(--chart-6)]/30 text-[var(--chart-6)]",
];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toLabel(min: number): string {
  return minutesToTime(min);
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

function layoutOverlaps(dayBlocks: ScheduleBlock[]): PositionedBlock[] {
  const sorted = [...dayBlocks].sort((a, b) => a.startMin - b.startMin);
  const result: PositionedBlock[] = [];

  let cluster: ScheduleBlock[] = [];
  let clusterEnd = -1;

  const flushCluster = () => {
    if (cluster.length === 0) return;

    const columnEnds: number[] = [];
    const placed: PositionedBlock[] = [];

    for (const b of cluster) {
      let col = columnEnds.findIndex((end) => end <= b.startMin);
      if (col === -1) {
        col = columnEnds.length;
        columnEnds.push(b.endMin);
      } else {
        columnEnds[col] = b.endMin;
      }
      placed.push({ ...b, col, colCount: 0 });
    }

    const colCount = columnEnds.length;
    placed.forEach((p) => { p.colCount = colCount; });
    result.push(...placed);

    cluster = [];
    clusterEnd = -1;
  };

  for (const b of sorted) {
    if (cluster.length === 0 || b.startMin < clusterEnd) {
      cluster.push(b);
      clusterEnd = Math.max(clusterEnd, b.endMin);
    } else {
      flushCluster();
      cluster.push(b);
      clusterEnd = b.endMin;
    }
  }
  flushCluster();

  return result;
}

export function EducatorScheduleGrid({
  classes,
  isLoading,
  interactive,
  showAllDays,
  pickedRanges = [],
  maxPicks,
  draftStart,
  windowStartMin,
  windowEndMin,
  stepMin = 30,
  onDraftStart,
  onPickRange,
}: EducatorScheduleGridProps) {
  const [hover, setHover] = useState<DraftCell | null>(null);

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
    if (interactive && showAllDays) return DAY_ORDER;
    const used = new Set(blocks.map((b) => b.weekday));
    return DAY_ORDER.filter((d) => d !== 0 || used.has(0));
  }, [blocks, interactive, showAllDays]);

  const { gridStart, gridEnd, interval } = useMemo(() => {
    if (interactive) {
      const step = stepMin;
      const ws = windowStartMin ?? 0;
      const we = windowEndMin ?? 0;
      let start = ws;
      let end = we;
      if (blocks.length > 0) {
        const minB = Math.min(...blocks.map((b) => b.startMin));
        const maxB = Math.max(...blocks.map((b) => b.endMin));
        if (minB < start) start = ws - Math.ceil((ws - minB) / step) * step;
        if (maxB > end) end = ws + Math.ceil((maxB - ws) / step) * step;
      }
      return { gridStart: start, gridEnd: end + step, interval: step };
    }

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

    const end = rawEnd + chosen;

    return { gridStart: start, gridEnd: end, interval: chosen };
  }, [blocks, interactive, windowStartMin, windowEndMin, stepMin]);

  const { dayLayout, totalDataCols } = useMemo(() => {
    let col = 2;
    const layout: Record<number, { startCol: number; colCount: number; blocks: PositionedBlock[] }> = {};

    for (const d of days) {
      const dayBlocks = blocks.filter((b) => b.weekday === d);
      const positioned = layoutOverlaps(dayBlocks);
      const colCount = positioned.length > 0
        ? Math.max(...positioned.map((b) => b.colCount))
        : 1;

      layout[d] = { startCol: col, colCount, blocks: positioned };
      col += colCount;
    }

    return { dayLayout: layout, totalDataCols: col - 2 };
  }, [days, blocks]);

  const pickingLocked =
    (interactive && maxPicks != null && pickedRanges.length >= maxPicks) ?? false;

  const winStart = windowStartMin ?? 0;
  const winEnd = windowEndMin ?? 0;

  const isOccupied = (weekday: number, minute: number): boolean =>
    blocks.some((b) => b.weekday === weekday && minute >= b.startMin && minute < b.endMin) ||
    pickedRanges.some((r) => r.weekday === weekday && minute >= r.startMin && minute < r.endMin);

  const isFreeRange = (weekday: number, from: number, to: number): boolean => {
    for (let m = from; m < to; m += interval) {
      if (isOccupied(weekday, m)) return false;
    }
    return true;
  };

  const canStart = (d: number, m: number): boolean =>
    m >= winStart && m < winEnd && !isOccupied(d, m);

  const canEnd = (d: number, m: number): boolean =>
    !!draftStart &&
    draftStart.weekday === d &&
    m > draftStart.minute &&
    m <= winEnd &&
    isFreeRange(d, draftStart.minute, m);

  const isClickable = (d: number, m: number): boolean =>
    !pickingLocked && (canEnd(d, m) || canStart(d, m));

  const handleCellClick = (weekday: number, minute: number): void => {
    if (pickingLocked) return;
    if (draftStart && canEnd(weekday, minute)) {
      onPickRange?.({ weekday, startMin: draftStart.minute, endMin: minute });
      setHover(null);
    } else if (canStart(weekday, minute)) {
      onDraftStart?.({ weekday, minute });
      setHover({ weekday, minute });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 animate-pulse bg-muted rounded-md" />
        ))}
      </div>
    );
  }

  if (blocks.length === 0 && !interactive) {
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

  const preview =
    interactive && draftStart && hover && canEnd(hover.weekday, hover.minute)
      ? { weekday: draftStart.weekday, startMin: draftStart.minute, endMin: hover.minute }
      : null;

  return (
    <div className="border rounded-md overflow-x-auto bg-card">
      <div
        className={interactive ? "grid" : "grid min-w-[640px]"}
        style={{
          gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(${totalDataCols}, 1fr)`,
          gridTemplateRows: `auto repeat(${numRows}, ${interval * PX_PER_MINUTE}px)`,
          minWidth: interactive ? 900 : undefined,
        }}
      >
        {/* Header row */}
        <div className="sticky top-0 z-10 bg-card border-b border-r" />
        {days.map((d) => {
          const { startCol, colCount } = dayLayout[d];
          return (
            <div
              key={`head-${d}`}
              className="sticky top-0 z-10 bg-card border-b border-r py-2 text-center text-xs font-semibold text-muted-foreground not-interactive"
              style={{ gridColumn: `${startCol} / span ${colCount}` }}
            >
              {WEEKDAYS[d]}
            </div>
          );
        })}

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

        {/* Background grid: plain lines in display mode, clickable cells in interactive mode */}
        {interactive
          ? days.map((d) => {
              const { startCol, colCount } = dayLayout[d];
              return Array.from({ length: numRows }).map((_, i) => {
                const minute = gridStart + i * interval;
                const clickable = isClickable(d, minute);
                const outside = minute < winStart || minute > winEnd;
                const isDraftCell =
                  draftStart?.weekday === d && draftStart.minute === minute;
                return (
                  <div
                    key={`cell-${d}-${i}`}
                    role="button"
                    tabIndex={clickable ? 0 : -1}
                    onClick={() => handleCellClick(d, minute)}
                    onMouseEnter={() => {
                      if (!pickingLocked) setHover({ weekday: d, minute });
                    }}
                    className={
                      !clickable
                        ? `border-b border-r pointer-events-none cursor-not-allowed ${outside ? "bg-muted/60" : ""}`
                        : `border-b border-r cursor-pointer transition-colors ${
                            isDraftCell
                              ? "bg-primary/25 ring-1 ring-inset ring-primary"
                              : "hover:bg-primary/10"
                          }`
                    }
                    style={{
                      gridRow: i + 2,
                      gridColumn: `${startCol} / span ${colCount}`,
                    }}
                  />
                );
              });
            })
          : Array.from({ length: totalDataCols }).map((_, colIdx) =>
              Array.from({ length: numRows }).map((_, rowIdx) => (
                <div
                  key={`bg-${colIdx}-${rowIdx}`}
                  className={`border-b ${colIdx === totalDataCols - 1 ? "" : "border-r"}`}
                  style={{ gridRow: rowIdx + 2, gridColumn: colIdx + 2 }}
                />
              )),
            )}

        {/* Class blocks */}
        {days.map((d) => {
          const { startCol, blocks: dayBlocks } = dayLayout[d];
          return dayBlocks.map((b) => {
            const rowStart = 2 + Math.round((b.startMin - gridStart) / interval);
            const rowSpan = Math.max(1, Math.round((b.endMin - b.startMin) / interval));

            return (
              <div
                key={b.key}
                className={`m-0.5 rounded-md border px-1.5 py-1 overflow-hidden ${colorForClass(b.classId)}`}
                style={{
                  gridRow: `${rowStart} / span ${rowSpan}`,
                  gridColumn: startCol + b.col,
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
          });
        })}

        {/* Hover preview of the in-progress selection */}
        {interactive && preview && dayLayout[preview.weekday] && (
          <div
            className="bg-primary/15 border-primary/60 border rounded-md pointer-events-none"
            style={{
              gridRow: `${2 + Math.round((preview.startMin - gridStart) / interval)} / span ${Math.max(1, Math.round((preview.endMin - preview.startMin) / interval))}`,
              gridColumn: dayLayout[preview.weekday].startCol,
            }}
          />
        )}

        {/* Committed picks */}
        {interactive &&
          pickedRanges.map((range, idx) => {
            const { startCol } = dayLayout[range.weekday] ?? {};
            if (startCol == null) return null;
            const rowStart = 2 + Math.round((range.startMin - gridStart) / interval);
            const rowSpan = Math.max(1, Math.round((range.endMin - range.startMin) / interval));
            return (
              <div
                key={`pick-${idx}-${range.startMin}`}
                className="m-0.5 rounded-md border bg-primary/15 border-primary/60 px-1.5 py-1 overflow-hidden"
                style={{
                  gridRow: `${rowStart} / span ${rowSpan}`,
                  gridColumn: startCol,
                }}
              >
                <p className="text-[11px] font-medium leading-tight truncate not-interactive">
                  New slot
                </p>
                <p className="text-[9px] opacity-70 leading-tight not-interactive">
                  {toLabel(range.startMin)}–{toLabel(range.endMin)}
                </p>
              </div>
            );
          })}
      </div>
    </div>
  );
}