import { GradeEducatorService } from '../educator/grade-educator.service';
import { GradeCoreService } from '../core/grade-core.service';

// Perf Phase 2 equivalence + batching proof.
// Fixture expectations were captured against the PRE-refactor implementation
// (spec written first, run green on old code via stash, then re-run on the
// refactored code with zero expectation changes).

describe('GradeEducatorService.getGradesByClass — batching equivalence', () => {
  let service: GradeEducatorService;

  const cls = {
    id: 'class-1',
    subject_id: 'subj-1',
    school_year_id: 'sy-1',
    educator_id: 'e-1',
    enrollments: [{ student_id: 's-1' }, { student_id: 's-2' }],
  };
  const terms = [
    { id: 't-1', name: 'Term 1', semesterIndex: 1, semesterName: 'Sem 1' },
    { id: 't-2', name: 'Term 2', semesterIndex: 2, semesterName: 'Sem 2' },
  ];
  const scheme = {
    components: [
      { name: 'Quiz', type: 'quiz', weight: 50, max_score: 20 },
      { name: 'Exam', type: 'exam', weight: 50, max_score: 20 },
    ],
  };
  const assessments = [
    {
      id: 'a-1',
      type: 'quiz',
      title: 'Q1',
      total_items: 20,
      grading_mode: 'system',
      created_at: new Date('2026-01-01'),
    },
    {
      id: 'a-2',
      type: 'exam',
      title: 'E1',
      total_items: 20,
      grading_mode: 'system',
      created_at: new Date('2026-01-01'),
    },
  ];
  const sub = (
    student_id: string,
    assessment_id: string,
    score: number,
  ): Record<string, unknown> => ({
    id: `sub-${student_id}-${assessment_id}`,
    student_id,
    assessment_id,
    status: 'graded',
    score,
    manual_score: null,
    system_section_score: null,
    manual_section_score: null,
    is_missed: false,
    is_exempted: false,
    assessment: { type: assessment_id === 'a-1' ? 'quiz' : 'exam' },
  });

  const repo = {
    db: {
      class: {
        findFirst: jest.fn().mockResolvedValue({ educator_id: 'e-1' }),
      },
    },
    findClassWithSubject: jest.fn().mockResolvedValue(cls),
    findTemplateTermsByClass: jest.fn().mockResolvedValue(terms),
    findGradingSchemeForClass: jest.fn().mockResolvedValue(scheme),
    findSubmissionsForTerm: jest
      .fn()
      .mockImplementation(async (_c: string, termId: string) =>
        termId === 't-1'
          ? [sub('s-1', 'a-1', 10), sub('s-1', 'a-2', 15), sub('s-2', 'a-1', 20)]
          : [sub('s-1', 'a-1', 20), sub('s-2', 'a-2', 10)],
      ),
    findByClassAndTerm: jest.fn().mockImplementation(async () => []),
    findManualScores: jest.fn().mockResolvedValue([]),
    findAssessmentsForTerm: jest.fn().mockResolvedValue(assessments),
    findEnrollmentDatesByClass: jest
      .fn()
      .mockResolvedValue([
        { student_id: 's-1', created_at: new Date('2025-01-01') },
        { student_id: 's-2', created_at: new Date('2025-01-01') },
      ]),
    findGradingOverridesByClass: jest.fn().mockResolvedValue([]),
    findStudentProfiles: jest.fn().mockResolvedValue(
      new Map([
        ['s-1', { name: 'Alice', code: 'STU1' }],
        ['s-2', { name: 'Bob', code: 'STU2' }],
      ]),
    ),
  };
  const auditLog = { logActivityEvent: jest.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    jest.clearAllMocks();
    repo.db.class.findFirst.mockResolvedValue({ educator_id: 'e-1' });
    repo.findClassWithSubject.mockResolvedValue(cls);
    repo.findTemplateTermsByClass.mockResolvedValue(terms);
    repo.findGradingSchemeForClass.mockResolvedValue(scheme);
    repo.findStudentProfiles.mockResolvedValue(
      new Map([
        ['s-1', { name: 'Alice', code: 'STU1' }],
        ['s-2', { name: 'Bob', code: 'STU2' }],
      ]),
    );
    service = new GradeEducatorService(
      repo as any,
      new GradeCoreService(),
      auditLog as any,
    );
  });

  it('returns one result per term in template order with identical student rows', async () => {
    const results = await service.getGradesByClass('class-1', 'org-1', 'e-1');

    expect(results.map((r: any) => r.termId)).toEqual(['t-1', 't-2']);
    expect(results[0].students.map((s: any) => s.studentId)).toEqual([
      's-1',
      's-2',
    ]);
    expect(results[0].students[0].studentName).toBe('Alice');

    // s-1 t-1: quiz 10/20=50, exam 15/20=75 (maxScore categories)
    const s1 = results[0].students[0];
    const quiz = s1.categoryBreakdown.find((c: any) => c.type === 'quiz');
    const exam = s1.categoryBreakdown.find((c: any) => c.type === 'exam');
    expect(quiz.rawAverage).toBe(50);
    expect(exam.rawAverage).toBe(75);

    // s-2 t-1 submitted only a-1 → a-2 appears as not_started
    const s2 = results[0].students[1];
    const missing = s2.assessmentScores.find(
      (a: any) => a.assessmentId === 'a-2',
    );
    expect(missing.status).toBe('not_started');
    expect(missing.submissionId).toBeNull();
  });

  it('fetches class-level invariants ONCE for all terms (not per term)', async () => {
    await service.getGradesByClass('class-1', 'org-1', 'e-1');

    expect(repo.findGradingSchemeForClass).toHaveBeenCalledTimes(1);
    expect(repo.findEnrollmentDatesByClass).toHaveBeenCalledTimes(1);
    expect(repo.findGradingOverridesByClass).toHaveBeenCalledTimes(1);
    expect(repo.findStudentProfiles).toHaveBeenCalledTimes(1);

    // Term-level fetches still happen once per term (2 terms), in parallel.
    expect(repo.findSubmissionsForTerm).toHaveBeenCalledTimes(2);
    expect(repo.findByClassAndTerm).toHaveBeenCalledTimes(2);
    expect(repo.findManualScores).toHaveBeenCalledTimes(2);
    expect(repo.findAssessmentsForTerm).toHaveBeenCalledTimes(2);
  });
});
