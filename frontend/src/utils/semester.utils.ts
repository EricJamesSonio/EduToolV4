/**
 * Semester resolution shared by the student/educator class and schedule views.
 *
 * Previously duplicated per page; extracted so the schedule page and the class
 * list always agree on which semester is "current" (a student switching tabs
 * should not see two different answers).
 */

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

  const now = Date.now();

  const current = semesters.find((s) => {
    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    return start <= now && now <= end;
  });
  if (current) return current.id;

  const upcoming = semesters
    .filter((s) => new Date(s.startDate).getTime() > now)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  if (upcoming.length > 0) return upcoming[0].id;

  const past = [...semesters].sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
  );
  return past[0]?.id ?? null;
}