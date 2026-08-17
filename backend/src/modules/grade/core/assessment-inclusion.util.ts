// src/modules/grade/core/assessment-inclusion.util.ts
// Pure decision function for the late-enrollment grading exclusion rule.
// Kept separate from grade-core.service so it can be unit-tested without a DB.

export type AssessmentInclusionReason =
  | 'default_excluded'
  | 'override_included'
  | 'override_excluded'
  | 'included';

export interface AssessmentInclusionDecision {
  included: boolean;
  reason: AssessmentInclusionReason;
}

export interface AssessmentInclusionInput {
  // Assessment's effective date: release_date if present, else created_at.
  assessmentEffectiveDate: Date;
  // Student's class-level enrollment date (Enrollment.created_at).
  enrollmentDate?: Date | null;
  // Matching AssessmentGradingOverride row, if any (always org-scoped upstream).
  override?: { include: boolean } | null;
  // Soft-deleted assessments never appear in grading, override or not.
  assessmentDeletedAt?: Date | null;
}

/**
 * Resolve whether an assessment counts toward a given student's grade.
 * Precedence: soft-deleted → absent entirely; override → takes effect
 * regardless of the default rule; otherwise the default date rule.
 * This must stay independent of is_missed/is_exempted handling in the
 * weighted-score computation — it only decides presence, never score.
 */
export function resolveAssessmentInclusion(
  input: AssessmentInclusionInput,
): AssessmentInclusionDecision {
  if (input.assessmentDeletedAt) {
    return { included: false, reason: 'default_excluded' };
  }

  if (input.override) {
    return input.override.include
      ? { included: true, reason: 'override_included' }
      : { included: false, reason: 'override_excluded' };
  }

  if (
    input.assessmentEffectiveDate &&
    input.enrollmentDate &&
    input.assessmentEffectiveDate < input.enrollmentDate
  ) {
    return { included: false, reason: 'default_excluded' };
  }

  return { included: true, reason: 'included' };
}
