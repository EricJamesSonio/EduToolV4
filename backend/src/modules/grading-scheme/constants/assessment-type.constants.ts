// @/modules/grading-scheme/constants/assessment-type.constants.ts
//
// Single source of truth for assessment / grading-scheme component type
// values. `assessment.dto.ts`, `grading-scheme.dto.ts`, and
// `grading-scheme.entity.ts` all import from here instead of redeclaring
// the list — the frontend omission of `assignment` / `participation` /
// `behavior` (TICK-ASSESS-001) was caused by exactly that kind of drift.
//
// `ComponentType` stays an enum (rather than a plain union) because
// `class-validator`'s `@IsEnum` and existing `ComponentType.X` value usages
// (seeders, template DTOs) need a runtime object. `ASSESSMENT_TYPE_VALUES`
// is derived from the enum so the two representations cannot drift; the
// parity is pinned by `__TEST__/assessment-type.constants.spec.ts`.

export enum ComponentType {
  WRITTEN_WORK = 'written_work',
  PERFORMANCE_TASK = 'performance_task',
  QUARTERLY_ASSESSMENT = 'quarterly_assessment',
  EXAM = 'exam',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment',
  PROJECT = 'project',
  RECITATION = 'recitation',
  PARTICIPATION = 'participation',
  BEHAVIOR = 'behavior',
  ATTENDANCE = 'attendance',
  ACTIVITY = 'activity',
  CUSTOM = 'custom',
  OTHER = 'other',
}

export const ASSESSMENT_TYPE_VALUES: readonly string[] =
  Object.values(ComponentType);

export type AssessmentComponentType =
  (typeof ComponentType)[keyof typeof ComponentType];

/**
 * Types the AI can actually auto-grade. The complement, `MANUAL_ONLY_TYPES`, is
 * the set scored directly by the educator.
 *
 * The 14-value enum above answers "which types exist?" but not "which types
 * may be auto-graded?". Without that second answer two bugs followed:
 *
 *  - TICK-ASSESS-005: the wizard offered `behavior` under System-Graded
 *    (`new/page.tsx` + `Step3.tsx`), the AI generated auto-graded questions for
 *    it, and `grade-core.service.ts` averaged the result by weight — a
 *    semantically wrong category silently entering the grade.
 *  - TICK-GRADE-005: on the Grades page the Behavior cell could never be
 *    edited, and a score entered for it would have been ignored. These types
 *    are now editable cells the educator fills in directly (`ManualScore`);
 *    `grade-core.service.ts` routes them via `isManualScoredCategory()`.
 *
 * Manual-only = the things a machine cannot judge:
 *   - `participation`, `behavior` — educator observation, not question/answer
 *   - `attendance`              — fed by the attendance module, not a test
 *   - `performance_task`        — a practical demo is educator-judged
 *
 * Derived from `ComponentType` on purpose: a type added to the enum is
 * automatically *excluded* from system grading until someone deliberately
 * opts it in, so the safe direction is the default. The complement
 * (`MANUAL_ONLY_TYPES`) is computed rather than declared so the two can never
 * disagree. Parity is pinned by `__TEST__/assessment-type.constants.spec.ts`
 * and `__TEST__/assessment-type-gradability.spec.ts`.
 *
 * NOTE: this is orthogonal to the legacy `'manual'` scheme-component marker,
 * which is a category-level flag in the grading engine and NOT part of the
 * canonical enum. See FOLLOW_UPS.md (TICK-ASSESS-001) — deliberately untouched.
 */
export const SYSTEM_GRADABLE_TYPES: readonly AssessmentComponentType[] = [
  ComponentType.WRITTEN_WORK,
  ComponentType.QUARTERLY_ASSESSMENT,
  ComponentType.EXAM,
  ComponentType.QUIZ,
  ComponentType.ASSIGNMENT,
  ComponentType.PROJECT,
  ComponentType.RECITATION,
  ComponentType.ACTIVITY,
  ComponentType.CUSTOM,
  ComponentType.OTHER,
];

/** The complement of `SYSTEM_GRADABLE_TYPES` over the canonical 14. */
export const MANUAL_ONLY_TYPES: readonly AssessmentComponentType[] =
  ASSESSMENT_TYPE_VALUES.filter(
    (t): t is AssessmentComponentType =>
      !SYSTEM_GRADABLE_TYPES.includes(t as AssessmentComponentType),
  ) as AssessmentComponentType[];

/**
 * Whether an assessment type may be auto-graded (system or hybrid).
 *
 * Unknown/legacy strings are treated as NOT system-gradable: failing closed
 * keeps a new or stale type out of the auto-graded path by default, which is
 * the safe direction for authoritative grade data. Callers that want the
 * friendly error message should surface `MANUAL_ONLY_TYPES` to the educator.
 */
export function isSystemGradable(type: string): boolean {
  return SYSTEM_GRADABLE_TYPES.includes(type as AssessmentComponentType);
}
