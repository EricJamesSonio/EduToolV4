export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface SlotInput {
  weekday: number;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

export function timeToMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Mirrors backend/src/modules/class/class-schedule.util.ts `slotsOverlap`:
 * true when two slots share a weekday and their [start, end) intervals
 * overlap. Times are "HH:mm" wall-clock strings compared as minutes-of-day,
 * equivalent to the backend's same-day parse (start < end is validated
 * server-side, so no buffer applies). Kept as the single frontend source of
 * truth for the backend's conflict rule.
 */
export function slotsOverlap(a: SlotInput, b: SlotInput): boolean {
  if (a.weekday !== b.weekday) return false;
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && aEnd > bStart;
}

export function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const hours = d.getHours();
    const minutes = d.getMinutes();
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