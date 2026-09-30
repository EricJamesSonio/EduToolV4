/**
 * Shared prerequisite presentation helpers.
 *
 * The enroll gate is server-side (EnrollmentService.enroll -> checkEligibility).
 * Everything here is UX only: it lets the admin enrollment surfaces show which
 * students the gate would reject BEFORE an enroll attempt is made, so the
 * failure is understood instead of merely reported.
 *
 * Used by:
 *   - components/admin/school-years/program-view/ClassEnrollmentPanel (via page state)
 *   - components/admin/class/detail/EnrollStudentDialog
 *   - components/admin/student/detail/EnrollStudentInClassDialog
 */

export type PrerequisiteMissReason =
  | "not_taken"
  | "not_passed"
  | "not_locked";

export interface PrerequisiteMiss {
  subject_id: string;
  subject_name: string;
  reason: PrerequisiteMissReason;
}

/**
 * Human-readable label for a miss reason.
 *
 * NOTE: `not_locked` is currently unreachable in practice — the repository
 * query pre-filters `is_locked: true`, so a subject taken but not yet locked
 * resolves to `not_taken` upstream. The label is kept for when that is
 * corrected; callers should prefer `describeMissingPrerequisites` for copy
 * that stays accurate either way.
 */
export function missReasonLabel(reason: PrerequisiteMissReason): string {
  switch (reason) {
    case "not_passed":
      return "not passed";
    case "not_locked":
      return "grade not finalized";
    case "not_taken":
    default:
      return "not taken";
  }
}

/**
 * Compact reason-neutral summary, e.g. `Calculus` or `Calculus, Physics (+1 more)`.
 *
 * Deliberately does not assert the miss reason in the primary message: a
 * `not_taken` from the API can mean "never enrolled" or "grade not locked yet"
 * (see `missReasonLabel`), so claiming a specific cause could be wrong.
 */
export function describeMissingPrerequisites(
  missing: PrerequisiteMiss[] | undefined,
  maxNames = 2,
): string {
  if (!missing || missing.length === 0) return "";
  const names = missing.map((m) => m.subject_name).filter(Boolean);
  if (names.length === 0) return "";
  if (names.length <= maxNames) return names.join(", ");
  return `${names.slice(0, maxNames).join(", ")} (+${names.length - maxNames} more)`;
}

/**
 * The toast copy shown when a blocked student row is clicked. Explains why the
 * student cannot be enrolled right now, which is the whole point of showing
 * them grayed out instead of letting the enroll call fail.
 */
export function prerequisiteBlockMessage(
  studentName: string,
  missing: PrerequisiteMiss[] | undefined,
): string {
  const detail = describeMissingPrerequisites(missing, 3);
  if (!detail) {
    return `${studentName} cannot be enrolled in this class — unmet prerequisite.`;
  }
  const plural = (missing?.length ?? 0) > 1 ? "prerequisites" : "prerequisite";
  return `${studentName} cannot be enrolled — unmet ${plural}: ${detail}.`;
}

/** True when the given eligibility payload marks the student as blocked. */
export function hasUnmetPrerequisites(
  missing: PrerequisiteMiss[] | undefined,
): boolean {
  return !!missing && missing.length > 0;
}
/**
 * Prerequisite verdicts keyed by STUDENT id, then by subject id — this is the
 * exact shape the batch endpoint returns:
 *
 *   { "<studentId>": { "<subjectId>": { eligible, missing } } }
 *
 * The student id is the OUTER key. Reading the outer level with a subject id
 * silently yields undefined and makes every student look eligible, so the
 * lookup lives in one tested helper instead of being re-typed at each call site.
 */
export type PrereqEligibilityMap = Record<
  string,
  Record<string, { eligible: boolean; missing: PrerequisiteMiss[] }>
>;

/**
 * Unmet prerequisites for one student in one subject.
 *
 * Returns an empty array when the verdict is unknown, so a not-yet-loaded map
 * is indistinguishable from "nothing missing" — callers that need to tell those
 * apart should check their query state, not the length of this result.
 */
export function getMissingPrerequisites(
  map: PrereqEligibilityMap | undefined | null,
  studentId: string,
  subjectId: string | null | undefined,
): PrerequisiteMiss[] {
  if (!map || !studentId || !subjectId) return [];
  return map[studentId]?.[subjectId]?.missing ?? [];
}