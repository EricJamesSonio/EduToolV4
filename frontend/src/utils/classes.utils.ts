export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function formatSchedule(
  schedules: Array<{ weekday: number; startTime: string }> | undefined
): string {
  if (!schedules?.length) return "—";
  return schedules
    .map((s) => `${WEEKDAY_LABELS[s.weekday]} ${s.startTime}`)
    .join(", ");
}