/**
 * Semester resolution shared by the student/educator class and schedule views.
 *
 * Previously duplicated per page; extracted so the schedule page and the class
 * list always agree on which semester is "current" (a student switching tabs
 * should not see two different answers).
 *
 * TICK-INFRA-017: semesters are kind-B calendar days. "Current" means the
 * school day (todayInZone, Asia/Manila) falls within [startDay, endDay] —
 * never an instant-vs-now comparison, so SSR and browser always agree and a
 * semester ending today still counts as current (R6).
 */

import { calendarDateOf, todayInZone } from "./datetime.util";

export interface SemesterLike {
  id: string;
  startDate: string;
  endDate: string;
}

/**
 * Picks the semester that should be selected by default, in priority order:
 * 1. A semester whose date range contains today ("currently active" by date).
 * 2. If none is currently active, the next upcoming semester (earliest
 *    start date that's still in the future).
 * 3. If nothing is upcoming either (every semester has already ended),
 *    fall back to the most recently ended one so the view isn't empty.
 * Returns null only when there are no semesters at all.
 */
export function getDefaultSemesterId(
  semesters: SemesterLike[] | undefined,
): string | null {
  if (!semesters || semesters.length === 0) return null;

  const today = todayInZone();
  const days = semesters.map((s) => ({
    id: s.id,
    start: calendarDateOf(s.startDate),
    end: calendarDateOf(s.endDate),
  }));

  const current = days.find((s) => s.start <= today && today <= s.end);
  if (current) return current.id;

  const upcoming = days
    .filter((s) => s.start > today)
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  if (upcoming.length > 0) return upcoming[0].id;

  const past = [...days].sort((a, b) =>
    a.end < b.end ? 1 : a.end > b.end ? -1 : 0,
  );
  return past[0]?.id ?? null;
}

/**
 * Id of the semester whose date range contains today, or null when none
 * does. Unlike getDefaultSemesterId there is deliberately NO upcoming/past
 * fallback: callers that offer an "All semesters" option use null for it.
 *
 * TICK-INFRA-017: same kind-B day semantics as getDefaultSemesterId.
 */
export function getCurrentSemesterId(
  semesters: SemesterLike[] | undefined,
): string | null {
  if (!semesters || semesters.length === 0) return null;

  const today = todayInZone();
  return (
    semesters.find((s) => {
      const start = calendarDateOf(s.startDate);
      const end = calendarDateOf(s.endDate);
      return start <= today && today <= end;
    })?.id ?? null
  );
}
