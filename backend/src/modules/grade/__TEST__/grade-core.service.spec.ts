import { GradeCoreService, type GradeRange } from '../core/grade-core.service';

const service = new GradeCoreService();

type Submission = Record<string, any>;
type Assessment = Record<string, any>;
type ManualScore = { category: string; score: number };
type Category = { name: string; type: string; weight: number; maxScore?: number | null };

const completed = (assessment_id: string, score: number): Submission => ({
  assessment_id,
  status: 'completed',
  is_exempted: false,
  is_missed: false,
  score,
  manual_score: null,
  manual_section_score: null,
  system_section_score: null,
  assessment: { grading_mode: 'system' },
});

const exempted = (assessment_id: string): Submission => ({
  ...completed(assessment_id, 0),
  status: 'exempted',
  is_exempted: true,
});

const assessment = (id: string, type: string, total_items: number, grading_mode = 'system'): Assessment => ({
  id,
  type,
  total_items,
  grading_mode,
  manual_max_score: null,
});

describe('GradeCoreService.computeWeightedScore', () => {
  it('happy path: sums weighted category averages into the final score (maxScore categories)', () => {
    const categories: Category[] = [
      { name: 'Quiz', type: 'quiz', weight: 40, maxScore: 50 },
      { name: 'Performance Task', type: 'performance', weight: 60, maxScore: 50 },
    ];
    const allAssessments = [
      assessment('a1', 'quiz', 25),
      assessment('a2', 'quiz', 25),
      assessment('a3', 'performance', 50),
    ];
    const submissions = [completed('a1', 20), completed('a2', 15), completed('a3', 40)];

    // Quiz: (20+15)/50 = 70%  → 70*40
    // Performance: 40/50 = 80%  → 80*60
    expect(service.computeWeightedScore(submissions, [], allAssessments, categories)).toBe(76);
  });

  it('KNOWN BUG R1: a fully-exempted maxScore category must be excluded from the average, not zero-penalized at full weight', () => {
    const categories: Category[] = [
      { name: 'Quiz', type: 'quiz', weight: 50, maxScore: 100 },
      { name: 'Performance Task', type: 'performance', weight: 50, maxScore: 100 },
    ];
    const allAssessments = [assessment('a1', 'quiz', 50), assessment('a2', 'performance', 100)];
    const submissions = [exempted('a1'), completed('a2', 80)];

    // Performance: 80/100 = 80% at weight 50. The exempted quiz must not
    // contribute its 50% weight as a hard 0.
    // Current code: (0/100)*100 = 0 → final (0*50 + 80*50)/100 = 40.
    expect(service.computeWeightedScore(submissions, [], allAssessments, categories)).toBe(80);
  });

  it('KNOWN BUG R2: a missing submission must be treated identically with and without maxScore (counted as 0, never ignored)', () => {
    const assessments = [assessment('a1', 'quiz', 100), assessment('a2', 'quiz', 20)];
    const submissions = [completed('a1', 100)]; // a2 has NO submission at all

    const withoutMaxScore: Category[] = [{ name: 'Quiz', type: 'quiz', weight: 100 }];
    const withMaxScore: Category[] = [{ name: 'Quiz', type: 'quiz', weight: 100, maxScore: 120 }];

    // Non-maxScore branch counts the missing item as 0: (100 + 0)/2 = 50.
    expect(service.computeWeightedScore(submissions, [], assessments, withoutMaxScore)).toBe(50);
    // The maxScore branch must produce the same result for the same underlying
    // performance — the missing submission is not optional work.
    // Current code: ignores the missing item → (100/120)*100 = 83.33.
    expect(service.computeWeightedScore(submissions, [], assessments, withMaxScore)).toBe(50);
  });

  it('renormalizes when a manual category has no score (drops its weight instead of zeroing it)', () => {
    const categories: Category[] = [
      { name: 'Attendance', type: 'manual', weight: 40 },
      { name: 'Recitation', type: 'recitation', weight: 60 },
    ];
    const allAssessments = [assessment('a1', 'recitation', 10)];
    const submissions = [completed('a1', 8)];

    // Attendance manual category has no ManualScore → weight 40 dropped,
    // recitation 8/10 = 80% renormalized to 100% of the effective weight.
    expect(service.computeWeightedScore(submissions, [], allAssessments, categories)).toBe(80);
  });

  it('KNOWN BUG R3: a hybrid score that exceeds the assessment total must never push the final score past 100', () => {
    const categories: Category[] = [{ name: 'Exam', type: 'exam', weight: 100 }];
    const allAssessments = [assessment('exam-1', 'exam', 40, 'hybrid')];
    const submissions: Submission[] = [
      {
        assessment_id: 'exam-1',
        status: 'completed',
        is_exempted: false,
        is_missed: false,
        score: null,
        manual_score: null,
        manual_section_score: 40,
        system_section_score: 40,
        assessment: { grading_mode: 'hybrid' },
      },
    ];

    // 40/40 system + 40/40 manual = 200% on a 40-item exam. The merged score
    // must be bounded at 100% so the weighted average cannot exceed 100.
    // Current code: returns 200.
    expect(service.computeWeightedScore(submissions, [], allAssessments, categories)).toBe(100);
  });

  it('manual category contributes via case-insensitive category-name match', () => {
    const categories: Category[] = [
      { name: 'Attendance', type: 'manual', weight: 40 },
      { name: 'Recitation', type: 'recitation', weight: 60 },
    ];
    const allAssessments = [assessment('a1', 'recitation', 10)];
    const submissions = [completed('a1', 8)];
    const manualScores: ManualScore[] = [{ category: 'attendance', score: 90 }];

    // Attendance: 90*40 = 3600, Recitation: 80*60 = 4800 → (3600+4800)/100 = 84.
    expect(service.computeWeightedScore(submissions, manualScores, allAssessments, categories)).toBe(84);
  });

  it.each([
    [[], 'no categories decompose to zero weight'],
    [[{ name: 'Quiz', type: 'quiz', weight: 100, maxScore: 50 }], 'no assessments of a matched type'],
  ] as [Category[], string][])('invalid/empty input: returns 0 when %s', (categories) => {
    expect(service.computeWeightedScore([], [], [], categories)).toBe(0);
  });

  it('partial exemption: exempted assessments are excluded from the average — same result with and without maxScore', () => {
    const allAssessments = [assessment('a1', 'quiz', 10), assessment('a2', 'quiz', 10)];
    const submissions = [exempted('a1'), completed('a2', 8)];

    // a2 = 8/10 = 80%; the exempted a1 must NOT count as 0 (would give
    // (0+80)/2 = 40) — exemption excludes it from the denominator.
    const plain: Category[] = [{ name: 'Quiz', type: 'quiz', weight: 100 }];
    const withMaxScore: Category[] = [{ name: 'Quiz', type: 'quiz', weight: 100, maxScore: 100 }];
    expect(service.computeWeightedScore(submissions, [], allAssessments, plain)).toBe(80);
    expect(service.computeWeightedScore(submissions, [], allAssessments, withMaxScore)).toBe(80);
  });

  it('mixed exemption + missing: a missing assessment counts as 0 but an exempted one never dilutes or vanishes', () => {
    const allAssessments = [
      assessment('a1', 'quiz', 10), // NO submission → missing → 0
      assessment('a2', 'quiz', 10), // exempted → excluded entirely
      assessment('a3', 'quiz', 10), // 5/10 → 50
    ];
    const submissions = [exempted('a2'), completed('a3', 5)];
    const categories: Category[] = [{ name: 'Quiz', type: 'quiz', weight: 100 }];

    // (0 + 50)/2 = 25. If the exempted item diluted the denominator this
    // would be /3, and if the missing item vanished this would be 50.
    expect(service.computeWeightedScore(submissions, [], allAssessments, categories)).toBe(25);
  });

  it('regression lock for R3: capped categories cannot be recombined to exceed 100', () => {
    const categories: Category[] = [
      { name: 'Quiz', type: 'quiz', weight: 50 },
      { name: 'Exam', type: 'exam', weight: 50 },
    ];
    const allAssessments = [assessment('a1', 'quiz', 20, 'hybrid'), assessment('a2', 'exam', 20, 'hybrid')];
    const overflowSub = (id: string): Submission => ({
      assessment_id: id,
      status: 'completed',
      is_exempted: false,
      is_missed: false,
      score: null,
      manual_score: null,
      manual_section_score: 20,
      system_section_score: 20,
      assessment: { grading_mode: 'hybrid' },
    });

    // Each category caps at 100 (40 raw / 20 total = 200% → 100%), so the
    // weighted sum can never exceed 100 regardless of weight split.
    expect(
      service.computeWeightedScore([overflowSub('a1'), overflowSub('a2')], [], allAssessments, categories),
    ).toBe(100);
  });
});

describe('GradeCoreService.mergeHybridScores', () => {
  it.each([
    [
      {
        assessment: { grading_mode: 'hybrid' },
        system_section_score: 22,
        manual_section_score: 18,
        manual_score: 0,
        score: 0,
      },
      40,
      'hybrid via assessment.grading_mode',
    ],
    [
      { manual_section_score: 30, system_section_score: 20 },
      50,
      'hybrid via a non-null manual_section_score (legacy data)',
    ],
    [{ manual_score: 35, score: 20 }, 35, 'prefers manual_score over score'],
    [{ manual_score: null, score: 20 }, 20, 'falls back to score when manual_score is null'],
    [{ manual_score: undefined, score: undefined }, 0, 'falls back to 0 when both are absent'],
  ] as [Submission, number, string][])('returns exact raw sum/fallback: %s', (submission, expected) => {
    expect(service.mergeHybridScores(submission)).toBe(expected);
  });

  it('hybrid 40 (system) + 40 (manual) merges to an unclamped raw 80 — clamping must live at the score layer', () => {
    const sub: Submission = {
      assessment: { grading_mode: 'hybrid' },
      system_section_score: 40,
      manual_section_score: 40,
    };
    expect(service.mergeHybridScores(sub)).toBe(80);
  });
});

describe('GradeCoreService.resolveGrade', () => {
  const RANGES: GradeRange[] = [
    { minPercent: 60, maxPercent: 74, gradeValue: 'C', remark: 'Fair', isPassing: true },
    { minPercent: 75, maxPercent: 79, gradeValue: 'B', remark: 'Good', isPassing: true },
    { minPercent: 80, maxPercent: 84, gradeValue: 'B+', remark: 'Very Good', isPassing: true },
    { minPercent: 85, maxPercent: 89, gradeValue: 'A', remark: 'Excellent', isPassing: true },
  ];

  it.each([
    [74, 'C'],
    [75, 'B'],
    [79, 'B'],
    [80, 'B+'],
    [85, 'A'],
    [89, 'A'],
  ] as [number, string][])('maps in-range and exact-boundary score %i to %s', (score, expected) => {
    expect(service.resolveGrade(score, RANGES)).toBe(expected);
  });

  it('KNOWN BUG R4: a fractional score at a range boundary must still resolve (not fall to N/A)', () => {
    // Ranges are validated as contiguous integers (75–79, 80–84, …), but
    // finalScore is a float — 79.95 satisfies neither band. Rounding to the
    // nearest integer band gives 80 → 'B+'.
    // Current code: returns 'N/A'.
    expect(service.resolveGrade(79.95, RANGES)).toBe('B+');
  });

  it.each([
    [79.49, 'B'],
    [79.5, 'B+'],
    [79.99, 'B+'],
    [74.49, 'C'],
    [74.5, 'B'],
    [84.49, 'B+'],
    [84.5, 'A'],
  ] as [number, string][])('round-half-up fractional boundary %f resolves to %s (never N/A inside the scale)', (score, expected) => {
    expect(service.resolveGrade(score, RANGES)).toBe(expected);
  });

  it('a score at or near 100 maps to the top band when the scale reaches 100 (perfect scores are never N/A)', () => {
    const FULL_RANGES: GradeRange[] = [
      ...RANGES,
      { minPercent: 90, maxPercent: 100, gradeValue: 'A+', remark: 'Outstanding', isPassing: true },
    ];
    expect(service.resolveGrade(100, FULL_RANGES)).toBe('A+');
    expect(service.resolveGrade(99.6, FULL_RANGES)).toBe('A+');
  });

  it.each([[-1], [50], [95], [200]] as [number][])('returns N/A for out-of-range score %i', (score) => {
    expect(service.resolveGrade(score, RANGES)).toBe('N/A');
  });

  it('returns N/A when no ranges are provided (a misconfigured scale is silent, not an error)', () => {
    expect(service.resolveGrade(80, [])).toBe('N/A');
  });
});