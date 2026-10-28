"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  EnrollmentTimeline,
  EnrollmentTimelineInterval,
} from "@/types/admin/analytics.types";
import { TREND_SERIES } from "./dashboard-colors";

interface EnrollmentTrendChartProps {
  data: EnrollmentTimeline | undefined;
  isLoading: boolean;
}

const WIDTH = 720;
const HEIGHT = 280;
const PAD = { top: 16, right: 16, bottom: 34, left: 40 };
const INNER_W = WIDTH - PAD.left - PAD.right;
const INNER_H = HEIGHT - PAD.top - PAD.bottom;
const TICKS = 4;
const TOOLTIP_W = 150;

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

export function EnrollmentTrendChart({
  data,
  isLoading,
}: EnrollmentTrendChartProps): React.JSX.Element {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const model = useMemo(() => {
    if (!data || data.points.length === 0) return null;

    const visible = TREND_SERIES.filter((s) =>
      data.points.some((p) => p[s.key] > 0),
    );
    if (visible.length === 0) return null;

    const n = data.points.length;
    const max = Math.max(
      ...data.points.flatMap((p) => visible.map((s) => p[s.key])),
    );
    const yMax = computeYMax(max);

    const xAt = (i: number): number =>
      n === 1 ? PAD.left + INNER_W / 2 : PAD.left + (i * INNER_W) / (n - 1);
    const yAt = (v: number): number => PAD.top + INNER_H * (1 - v / yMax);

    const lines = visible.map((s) => ({
      ...s,
      path: data.points
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p[s.key]).toFixed(1)}`,
        )
        .join(" "),
    }));

    const baseY = PAD.top + INNER_H;
    const areaPath = `${lines[0].path} L${xAt(n - 1).toFixed(1)},${baseY} L${xAt(0).toFixed(1)},${baseY} Z`;

    return {
      visible,
      lines,
      areaPath,
      yMax,
      n,
      xAt,
      yAt,
      labelStep: Math.max(1, Math.ceil(n / 7)),
      hitWidth: n === 1 ? INNER_W : INNER_W / (n - 1),
    };
  }, [data]);

  if (isLoading) {
    return <Skeleton className="h-[280px] w-full" />;
  }

  if (!data || !model) {
    return (
      <div className="flex h-[280px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
        No enrollments found for this period.
      </div>
    );
  }

  const { visible, lines, areaPath, yMax, n, xAt, yAt, labelStep, hitWidth } = model;
  const hoverPoint = hoverIndex !== null ? data.points[hoverIndex] : null;

  let tooltipX = 0;
  if (hoverIndex !== null) {
    const preferred = xAt(hoverIndex) + 12;
    tooltipX =
      preferred + TOOLTIP_W > WIDTH - PAD.right
        ? xAt(hoverIndex) - 12 - TOOLTIP_W
        : preferred;
  }
  const tooltipH = 26 + visible.length * 16;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {visible.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-foreground">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span>{s.label}</span>
            <span className="font-semibold">{data.totals[s.key]}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
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
                x2={WIDTH - PAD.right}
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

        {data.points.map((p, i) =>
          i % labelStep === 0 ? (
            <text
              key={p.bucket}
              x={xAt(i)}
              y={HEIGHT - 12}
              textAnchor="middle"
              fontSize="11"
              fill="var(--muted-foreground)"
            >
              {formatBucket(p.bucket, data.interval)}
            </text>
          ) : null,
        )}

        {n > 1 && <path d={areaPath} fill={lines[0].color} fillOpacity="0.08" />}

        {lines.map((line) => (
          <path
            key={line.key}
            d={line.path}
            fill="none"
            stroke={line.color}
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {n <= 31 &&
          lines.map((line) =>
            data.points.map((p, i) => (
              <circle
                key={`${line.key}-${p.bucket}`}
                cx={xAt(i)}
                cy={yAt(p[line.key])}
                r="3"
                fill={line.color}
              />
            )),
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
              r="5"
              fill="var(--card)"
              stroke={line.color}
              strokeWidth="2.5"
            />
          ))}

        {data.points.map((p, i) => (
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
              {formatBucket(hoverPoint.bucket, data.interval)}
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
  );
}