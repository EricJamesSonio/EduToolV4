// backend/src/modules/grade/core/__TEST__/assessment-inclusion.util.spec.ts
// Pure unit tests for the late-enrollment inclusion/exclusion decision function.
import { resolveAssessmentInclusion } from '../assessment-inclusion.util';

describe('resolveAssessmentInclusion', () => {
  const NOW = new Date('2026-08-01T00:00:00Z');

  it('assessment before enrollment, no override → excluded, default_excluded', () => {
    expect(
      resolveAssessmentInclusion({
        assessmentEffectiveDate: new Date('2026-07-01T00:00:00Z'),
        enrollmentDate: NOW,
      }),
    ).toEqual({ included: false, reason: 'default_excluded' });
  });

  it('assessment before enrollment with override include:true → included, override_included', () => {
    expect(
      resolveAssessmentInclusion({
        assessmentEffectiveDate: new Date('2026-07-01T00:00:00Z'),
        enrollmentDate: NOW,
        override: { include: true },
      }),
    ).toEqual({ included: true, reason: 'override_included' });
  });

  it('assessment after enrollment, no override → included, included', () => {
    expect(
      resolveAssessmentInclusion({
        assessmentEffectiveDate: new Date('2026-08-10T00:00:00Z'),
        enrollmentDate: NOW,
      }),
    ).toEqual({ included: true, reason: 'included' });
  });

  it('assessment after enrollment with override include:false → excluded, override_excluded', () => {
    expect(
      resolveAssessmentInclusion({
        assessmentEffectiveDate: new Date('2026-08-10T00:00:00Z'),
        enrollmentDate: NOW,
        override: { include: false },
      }),
    ).toEqual({ included: false, reason: 'override_excluded' });
  });

  it('null release_date falls back to created_at as the effective date', () => {
    // created_at before enrollment → excluded like a released-before case.
    expect(
      resolveAssessmentInclusion({
        assessmentEffectiveDate: new Date('2026-07-01T00:00:00Z'),
        enrollmentDate: NOW,
        override: null,
      }),
    ).toEqual({ included: false, reason: 'default_excluded' });

    // created_at after enrollment → included.
    expect(
      resolveAssessmentInclusion({
        assessmentEffectiveDate: new Date('2026-08-10T00:00:00Z'),
        enrollmentDate: NOW,
      }),
    ).toEqual({ included: true, reason: 'included' });
  });

  it('override on a soft-deleted assessment → excluded regardless of include value', () => {
    const deletedAt = new Date('2026-07-20T00:00:00Z');
    expect(
      resolveAssessmentInclusion({
        assessmentEffectiveDate: new Date('2026-06-01T00:00:00Z'),
        enrollmentDate: NOW,
        override: { include: true },
        assessmentDeletedAt: deletedAt,
      }),
    ).toEqual({ included: false, reason: 'default_excluded' });
    expect(
      resolveAssessmentInclusion({
        assessmentEffectiveDate: new Date('2026-06-01T00:00:00Z'),
        enrollmentDate: NOW,
        override: { include: false },
        assessmentDeletedAt: deletedAt,
      }),
    ).toEqual({ included: false, reason: 'default_excluded' });
  });
});