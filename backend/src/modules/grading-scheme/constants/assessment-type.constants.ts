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
