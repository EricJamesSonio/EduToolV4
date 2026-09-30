import type { HierarchyScope } from "@/api/admin/subject-hierarchy.api";
import type { Program } from "@/types/admin/program.types";

/**
 * The subset of a program this rule needs. Structurally satisfied by `Program`,
 * but declared separately so the helper stays trivially unit-testable with a
 * literal object.
 */
export interface ScopeProgram {
  type: string;
  courses?: readonly unknown[] | null;
  strands?: readonly unknown[] | null;
}

/**
 * Whether the current selection is a scope worth fetching subjects for.
 *
 * The bug this replaces: the hook gated only on "a program (or even a bare
 * school year) is selected", and the backend only narrows when `courseId` /
 * `strandId` is present — so School Year + Department rendered every subject in
 * the program across all courses/strands before the admin picked one.
 *
 * The rule mirrors the filter's OWN dropdown conditions (`type === "college"`
 * exposes Course, `type === "shs"` exposes Strand). That is deliberate: a rule
 * based purely on "has courses" would demand a `courseId` for, say, a `custom`
 * program that has courses but shows no Course dropdown — an unreachable
 * selection and therefore a permanently empty screen.
 */
export function isHierarchyScopeReady(
  scope: HierarchyScope,
  program: ScopeProgram | null | undefined,
): boolean {
  // A department is the minimum unit. A bare school year must never load —
  // it would dump every department's subjects at once.
  if (!scope.programId) return false;
  if (!program) return false;

  const hasCourses = (program.courses?.length ?? 0) > 0;
  const hasStrands = (program.strands?.length ?? 0) > 0;

  if (program.type === "college" && hasCourses) return !!scope.courseId;
  if (program.type === "shs" && hasStrands) return !!scope.strandId;

  // No course/strand dimension to narrow by (or one the UI never offers):
  // the department alone is a complete scope.
  return true;
}

/**
 * The next step the admin still has to pick, for the empty-state hint.
 * `null` means the scope is already ready.
 */
export type HierarchyScopePrompt = "course" | "strand" | null;

export function hierarchyScopePrompt(
  scope: HierarchyScope,
  program: ScopeProgram | null | undefined,
): HierarchyScopePrompt {
  if (isHierarchyScopeReady(scope, program)) return null;
  if (!scope.programId || !program) return null;

  const hasCourses = (program.courses?.length ?? 0) > 0;
  const hasStrands = (program.strands?.length ?? 0) > 0;

  if (program.type === "college" && hasCourses) return "course";
  if (program.type === "shs" && hasStrands) return "strand";
  return null;
}

/** Convenience wrapper: resolve a program out of a loaded list by id. */
export function findScopeProgram(
  programs: readonly Program[] | undefined,
  programId: string | undefined,
): Program | null {
  if (!programId || !programs) return null;
  return programs.find((p) => p.id === programId) ?? null;
}