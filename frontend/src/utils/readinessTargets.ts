/**
 * Readiness issues are reported *on* the page that owns the problem, so the fix
 * is usually one click away. This resolves a readiness issue (or one entity
 * inside it) to the admin page that can actually fix it.
 *
 * Two rules, in order:
 *  - `readinessTarget` routes a whole issue. Per-entity issues carry a `ref`
 *    and route to that entity. Aggregated issues have no single destination, so
 *    they return `null` and the caller renders their `entities` as chips.
 *  - `readinessEntityTarget` routes a single entity, by its own `type`.
 *
 * Every route returned here is an existing admin page. Anything that cannot be
 * resolved returns `null` and renders as plain text, so an unrecognised issue
 * code from a newer backend degrades instead of producing a dead link.
 */

import type {
  ReadinessEntity,
  ReadinessIssue,
} from "@/types/admin/school-year.types";

/**
 * Route for one entity, by kind. `schoolYearId` is required because some admin
 * pages are scoped to a school year rather than addressed by id alone.
 */
export function readinessEntityTarget(
  entity: Pick<ReadinessEntity, "id" | "type">,
  schoolYearId: string,
): string | null {
  const { id, type } = entity;
  switch (type) {
    case "program":
      return `/admin/programs/${id}`;
    case "subject":
      return `/admin/subjects/${id}`;
    case "class":
      return `/admin/classes/${id}`;
    // The section page reads `schoolYearId` from the URL to resolve context.
    case "section":
      return `/admin/sections/${id}?schoolYearId=${schoolYearId}`;
    // No per-level page exists; levels are managed as a list per school year.
    case "level":
      return `/admin/school-years/${schoolYearId}/levels`;
    default:
      return null;
  }
}

/**
 * Route for a `ref`-style entity. Courses and strands are addressed through
 * their owning program and need `ref.programId`; without it there is no valid
 * URL, so they stay unlinked rather than pointing somewhere wrong.
 */
export function readinessRefTarget(
  ref: NonNullable<ReadinessIssue["ref"]>,
  schoolYearId: string,
): string | null {
  switch (ref.type) {
    case "course":
      return ref.programId
        ? `/admin/programs/${ref.programId}/courses/${ref.id}`
        : null;
    case "strand":
      return ref.programId
        ? `/admin/programs/${ref.programId}/strands/${ref.id}`
        : null;
    default:
      return readinessEntityTarget({ id: ref.id, type: ref.type }, schoolYearId);
  }
}

/**
 * Route for a whole issue line, or `null` when the issue has no single
 * destination. `missing_start_date` is fixed by the Edit dialog on the same
 * page, and `no_programs` has nothing to open, so both stay plain text.
 */
export function readinessTarget(
  issue: Pick<ReadinessIssue, "code" | "ref">,
  schoolYearId: string,
): string | null {
  switch (issue.code) {
    case "missing_start_date":
    case "no_programs":
      return null;
    default:
      return issue.ref ? readinessRefTarget(issue.ref, schoolYearId) : null;
  }
}
