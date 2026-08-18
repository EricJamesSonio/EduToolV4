// backend/test/support/late-enrollment.types.ts
//
// Types for the late-enrollment e2e suite, derived from the *real*
// service/controller signatures instead of hand-written interfaces or
// `any`. Using ReturnType<>/Parameters<> means these stay correct
// automatically — if the service's shape changes, this file (and every
// test that imports it) fails to compile instead of silently drifting.
//
// Two things are deliberately NOT derived this way:
//  - AssessmentStatusResponse: this crosses an HTTP/JSON boundary, so the
//    wire shape can legitimately differ from the service's internal
//    return type (dates become strings, etc.) — it's typed explicitly.
//  - AccountRole / AssessmentStatusOverrideInput: derived from the
//    Prisma client's own generated input type and the service method's
//    parameter type, so we never have to guess an enum or DTO name/path.

import { v4 as uuidv4 } from 'uuid';
import { GradeEducatorService } from '@/modules/grade/educator/grade-educator.service';
import { DatabaseService } from '@/core/database/database.provider';

/**
 * Explicit `string` return type. If this itself produces an
 * unsafe-assignment warning, the problem is the project's type-aware
 * ESLint resolver / uuid typings, not this file — see PR notes.
 */
export function genId(prefix: string, sliceLength = 8): string {
  const raw: string = uuidv4();
  return `${prefix}-${raw.slice(0, sliceLength)}`;
}

/** Full shape returned by GradeEducatorService.getGradesByTerm(). */
export type TermGrades = Awaited<
  ReturnType<GradeEducatorService['getGradesByTerm']>
>;
export type StudentGrade = TermGrades['students'][number];
export type CategoryBreakdown = StudentGrade['categoryBreakdown'][number];
export type AssessmentScore = StudentGrade['assessmentScores'][number];

/** Pulled from Prisma's generated `account.create` input — no enum name
 * to invent or keep in sync by hand. */
export type AccountRole = Parameters<
  DatabaseService['account']['create']
>[0]['data']['role'];

/** 6th positional arg of setAssessmentStatusOverride — no DTO import path
 * to guess. */
export type AssessmentStatusOverrideInput = Parameters<
  GradeEducatorService['setAssessmentStatusOverride']
>[5];

/** HTTP response shape for GET .../assessments/status. Typed explicitly
 * because it's serialized JSON, not the service's internal return type. */
export interface AssessmentStatusResponse {
  assessmentId: string;
  overrideStatus: string | null;
  countsTowardGrade: boolean;
}
