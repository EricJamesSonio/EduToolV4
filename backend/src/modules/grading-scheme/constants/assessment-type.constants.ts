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
 * Types that are scored directly by the educator rather than produced and
 * auto-graded by an assessment.
 *
 * TICK-GRADE-005: Behavior / Participation / Attendance / Performance Task
 * cannot be judged by a machine, so on the Grades page they are editable cells
 * the educator fills in directly (`ManualScore`) instead of columns derived
 * from assessments. `grade-core.service.ts` routes these through
 * `isManualScoredCategory()`.
 *
 * NOTE: this block is duplicated from TICK-ASSESS-005's
 * `SYSTEM_GRADABLE_TYPES` / `MANUAL_ONLY_TYPES`, which added the same split for
 * the assessment wizard. The two tickets were developed on parallel branches
 * from `development`; the ASSESS branch is rebased onto this one (or this onto
 * that) and the duplicate collapsed into whichever definition lands first. Kept
 * declared here — derived from the enum, with the complement computed — so this
 * branch is self-contained and testable on its own.
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
