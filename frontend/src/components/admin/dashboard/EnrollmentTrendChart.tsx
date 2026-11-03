"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  format,
  subMonths,
} from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  EnrollmentTimeline,
  EnrollmentTimelineInterval,
} from "@/types/admin/analytics.types";
import { TREND_SERIES } from "./dashboard-colors";

interface EnrollmentTrendChartProps {
  data: EnrollmentTimeline | undefined;
  isLoading: boolean;
  placeholderStart?: Date;
  placeholderEnd?: Date;
}

const DEFAULT_WIDTH = 720;
const MIN_WIDTH = 280;
const HEIGHT = 190;
const PAD = { top: 12, right: 14, bottom: 26, left: 32 };
const INNER_H = HEIGHT - PAD.top - PAD.bottom;
const TICKS = 4;
const TOOLTIP_W = 150;
const MAX_PLACEHOLDER_POINTS = 60;

function parseBucket(bucket: string): Date {
  const [y, m, d] = bucket.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatBucket(
  bucket: string,
  interval: EnrollmentTimelineInterval,
): string {
  const date = parseBucket(bucket);
  return interval === "month" ? format(date, "MMM yyyy") : format(date, "MMM d");
}

function computeYMax(max: number): number {
  if (max <= TICKS) return TICKS;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const ratio = max / pow;
  const step = [1, 2, 5, 10].find((s) => ratio <= s) ?? 10;
  return Math.ceil((step * pow) / TICKS) * TICKS;
}

function buildEmptyTimeline(start?: Date, end?: Date): EnrollmentTimeline {
  let to = end ?? new Date();
  let from = start ?? subMonths(to, 1);
  if (from.getTime() > to.getTime()) {
    const swap = from;
    from = to;
    to = swap;
  }

  const spanDays = Math.max(1, differenceInCalendarDays(to, from));
  const interval: EnrollmentTimelineInterval =
    spanDays <= 45 ? "day" : spanDays <= 200 ? "week" : "month";

  let dates: Date[];
  if (interval === "day") {
    dates = eachDayOfInterval({ start: from, end: to });
  } else if (interval === "week") {
    dates = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 });
  } else {
    dates = eachMonthOfInterval({ start: from, end: to });
  }

  return {
    interval,
    points: dates.slice(0, MAX_PLACEHOLDER_POINTS).map((date) => ({
      bucket: format(date, "yyyy-MM-dd"),
      active: 0,
      pending: 0,
      unenrolled: 0,
      total: 0,
    })),
    totals: { active: 0, pending: 0, unenrolled: 0, total: 0 },
  };
}

export function EnrollmentTrendChart({
  data,
  isLoading,
  placeholderStart,
  placeholderEnd,
}: EnrollmentTrendChartProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = (): void => {
      setWidth(Math.max(MIN_WIDTH, Math.floor(el.clientWidth)));
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const source = useMemo<EnrollmentTimeline>(() => {
    if (data && data.points.length > 0) return data;
    return buildEmptyTimeline(placeholderStart, placeholderEnd);
  }, [data, placeholderStart, placeholderEnd]);

  const isEmpty = source.totals.total === 0;

  const model = useMemo(() => {
    const innerW = width - PAD.left - PAD.right;

    const withData = TREND_SERIES.filter((s) =>
      source.points.some((p) => p[s.key] > 0),
    );
    const visible = withData.length > 0 ? withData : [...TREND_SERIES];

    const n = source.points.length;
    const max = Math.max(
      0,
      ...source.points.flatMap((p) => visible.map((s) => p[s.key])),
    );
    const yMax = computeYMax(max);

    const xAt = (i: number): number =>
      n === 1 ? PAD.left + innerW / 2 : PAD.left + (i * innerW) / (n - 1);
    const yAt = (v: number): number => PAD.top + INNER_H * (1 - v / yMax);

    const lines = visible.map((s) => ({
      ...s,
      path: source.points
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p[s.key]).toFixed(1)}`,
        )
        .join(" "),
    }));

    const baseY = PAD.top + INNER_H;
    const areaPath =
      n > 1
        ? `${lines[0].path} L${xAt(n - 1).toFixed(1)},${baseY} L${xAt(0).toFixed(1)},${baseY} Z`
        : "";

    const labelSlots = Math.max(2, Math.floor(innerW / 70));

    return {
      visible,
      lines,
      areaPath,
      yMax,
      n,
      xAt,
      yAt,
      labelStep: Math.max(1, Math.ceil(n / labelSlots)),
      hitWidth: n === 1 ? innerW : innerW / (n - 1),
    };
  }, [source, width]);

  const { visible, lines, areaPath, yMax, n, xAt, yAt, labelStep, hitWidth } = model;
  const hoverPoint = hoverIndex !== null ? source.points[hoverIndex] : null;

  let tooltipX = 0;
  if (hoverIndex !== null) {
    const preferred = xAt(hoverIndex) + 12;
    tooltipX =
      preferred + TOOLTIP_W > width - PAD.right
        ? xAt(hoverIndex) - 12 - TOOLTIP_W
        : preferred;
  }
  const tooltipH = 26 + visible.length * 16;

  return (
    <div ref={containerRef} className="w-full">
      {isLoading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {visible.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-xs text-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span>{s.label}</span>
                <span className="font-semibold">{source.totals[s.key]}</span>
              </div>
            ))}
          </div>

          <svg
            width={width}
            height={HEIGHT}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            className="block max-w-full"
            role="img"
            aria-label="Enrollments over time"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {Array.from({ length: TICKS + 1 }, (_, i) => {
              const value = (i * yMax) / TICKS;
              const y = yAt(value);
              return (
                <g key={i}>
                  <line
                    x1={PAD.left}
                    x2={width - PAD.right}
                    y1={y}
                    y2={y}
                    stroke="var(--border)"
                    strokeDasharray={i === 0 ? undefined : "3 4"}
                    strokeWidth="1"
                  />
                  <text
                    x={PAD.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--muted-foreground)"
                  >
                    {value}
                  </text>
                </g>
              );
            })}

            {source.points.map((p, i) =>
              i % labelStep === 0 ? (
                <text
                  key={p.bucket}
                  x={xAt(i)}
                  y={HEIGHT - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--muted-foreground)"
                >
                  {formatBucket(p.bucket, source.interval)}
                </text>
              ) : null,
            )}

            {areaPath && !isEmpty && (
              <path d={areaPath} fill={lines[0].color} fillOpacity="0.08" />
            )}

            {lines.map((line) => (
              <path
                key={line.key}
                d={line.path}
                fill="none"
                stroke={line.color}
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeOpacity={isEmpty ? 0.55 : 1}
              />
            ))}

            {n <= 31 &&
              lines.map((line) =>
                source.points.map((p, i) => (
                  <circle
                    key={`${line.key}-${p.bucket}`}
                    cx={xAt(i)}
                    cy={yAt(p[line.key])}
                    r="2.5"
                    fill={line.color}
                    fillOpacity={isEmpty ? 0.55 : 1}
                  />
                )),
              )}

            {isEmpty && (
              <text
                x={width / 2}
                y={PAD.top + INNER_H / 2 - 8}
                textAnchor="middle"
                fontSize="12"
                fill="var(--muted-foreground)"
              >
                No enrollments in this period
              </text>
            )}

            {hoverIndex !== null && (
              <line
                x1={xAt(hoverIndex)}
                x2={xAt(hoverIndex)}
                y1={PAD.top}
                y2={PAD.top + INNER_H}
                stroke="var(--muted-foreground)"
                strokeOpacity="0.5"
                strokeDasharray="3 3"
              />
            )}

            {hoverIndex !== null &&
              hoverPoint &&
              lines.map((line) => (
                <circle
                  key={`hover-${line.key}`}
                  cx={xAt(hoverIndex)}
                  cy={yAt(hoverPoint[line.key])}
                  r="4.5"
                  fill="var(--card)"
                  stroke={line.color}
                  strokeWidth="2"
                />
              ))}

            {source.points.map((p, i) => (
              <rect
                key={`hit-${p.bucket}`}
                x={xAt(i) - hitWidth / 2}
                y={PAD.top}
                width={hitWidth}
                height={INNER_H}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
              />
            ))}

            {hoverIndex !== null && hoverPoint && (
              <g pointerEvents="none">
                <rect
                  x={tooltipX}
                  y={PAD.top + 4}
                  width={TOOLTIP_W}
                  height={tooltipH}
                  rx="6"
                  fill="var(--popover)"
                  stroke="var(--border)"
                />
                <text
                  x={tooltipX + 10}
                  y={PAD.top + 21}
                  fontSize="11"
                  fontWeight="600"
                  fill="var(--popover-foreground)"
                >
                  {formatBucket(hoverPoint.bucket, source.interval)}
                </text>
                {visible.map((s, idx) => (
                  <g key={s.key}>
                    <circle
                      cx={tooltipX + 14}
                      cy={PAD.top + 36 + idx * 16}
                      r="4"
                      fill={s.color}
                    />
                    <text
                      x={tooltipX + 24}
                      y={PAD.top + 40 + idx * 16}
                      fontSize="11"
                      fill="var(--popover-foreground)"
                    >
                      {s.label}: {hoverPoint[s.key]}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </svg>
        </div>
      )}
    </div>
  );
}