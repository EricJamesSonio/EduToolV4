/**
 * Generator readiness issues route to the page that fixes them, mirroring
 * `readinessTargets.ts` (school-year readiness). Same contract: every route
 * returned here is an existing admin page; anything unresolvable returns
 * `null` and renders as plain text.
 */

import type {
  GeneratorReadinessEntity,
  GeneratorReadinessIssue,
} from "@/types/admin/class-generator.types";

/**
 * Route for one entity, by kind. `schoolYearId` scopes the section page,
 * which reads it from the URL.
 */
export function generatorEntityTarget(
  entity: Pick<GeneratorReadinessEntity, "id" | "type">,
  schoolYearId: string,
): string | null {
  const { id, type } = entity;
  switch (type) {
    case "educator":
      return `/admin/educators/${id}`;
    case "subject":
      return `/admin/subjects/${id}`;
    case "program":
      return `/admin/programs/${id}`;
    case "section":
      return `/admin/sections/${id}?schoolYearId=${schoolYearId}`;
    default:
      return null;
  }
}

/**
 * Route for a whole issue line. Issues without a single destination (e.g.
 * empty scope, aggregate warnings) return `null` and their entity chips
 * carry the links instead.
 */
export function generatorIssueTarget(
  issue: Pick<GeneratorReadinessIssue, "code" | "ref">,
  schoolYearId: string,
): string | null {
  switch (issue.code) {
    // Fixed on the school schedule tab, not on any listed entity.
    case "no_active_weekdays":
      return "/admin/organization/schedule";
    default:
      if (!issue.ref) return null;
      return generatorEntityTarget(
        { id: issue.ref.id, type: issue.ref.type },
        schoolYearId,
      );
  }
}
