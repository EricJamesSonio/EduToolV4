"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export interface DonutDatum {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  subtitle?: string;
  data: DonutDatum[];
  isLoading: boolean;
  emptyText: string;
  centerLabel?: string;
}

const RADIUS = 15.9155;
const GAP = 0.6;

export function DonutChart({
  title,
  subtitle,
  data,
  isLoading,
  emptyText,
  centerLabel = "Total",
}: DonutChartProps): React.JSX.Element {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const visible = data.filter((d) => d.value > 0);
  const total = visible.reduce((sum, d) => sum + d.value, 0);
  const hovered = visible.find((d) => d.key === hoverKey) ?? null;

  let cumulative = 0;
  const arcs = visible.map((d) => {
    const pct = (d.value / total) * 100;
    const arc = {
      ...d,
      pct,
      dash: visible.length > 1 ? Math.max(pct - GAP, 0) : pct,
      offset: -cumulative,
    };
    cumulative += pct;
    return arc;
  });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-foreground not-interactive">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground not-interactive">{subtitle}</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-40 w-40 rounded-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : total === 0 ? (
        <div className="flex h-56 items-center justify-center px-4 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <>
          <div className="mx-auto w-44 max-w-full">
            <svg
              viewBox="0 0 42 42"
              className="h-auto w-full"
              role="img"
              aria-label={title}
              onMouseLeave={() => setHoverKey(null)}
            >
              <circle
                cx="21"
                cy="21"
                r={RADIUS}
                fill="none"
                stroke="var(--muted)"
                strokeWidth="5"
              />
              {arcs.map((arc) => (
                <circle
                  key={arc.key}
                  cx="21"
                  cy="21"
                  r={RADIUS}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={hoverKey === arc.key ? 6 : 5}
                  strokeDasharray={`${arc.dash} ${100 - arc.dash}`}
                  strokeDashoffset={arc.offset}
                  transform="rotate(-90 21 21)"
                  onMouseEnter={() => setHoverKey(arc.key)}
                  style={{ transition: "stroke-width 120ms ease" }}
                />
              ))}
              <text
                x="21"
                y="21.5"
                textAnchor="middle"
                fontSize="7"
                fontWeight="700"
                fill="var(--foreground)"
              >
                {hovered ? hovered.value : total}
              </text>
              <text
                x="21"
                y="27"
                textAnchor="middle"
                fontSize="2.6"
                fill="var(--muted-foreground)"
              >
                {hovered ? hovered.label.slice(0, 18) : centerLabel}
              </text>
            </svg>
          </div>

          <ul className="space-y-1.5">
            {visible.map((d) => (
              <li
                key={d.key}
                className="flex items-center gap-2 text-sm"
                onMouseEnter={() => setHoverKey(d.key)}
                onMouseLeave={() => setHoverKey(null)}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className="min-w-0 flex-1 truncate text-foreground">{d.label}</span>
                <span className="font-semibold text-foreground">{d.value}</span>
                <span className="w-10 text-right text-xs text-muted-foreground">
                  {Math.round((d.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}