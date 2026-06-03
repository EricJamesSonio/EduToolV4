export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const hours = d.getUTCHours();
    const minutes = d.getUTCMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, "0");
    return `${h}:${m} ${ampm}`;
  } catch {
    return iso;
  }
}

export function formatSchedule(
  schedules: Array<{ weekday: number; startTime: string }> | undefined
): string {
  if (!schedules?.length) return "—";
  return schedules
    .map((s) => `${WEEKDAY_LABELS[s.weekday]} ${formatTime(s.startTime)}`)
    .join(", ");
}