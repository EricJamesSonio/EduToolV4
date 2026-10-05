/**
 * class-schedule.util.ts
 *
 * Pure, dependency-free helpers for reasoning about class schedule time slots.
 * Kept as plain exports so that any code path that assigns a schedule can rely
 * on the same semantics without importing a full class/service/DB context.
 */

export interface ClassScheduleInput {
  weekday: number;
  startTime: Date;
  endTime: Date;
}

export function parseTimeToDate(
  hhmm: string,
  referenceDate = new Date(),
): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const d = new Date(referenceDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export function toTimeSlot(s: ClassScheduleInput) {
  return {
    weekday: s.weekday,
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime),
  };
}

/** True when two slots share a weekday and their [start, end) intervals overlap. */
export function slotsOverlap(
  a: ClassScheduleInput,
  b: ClassScheduleInput,
): boolean {
  if (a.weekday !== b.weekday) return false;
  const aStart = new Date(a.startTime).getTime();
  const aEnd = new Date(a.endTime).getTime();
  const bStart = new Date(b.startTime).getTime();
  const bEnd = new Date(b.endTime).getTime();
  return aStart < bEnd && aEnd > bStart;
}

/** A slot expressed as minutes-of-day, with no date component at all. */
export interface MinuteSlot {
  weekday: number;
  startMin: number;
  endMin: number;
}

/** Minutes-of-day for a stored/incoming schedule Date (local wall-clock). */
export function dateToMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Minutes-of-day from a stored/incoming schedule Date. */
export function toMinuteSlot(
  weekday: number,
  startTime: Date,
  endTime: Date,
): MinuteSlot {
  return {
    weekday,
    startMin: dateToMinutes(startTime),
    endMin: dateToMinutes(endTime),
  };
}

/**
 * True when two slots share a weekday and their [start, end) wall-clock
 * intervals overlap.
 *
 * This is the comparison every conflict check (educator / section / room) MUST
 * use. Do NOT use `slotsOverlap` for conflict detection: `parseTimeToDate`
 * stamps *today's* date onto each slot, so a slot persisted last Tuesday and
 * one persisted today carry different date components and their full
 * timestamps never compare as overlapping — even at identical weekday and
 * clock time. Comparing minutes-of-day removes the meaningless date entirely.
 *
 * The frontend equivalent is `slotsOverlap` in `utils/classes.utils.ts`, which
 * has always compared "HH:mm" strings and was therefore correct; that mismatch
 * is why the server-side gap went unnoticed.
 */
export function minuteSlotsOverlap(a: MinuteSlot, b: MinuteSlot): boolean {
  if (a.weekday !== b.weekday) return false;
  return a.startMin < b.endMin && a.endMin > b.startMin;
}
