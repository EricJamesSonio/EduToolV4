/**
 * class-schedule.util.ts
 *
 * Pure, dependency-free helpers for reasoning about class schedule time slots.
 * Kept as plain exports so that any code path that assigns a schedule can rely
 * on the same semantics without importing a full class/service/DB context.
 *
 * TIMEZONE RULE: these functions are the ONLY backend code that converts
 * between a `Date` and an "HH:mm" schedule time, and they do it in UTC. They
 * intentionally delegate to `commons/utils/schedule-time.util.ts` for the
 * conversion itself; the local shims kept here are deprecated aliases so
 * existing callers keep working while they migrate. New code imports the
 * shared helper directly (the ESLint guard enforces this).
 */

import {
  hhmmToScheduleDate,
  scheduleDateToMinutes as sharedScheduleDateToMinutes,
} from '@/commons/utils/schedule-time.util';

export interface ClassScheduleInput {
  weekday: number;
  startTime: Date;
  endTime: Date;
}

/**
 * "HH:mm" -> a `Date` carrying it as UTC wall-clock, anchored on the given
 * reference date (defaults to now).
 *
 * This is the write half of the schedule-time convention: the anchor date is
 * inherited from the reference (usually the row's creation date) and only the
 * time component is UTC-marked. Do NOT canonicalise to 1970 — the stored date
 * is part of the write audit trail (it is what provenance checks compare).
 */
export function parseTimeToDate(
  hhmm: string,
  referenceDate = new Date(),
): Date {
  return hhmmToScheduleDate(hhmm, referenceDate);
}

export function toTimeSlot(s: ClassScheduleInput) {
  return {
    weekday: s.weekday,
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime),
  };
}

/**
 * DELETED, intentionally, not moved: `slotsOverlap` here compared FULL
 * timestamps (`new Date(...).getTime()`). Rows written on different days never
 * overlapped even at identical weekday + clock time, so any caller inherited a
 * silent never-conflicts bug. The minutes-of-day equivalent that the conflict
 * layer relies on is `slotsOverlap` in `class-conflict.util.ts` (a different
 * symbol) and `minuteSlotsOverlap` below. If this resurrects in a future diff,
 * the ESLint `getHours` guard and the TZ test loop should catch why.
 */

/** A slot expressed as minutes-of-day, with no date component at all. */
export interface MinuteSlot {
  weekday: number;
  startMin: number;
  endMin: number;
}

/**
 * Minutes-of-day for a stored/incoming schedule Date (UTC wall-clock).
 *
 * @deprecated Import `scheduleDateToMinutes` from
 * `commons/utils/schedule-time.util.ts` instead. Kept so existing callers
 * keep compiling; new code must use the shared helper.
 */
export function dateToMinutes(d: Date): number {
  return sharedScheduleDateToMinutes(d);
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
