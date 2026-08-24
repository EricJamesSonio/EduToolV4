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

  // ── Interactive selection mode (optional) ─────────────────────────────────
  // When enabled the grid uses fixed 30-minute rows, shows all weekdays, and
  // lets the caller select a free day/time range via callback. Class blocks
  // and already-picked ranges remain non-clickable.
  interactive?: boolean;
  showAllDays?: boolean;
  pickedRanges?: ScheduleRange[];
  /** Stop accepting new picks once pickedRanges reaches this length. */
  maxPicks?: number;
  draftStart?: DraftCell | null;
  defaultWindowStartMin?: number;
  defaultWindowEndMin?: number;
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

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sat, Sun appended only if used
const MIN_INTERVAL_CANDIDATES = [30, 15, 10, 5, 1];
const PX_PER_MINUTE = 1.1;
const TIME_COL_WIDTH = 64;
const INTERACTIVE_STEP_MIN = 30;

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

/**
 * Assigns each block in a single day to a sub-column so that
 * time-overlapping blocks sit side-by-side instead of stacking.
 * Blocks that don't overlap anything get colCount = 1 (full day width).
 */
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
  defaultWindowStartMin,
  defaultWindowEndMin,
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
      const step = INTERACTIVE_STEP_MIN;
      if (blocks.length === 0) {
        const start = defaultWindowStartMin ?? 7 * 60;
        const end = defaultWindowEndMin ?? 18 * 60;
        return { gridStart: start, gridEnd: end, interval: step };
      }
      const starts = blocks.map((b) => b.startMin);
      const ends = blocks.map((b) => b.endMin);
      const gridStart = Math.floor(Math.min(...starts) / step) * step - step;
      const gridEnd = Math.ceil(Math.max(...ends) / step) * step + step;
      return { gridStart, gridEnd, interval: step };
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
  }, [blocks, interactive, defaultWindowStartMin, defaultWindowEndMin]);

  // Per-day column layout: each day gets its own contiguous run of grid
  // columns (1 normally, or N if it has N overlapping classes at once).
  const { dayLayout, totalDataCols } = useMemo(() => {
    let col = 2; // column 1 is the time-label column
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

  const isOccupied = (weekday: number, minute: number): boolean =>
    blocks.some((b) => b.weekday === weekday && minute >= b.startMin && minute < b.endMin) ||
    pickedRanges.some((r) => r.weekday === weekday && minute >= r.startMin && minute < r.endMin);

  const handleCellClick = (weekday: number, minute: number): void => {
    if (pickingLocked || isOccupied(weekday, minute)) return;
    if (!draftStart || draftStart.weekday !== weekday || minute <= draftStart.minute) {
      onDraftStart?.({ weekday, minute });
      setHover({ weekday, minute });
      return;
    }
    onPickRange?.({ weekday, startMin: draftStart.minute, endMin: minute });
    setHover(null);
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
    interactive && draftStart && hover
      ? (draftStart.weekday === hover.weekday && hover.minute > draftStart.minute
          ? { weekday: draftStart.weekday, startMin: draftStart.minute, endMin: hover.minute }
          : null)
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

        {/* Background grid — display mode renders plain lines, interactive mode
            renders clickable day/time cells for free slots. */}
        {interactive
          ? days.map((d) => {
              const { startCol, colCount } = dayLayout[d];
              return Array.from({ length: numRows }).map((_, i) => {
                const minute = gridStart + i * interval;
                const occupied = isOccupied(d, minute);
                const isDraftCell =
                  draftStart?.weekday === d && draftStart.minute === minute;
                return (
                  <div
                    key={`cell-${d}-${i}`}
                    role="button"
                    tabIndex={occupied || pickingLocked ? -1 : 0}
                    onClick={() => handleCellClick(d, minute)}
                    onMouseEnter={() => {
                      if (!pickingLocked) setHover({ weekday: d, minute });
                    }}
                    className={occupied || pickingLocked
                      ? "border-b border-r pointer-events-none cursor-not-allowed"
                      : `border-b border-r cursor-pointer transition-colors ${
                          isDraftCell
                            ? "bg-primary/25 ring-1 ring-inset ring-primary"
                            : "hover:bg-primary/10"
                        }`}
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

        {/* Class blocks — placed purely via grid row/column tracks */}
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

        {/* Committed picks — highlighted and non-clickable */}
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