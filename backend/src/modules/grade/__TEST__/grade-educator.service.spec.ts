import { GradeEducatorService } from '../educator/grade-educator.service';
import { GradeCoreService } from '../core/grade-core.service';

describe('GradeEducatorService — proof tests (Lane 1 item 2)', () => {
  let service: GradeEducatorService;

  const repo = {
    findClassWithSubject: jest.fn(),
    findGradingSchemeForClass: jest.fn(),
    findSubmissionsForTerm: jest.fn(),
    findAssessmentsForTerm: jest.fn(),
    findManualScores: jest.fn(),
    findByStudent: jest.fn(),
    upsert: jest.fn(),
    findEnrollmentDatesByClass: jest.fn().mockResolvedValue([]),
    findGradingOverridesByClass: jest.fn().mockResolvedValue([]),
  };

  const auditLog = { logActivityEvent: jest.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GradeEducatorService(repo as any, new GradeCoreService(), auditLog as any);
    jest.spyOn(service as any, 'resolveGradingScale').mockResolvedValue({
      ranges: [
        { minPercent: 75, maxPercent: 100, gradeValue: 'Pass', remark: '', isPassing: true },
        { minPercent: 50, maxPercent: 74, gradeValue: 'Fail', remark: '', isPassing: false },
      ],
    });
  });

  it('PROOF: recomputeStudentGrade overwrites an existing LOCKED grade row (no lock guard)', async () => {
    const cls = {
      id: 'class-1',
      subject_id: 'subj-1',
      school_year_id: 'sy-1',
      educator_id: 'e-1',
      enrollments: [],
    };
    const scheme = {
      components: [
        { name: 'Quiz', type: 'quiz', weight: 50, max_score: 20 },
        { name: 'Exam', type: 'exam', weight: 50, max_score: 20 },
      ],
    };
    const assessments = [
      { id: 'a1', type: 'quiz', total_items: 20 },
      { id: 'a2', type: 'exam', total_items: 20 },
    ];
    const subs = [
      { student_id: 's-1', assessment_id: 'a1', status: 'graded', score: 10, manual_score: 10 },
      { student_id: 's-1', assessment_id: 'a2', status: 'graded', score: 15, manual_score: 15 },
    ];

    repo.findClassWithSubject.mockResolvedValue(cls);
    repo.findGradingSchemeForClass.mockResolvedValue(scheme);
    repo.findSubmissionsForTerm.mockResolvedValue(subs);
    repo.findAssessmentsForTerm.mockResolvedValue(assessments);
    repo.findManualScores.mockResolvedValue([]);

    // The published, LOCKED grade that already exists for this student/class/term.
    repo.findByStudent.mockResolvedValue({
      is_locked: true,
      final_score: 88,
      final_grade: 'Pass',
      locked_at: new Date(),
    });

    await service.recomputeStudentGrade('class-1', 'term-1', 's-1', 'org-1');

    // Correct behavior: before writing, the service must consult the existing
    // row's lock state. It does not — the existing locked row is never read.
    expect(repo.findByStudent).toHaveBeenCalledWith('s-1', 'class-1', 'term-1', 'org-1');
  });

  it('PROOF: recompute upserts a NEW final score into the locked row (88 Pass -> recomputed 62.5 Fail)', async () => {
    const cls = {
      id: 'class-1',
      subject_id: 'subj-1',
      school_year_id: 'sy-1',
      educator_id: 'e-1',
      enrollments: [],
    };
    const scheme = {
      components: [
        { name: 'Quiz', type: 'quiz', weight: 50, max_score: 20 },
        { name: 'Exam', type: 'exam', weight: 50, max_score: 20 },
      ],
    };
    const assessments = [
      { id: 'a1', type: 'quiz', total_items: 20 },
      { id: 'a2', type: 'exam', total_items: 20 },
    ];
    const subs = [
      { student_id: 's-1', assessment_id: 'a1', status: 'graded', score: 10, manual_score: 10 },
      { student_id: 's-1', assessment_id: 'a2', status: 'graded', score: 15, manual_score: 15 },
    ];

    repo.findClassWithSubject.mockResolvedValue(cls);
    repo.findGradingSchemeForClass.mockResolvedValue(scheme);
    repo.findSubmissionsForTerm.mockResolvedValue(subs);
    repo.findAssessmentsForTerm.mockResolvedValue(assessments);
    repo.findManualScores.mockResolvedValue([]);
    repo.findByStudent.mockResolvedValue({ is_locked: true, final_score: 88, final_grade: 'Pass' });

    await service.recomputeStudentGrade('class-1', 'term-1', 's-1', 'org-1');

    // Correct behavior: a locked grade (88 / Pass) must NOT be overwritten.
    // The recompute currently rewrites it to the recomputed 62.5 / Fail.
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});