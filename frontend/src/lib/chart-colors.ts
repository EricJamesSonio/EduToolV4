/**
 * Categorical chart colors — non-semantic, visually distinct.
 * Uses --chart-1..10 tokens (see theme.css) via Tailwind `bg-chart-*` / `chart-dot-*`.
 * Do NOT use success/warning/destructive/info hues here; this palette is for
 * distinctness (e.g. week strips, program dots, grading type chips when >10 categories).
 */

export const CHART_DOT_BG = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-6",
  "bg-chart-7",
  "bg-chart-8",
  "bg-chart-9",
  "bg-chart-10",
] as const;

export const CHART_DOT_CLASS = [
  "chart-dot-1",
  "chart-dot-2",
  "chart-dot-3",
  "chart-dot-4",
  "chart-dot-5",
  "chart-dot-6",
  "chart-dot-7",
  "chart-dot-8",
  "chart-dot-9",
  "chart-dot-10",
] as const;

/** 10-color categorical set (dot + light bg + text), for cases needing bg+text */
export const CHART_BG_TEXT = [
  "bg-chart-1/10 text-[var(--chart-1)]",
  "bg-chart-2/10 text-[var(--chart-2)]",
  "bg-chart-3/10 text-[var(--chart-3)]",
  "bg-chart-4/10 text-[var(--chart-4)]",
  "bg-chart-5/10 text-[var(--chart-5)]",
  "bg-chart-6/10 text-[var(--chart-6)]",
  "bg-chart-7/10 text-[var(--chart-7)]",
  "bg-chart-8/10 text-[var(--chart-8)]",
  "bg-chart-9/10 text-[var(--chart-9)]",
  "bg-chart-10/10 text-[var(--chart-10)]",
] as const;

/** 12-entry TYPE_COLORS extension (cycles chart 1..10, then 1..2) — for ClassGradingSchemeCard 12 types */
export const CHART_12 = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-6",
  "bg-chart-7",
  "bg-chart-8",
  "bg-chart-9",
  "bg-chart-10",
  "bg-chart-1",
  "bg-chart-2",
] as const;

export const CHART_12_BG_TEXT = [
  "bg-chart-1/15 text-[var(--chart-1)] border-[var(--chart-1)]/20",
  "bg-chart-2/15 text-[var(--chart-2)] border-[var(--chart-2)]/20",
  "bg-chart-3/15 text-[var(--chart-3)] border-[var(--chart-3)]/20",
  "bg-chart-4/15 text-[var(--chart-4)] border-[var(--chart-4)]/20",
  "bg-chart-5/15 text-[var(--chart-5)] border-[var(--chart-5)]/20",
  "bg-chart-6/15 text-[var(--chart-6)] border-[var(--chart-6)]/20",
  "bg-chart-7/15 text-[var(--chart-7)] border-[var(--chart-7)]/20",
  "bg-chart-8/15 text-[var(--chart-8)] border-[var(--chart-8)]/20",
  "bg-chart-9/15 text-[var(--chart-9)] border-[var(--chart-9)]/20",
  "bg-chart-10/15 text-[var(--chart-10)] border-[var(--chart-10)]/20",
  "bg-chart-1/15 text-[var(--chart-1)] border-[var(--chart-1)]/20",
  "bg-chart-2/15 text-[var(--chart-2)] border-[var(--chart-2)]/20",
] as const;
