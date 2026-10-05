export interface ScheduleWindow {
  startTime: string;
  endTime: string;
  slotDuration: number;
  /**
   * Weekdays the school holds classes (0 = Sunday .. 6 = Saturday).
   * `undefined` means "not configured" and disables the weekday rule, which
   * keeps this helper backward compatible for callers (seeds, older tests)
   * that only know the time window.
   */
  activeWeekdays?: number[];
  /** Org-wide breaks. Same undefined-means-unconfigured convention. */
  breaks?: ScheduleBreak[];
}

/** An org-wide break. Org-wide in v1; per-day breaks are out of scope. */
export interface ScheduleBreak {
  label: string;
  start: string;
  end: string;
}

/** True when the weekday is one the school holds classes. Always true when
 *  the window carries no `activeWeekdays` (rule not configured). */
export function isActiveWeekday(w: ScheduleWindow, weekday: number): boolean {
  if (!w.activeWeekdays || w.activeWeekdays.length === 0) return true;
  return w.activeWeekdays.includes(weekday);
}

/** The break a [startMin, endMin) range overlaps, if any. */
export function findBreakOverlap(
  w: ScheduleWindow,
  startMin: number,
  endMin: number,
): ScheduleBreak | null {
  for (const b of w.breaks ?? []) {
    const bStart = toMinutes(b.start);
    const bEnd = toMinutes(b.end);
    if (startMin < bEnd && endMin > bStart) return b;
  }
  return null;
}

/**
 * The free `[start, end)` ranges inside the window once breaks are removed,
 * in ascending order. Used by the generator to enumerate placeable slots.
 */
export function getFreeMinuteRanges(
  w: ScheduleWindow,
): Array<{ startMin: number; endMin: number }> {
  const winStart = toMinutes(w.startTime);
  const winEnd = toMinutes(w.endTime);
  const breaks = (w.breaks ?? [])
    .map((b) => ({ startMin: toMinutes(b.start), endMin: toMinutes(b.end) }))
    .filter((b) => b.endMin > b.startMin)
    .sort((a, b) => a.startMin - b.startMin);

  const out: Array<{ startMin: number; endMin: number }> = [];
  let cursor = winStart;
  for (const b of breaks) {
    if (b.startMin > cursor) out.push({ startMin: cursor, endMin: b.startMin });
    cursor = Math.max(cursor, b.endMin);
  }
  if (cursor < winEnd) out.push({ startMin: cursor, endMin: winEnd });
  return out;
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function formatMinutes(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/**
 * Validates a `[startMin, endMin)` range against the org's schedule window.
 *
 * `weekday` is optional: when omitted (or when the window carries no
 * `activeWeekdays`), the weekday rule is skipped entirely so existing callers
 * that only know the time window keep working unchanged.
 */
export function getScheduleViolation(
  w: ScheduleWindow,
  startMin: number,
  endMin: number,
  weekday?: number,
): string | null {
  const winStart = toMinutes(w.startTime);
  const winEnd = toMinutes(w.endTime);
  const len = endMin - startMin;

  if (startMin < winStart || endMin > winEnd) {
    return `time ${formatMinutes(startMin)}–${formatMinutes(endMin)} is outside allowed range ${w.startTime}–${w.endTime}.`;
  }
  if (len <= 0 || len % w.slotDuration !== 0) {
    return `duration ${len}m must be a multiple of ${w.slotDuration}m.`;
  }
  if ((startMin - winStart) % w.slotDuration !== 0) {
    return `start time must align to ${w.slotDuration}m slots from ${w.startTime}.`;
  }
  if (weekday != null && !isActiveWeekday(w, weekday)) {
    return `the school does not hold classes on ${WEEKDAY_NAMES[weekday] ?? `weekday ${weekday}`}.`;
  }
  const brk = findBreakOverlap(w, startMin, endMin);
  if (brk) {
    return `this range overlaps the ${brk.label} break (${brk.start}–${brk.end}).`;
  }
  return null;
}

/** Weekday index -> English name, matching the JS `getDay()` numbering. */
export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;