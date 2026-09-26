import { GradeService } from '../grade.service';

// Perf Phase 2: legacy GradeService (serves GET /classes/:classId/grades) —
// same parallel-terms + hoisted scheme/profiles treatment as the educator
// service. Pins output values and per-term/per-class fetch counts.

describe('GradeService.getGradesByClass — batching equivalence', () => {
  const cls = {
    id: 'class-1',
    subject_id: 'subj-1',
    school_year_id: 'sy-1',
    educator_id: 'e-1',
    enrollments: [{ student_id: 's-1' }, { student_id: 's-2' }],
  };
  const terms = [
    { id: 't-1', name: 'Term 1', semesterIndex: 1, semesterName: 'Sem 1' },
  ];
  const scheme = {
    components: [{ name: 'Quiz', type: 'quiz', weight: 100, max_score: 20 }],
  };
  const assessments = [
    {
      id: 'a-1',
      type: 'quiz',
      title: 'Q1',
      total_items: 20,
      created_at: new Date('2026-01-01'),
    },
  ];

  const repo = {
    db: {
      class: {
        findFirst: jest.fn().mockResolvedValue({ educator_id: 'e-1' }),
      },
    },
    findClassWithSubject: jest.fn().mockResolvedValue(cls),
    findTemplateTermsByClass: jest.fn().mockResolvedValue(terms),
    findGradingSchemeForClass: jest.fn().mockResolvedValue(scheme),
    findSubmissionsForTerm: jest.fn().mockResolvedValue([
      {
        student_id: 's-1',
        assessment_id: 'a-1',
        status: 'graded',
        score: 16,
        manual_score: null,
        is_missed: false,
        is_exempted: false,
        assessment: { type: 'quiz', total_items: 20 },
      },
    ]),
    findByClassAndTerm: jest.fn().mockResolvedValue([]),
    findManualScores: jest.fn().mockResolvedValue([]),
    findAssessmentsForTerm: jest.fn().mockResolvedValue(assessments),
    findStudentProfiles: jest.fn().mockResolvedValue(
      new Map([
        ['s-1', { name: 'Alice', code: 'STU1' }],
        ['s-2', { name: 'Bob', code: 'STU2' }],
      ]),
    ),
  };
  const auditLog = { logActivityEvent: jest.fn().mockResolvedValue(undefined) };

  it('keeps per-student rows and computes the same breakdown', async () => {
    const service = new GradeService(repo as any, auditLog as any);
    const results = await service.getGradesByClass('class-1', 'org-1', 'e-1');

    expect(results).toHaveLength(1);
    expect(results[0].students.map((s: any) => s.studentId)).toEqual([
      's-1',
      's-2',
    ]);
    // s-1: 16/20 in a weight-100 quiz category → rawAverage 80
    const s1 = results[0].students[0];
    expect(s1.categoryBreakdown[0].rawAverage).toBe(80);
    // s-2 has no submission → null row score, not_started status
    const s2 = results[0].students[1];
    expect(s2.assessmentScores[0].status).toBe('not_started');
    expect(s2.assessmentScores[0].score).toBeNull();

    // Hoisted: scheme + profiles fetched once for the whole grid.
    expect(repo.findGradingSchemeForClass).toHaveBeenCalledTimes(1);
    expect(repo.findStudentProfiles).toHaveBeenCalledTimes(1);
    expect(repo.findSubmissionsForTerm).toHaveBeenCalledTimes(1);
  });
});
