import type { Class } from "@/types/admin/class.types";
import type { StudentClassItem } from "@/api/student/class.api";
import type { StudentEnrollment } from "@/api/admin/student.api";
import { toHHmm } from "@/utils/scheduleTime.utils";

/**
 * Adapters that turn a student's enrollment payloads into the `Class[]` shape
 * the shared WeeklyScheduleGrid consumes, so the student and admin schedule
 * surfaces render identically to the educator one.
 *
 * Both student endpoints already return schedules (the student payload via
 * `class.schedules`, the admin one via Enrollment.findByStudentAcrossOrg which
 * includes `schedules: true`) — no extra request is needed.
 */

interface RawSchedule {
  id?: string;
  weekday: number;
  startTime?: string;
  endTime?: string;
  start_time?: string;
  end_time?: string;
}

/**
 * Schedule times arrive as ISO datetimes, but the grid parses "HH:mm" — so
 * they MUST be converted here. Missing the conversion yields NaN start/end
 * minutes, which collapses the whole grid into one crushed row.
 */
const asTime = (s: RawSchedule): { start: string; end: string } => ({
  start: toHHmm(s.startTime ?? s.start_time),
  end: toHHmm(s.endTime ?? s.end_time),
});

/**
 * WeeklyScheduleGrid keys each block by `schedule.id`. The student-facing API
 * normalizer drops that id, so synthesize a stable one from the class + slot.
 * Stable matters: a key that changed on every render would remount the block
 * and lose its styling/interaction state.
 */
const scheduleId = (
  classId: string,
  s: RawSchedule,
  index: number,
): string => {
  if (s.id) return s.id;
  const { start, end } = asTime(s);
  return `${classId}:${s.weekday}:${start}-${end}:${index}`;
};

const toClass = (
  id: string,
  subjectName: string | null,
  sectionName: string | null,
  schedules: unknown,
  subjectId = "",
  semesterId: string | null = null,
): Class => {
  const raw = Array.isArray(schedules) ? (schedules as RawSchedule[]) : [];
  return {
    id,
    subjectName,
    sectionName,
    subjectId,
    // Carried through so the schedule page can scope to a semester; the grid
    // itself ignores it.
    semesterId,
    // A slot with an unparseable time would feed NaN into the grid layout, so
    // drop it rather than let one bad row distort the whole timetable.
    schedules: raw
      .map((s, i) => {
        const { start, end } = asTime(s);
        return {
          id: scheduleId(id, s, i),
          weekday: s.weekday,
          startTime: start,
          endTime: end,
        };
      })
      .filter((s) => s.startTime !== "" && s.endTime !== ""),
  } as Class;
};

/**
 * From the student-facing endpoint (`/student/classes`).
 * Removed enrollments are excluded — they are history, not a weekly commitment.
 */
export function studentClassesToScheduleClasses(
  items: StudentClassItem[] | undefined,
): Class[] {
  return (items ?? [])
    .filter((i) => i.enrollmentStatus !== "removed")
    .map((i) =>
      toClass(
        i.class.id,
        i.class.subjectName,
        null,
        i.class.schedules,
        i.class.subjectId,
        i.class.semesterId,
      ),
    );
}

/**
 * From the admin endpoint (`/students/:id/enrollments`), which nests the class
 * under `class` and returns snake_case schedule fields.
 */
export function studentEnrollmentsToScheduleClasses(
  enrollments: StudentEnrollment[] | undefined,
): Class[] {
  return (enrollments ?? [])
    .filter((e) => e.status !== "removed")
    .map((e) =>
      toClass(
        e.class_id,
        e.class?.subject?.name ?? null,
        null,
        (e.class as { schedules?: unknown } | undefined)?.schedules,
        e.class?.subject_id ?? "",
        e.semester_id ?? null,
      ),
    );
}

/** True when at least one class actually has schedule times assigned. */
export function hasAnySchedule(classes: Class[] | undefined): boolean {
  return (classes ?? []).some((c) => (c.schedules?.length ?? 0) > 0);
}