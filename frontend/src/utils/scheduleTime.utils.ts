/**
 * Schedule time normalization.
 *
 * `Schedule.start_time` / `end_time` are stored as ISO datetimes
 * (e.g. "2026-04-02T08:00:00.000Z"), but WeeklyScheduleGrid parses "HH:mm".
 * Passing the raw ISO string through made toMinutes() produce NaN, which
 * collapsed the grid into a single crushed row with labels like "12nn".
 *
 * Kept separate from classes.utils' private toTimeString so the student and
 * admin schedule adapters share one conversion instead of each inventing one.
 */

/** ISO datetime (or already "HH:mm") -> "HH:mm". Returns "" when unusable. */
export function toHHmm(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") return "";

  const trimmed = value.trim();

  // Already "HH:mm" (or "HH:mm:ss") — pass through, normalized.
  const simple = /^(\d{1,2}):(\d{2})/.exec(trimmed);
  if (simple && !trimmed.includes("T")) {
    return `${String(Number(simple[1])).padStart(2, "0")}:${simple[2]}`;
  }

  // ISO datetime. Parsed in local time to match how the admin classes list
  // already renders these (toTimeString uses getHours/getMinutes).
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  const h = String(parsed.getHours()).padStart(2, "0");
  const m = String(parsed.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}