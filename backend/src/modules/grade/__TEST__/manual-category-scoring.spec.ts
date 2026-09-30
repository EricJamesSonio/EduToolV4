import { GradeCoreService, isManualScoredCategory, manualCategoryMax } from '../core/grade-core.service';
import { MANUAL_ONLY_TYPES } from '@/modules/grading-scheme/constants/assessment-type.constants';

// TICK-GRADE-005. The reported bug was that Behavior/Participation cells on the
// Grades page could never be edited, and that a saved score for them would be
// ignored by the grade engine. Both trace to `type === 'manual'` being the only
// manual marker while schemes persist `type='behavior'`.
//
// These are regression tests on the authoritative grade math, because the fix
// changes how a category is routed — confidence-gating.md caps confidence at 79
// for grading changes without them.
describe('isManualScoredCategory (TICK-GRADE-005)', () => {
  it.each(['participation', 'behavior', 'attendance', 'performance_task'])(
    'treats "%s" as educator-scored',
    (type) => {
      expect(isManualScoredCategory(type)).toBe(true);
    },
  );

  it.each(['quiz', 'exam', 'assignment', 'written_work', 'activity', 'custom', 'other'])(
    'treats "%s" as assessment-derived',
    (type) => {
      expect(isManualScoredCategory(type)).toBe(false);
    },
  );

  it('still honors the legacy literal "manual" marker', () => {
    // Legacy rows and the frontend data-seeder both emit type:'manual', even
    // though the DTO rejects it (see FOLLOW_UPS.md). Dropping support would
    // silently orphan those categories.
    expect(isManualScoredCategory('manual')).toBe(true);
  });

  it('fails closed for unknown types', () => {
    expect(isManualScoredCategory('nonsense')).toBe(false);
    expect(isManualScoredCategory('')).toBe(false);
  });

  it('every MANUAL_ONLY_TYPES entry is educator-scored (no drift from the enum)', () => {
    for (const t of MANUAL_ONLY_TYPES) {
      expect(isManualScoredCategory(t)).toBe(true);
    }
  });
});

describe('manualCategoryMax (TICK-GRADE-005)', () => {
  it('prefers an explicit maxScore', () => {
    expect(manualCategoryMax({ maxScore: 50, weight: 20 })).toBe(50);
  });

  it('falls back to the category weight when maxScore is absent', () => {
    // Behavior at 20% behaves like "/20" — the educator gets a real ceiling.
    expect(manualCategoryMax({ maxScore: null, weight: 20 })).toBe(20);
  });

  it('treats a zero/negative maxScore as unset', () => {
    expect(manualCategoryMax({ maxScore: 0, weight: 30 })).toBe(30);
  });

  it('returns null when neither is usable, so callers can degrade safely', () => {
    expect(manualCategoryMax({ maxScore: null, weight: 0 })).toBeNull();
  });
});



describe('GradeCoreService manual-scored routing (TICK-GRADE-005)', () => {
  const svc = new GradeCoreService();

  // Mirrors grade-core.service.spec.ts so the fixtures satisfy
  // percentageOfMerge, which reads assessment.total_items / grading_mode.
  const assessment = (id: string, type: string, totalItems: number) => ({
    id,
    type,
    total_items: totalItems,
    grading_mode: 'system',
    manual_max_score: null,
  });
  const submitted = (assessmentId: string, score: number) => ({
    assessment_id: assessmentId,
    status: 'completed',
    is_exempted: false,
    is_missed: false,
    score,
    manual_score: null,
    manual_section_score: null,
    system_section_score: null,
    assessment: { grading_mode: 'system' },
  });

  it('counts a behavior category from its manual score, not from assessments', () => {
    // The core regression: there is NO assessment of type 'behavior' here, so
    // before the fix this category contributed nothing and its weight vanished
    // from the denominator.
    const categories = [
      { name: 'Quizzes', type: 'quiz', weight: 60, maxScore: null },
      { name: 'Behavior', type: 'behavior', weight: 40, maxScore: null },
    ];
    const assessments = [assessment('a1', 'quiz', 10)];
    const submissions = [submitted('a1', 8)]; // 80%
    const manuals = [{ category: 'Behavior', score: 100 }];

    // 80% * 60 + 100% * 40 = 4800 + 4000 = 8800 / 100 = 88
    expect(
      svc.computeWeightedScore(submissions, manuals, assessments, categories),
    ).toBe(88);
  });

  it('drops a manual-scored category with no score so remaining weights renormalize', () => {
    const categories = [
      { name: 'Quizzes', type: 'quiz', weight: 60, maxScore: null },
      { name: 'Behavior', type: 'behavior', weight: 40, maxScore: null },
    ];
    const assessments = [assessment('a1', 'quiz', 10)];
    const submissions = [submitted('a1', 5)]; // 50%

    // No manual score for Behavior -> its weight is excluded, not zeroed.
    expect(
      svc.computeWeightedScore(submissions, [], assessments, categories),
    ).toBe(50);
  });

  it('matches by category name case-insensitively', () => {
    // ManualScore.category is matched lowercased, so casing must not matter.
    const categories = [
      { name: 'Quizzes', type: 'quiz', weight: 50, maxScore: null },
      { name: 'Behavior', type: 'behavior', weight: 50, maxScore: null },
    ];
    const assessments = [assessment('a1', 'quiz', 10)];
    const submissions = [submitted('a1', 10)]; // 100%
    const manuals = [{ category: 'behavior', score: 100 }];

    expect(
      svc.computeWeightedScore(submissions, manuals, assessments, categories),
    ).toBe(100);
  });

  it('still renormalizes for the legacy "manual" type', () => {
    // Pre-existing behavior, must not regress.
    const categories = [
      { name: 'Attendance', type: 'manual', weight: 40, maxScore: null },
      { name: 'Recitation', type: 'recitation', weight: 60, maxScore: null },
    ];
    const assessments = [assessment('a1', 'recitation', 10)];
    const submissions = [submitted('a1', 5)]; // 50%

    expect(
      svc.computeWeightedScore(submissions, [], assessments, categories),
    ).toBe(50);
    // With Attendance scored 100: 100*40 + 50*60 = 4000 + 3000 = 7000/100 = 70
    expect(
      svc.computeWeightedScore(
        submissions,
        [{ category: 'Attendance', score: 100 }],
        assessments,
        categories,
      ),
    ).toBe(70);
  });
});

describe('GradeCoreService.buildCategoryBreakdown flags (TICK-GRADE-005)', () => {
  const svc = new GradeCoreService() as unknown as {
    buildCategoryBreakdown: (
      submissions: unknown[],
      manualScores: unknown[],
      allAssessments: unknown[],
      categories: unknown[],
      totalActiveWeight: number,
    ) => Array<Record<string, unknown>>;
  };

  it('exposes isManualScored and maxScore with no score present', () => {
    // This is what unblocks the UI: the frontend needs these flags to render an
    // editable, capped column BEFORE any score exists.
    const breakdown = svc.buildCategoryBreakdown(
      [],
      [],
      [],
      [
        { name: 'Behavior', type: 'behavior', weight: 20, maxScore: null },
        { name: 'Quizzes', type: 'quiz', weight: 80, maxScore: null },
      ],
      100,
    );
    const behavior = breakdown.find((b) => b.category === 'Behavior')!;

    expect(behavior.isManualScored).toBe(true);
    expect(behavior.maxScore).toBe(20);
    expect(behavior.manualScore).toBeNull();
  });

  it('marks assessment-derived categories as not manual', () => {
    const breakdown = svc.buildCategoryBreakdown(
      [],
      [],
      [],
      [{ name: 'Quizzes', type: 'quiz', weight: 100, maxScore: null }],
      100,
    );
    expect(breakdown[0].isManualScored).toBe(false);
  });

  it('surfaces an explicit maxScore over the weight', () => {
    const breakdown = svc.buildCategoryBreakdown(
      [],
      [],
      [],
      [{ name: 'Behavior', type: 'behavior', weight: 20, maxScore: 25 }],
      100,
    );
    expect(breakdown[0].maxScore).toBe(25);
  });

  it('reports the manual score for a scored manual category', () => {
    const breakdown = svc.buildCategoryBreakdown(
      [],
      [{ category: 'Behavior', score: 18 }],
      [],
      [{ name: 'Behavior', type: 'behavior', weight: 20, maxScore: null }],
      20,
    );
    expect(breakdown[0].manualScore).toBe(18);
    expect(breakdown[0].isAllExempted).toBe(false);
  });
});
