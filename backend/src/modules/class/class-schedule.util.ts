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
