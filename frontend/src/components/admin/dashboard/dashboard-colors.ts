export const TREND_SERIES = [
  { key: "active", label: "Active", color: "var(--primary)" },
  { key: "pending", label: "Pending", color: "var(--chart-2)" },
  { key: "unenrolled", label: "Unenrolled", color: "var(--chart-6)" },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  active: "var(--primary)",
  pending: "var(--chart-2)",
  unenrolled: "var(--chart-6)",
};

export const SECTION_COLORS: Record<string, string> = {
  assigned: "var(--primary)",
  unassigned: "var(--chart-9)",
};

export const CATEGORY_COLORS: string[] = Array.from(
  { length: 10 },
  (_, i) => `var(--chart-${i + 1})`,
);

export const OTHERS_COLOR = "var(--chart-9)";