import { GradeEducatorService } from '../educator/grade-educator.service';
import { GradeCoreService } from '../core/grade-core.service';

describe('GradeEducatorService — locked recompute skip audit (Lane 1 item 2)', () => {
  let service: GradeEducatorService;

  const repo = {
    findClassWithSubject: jest.fn(),
    findGradingSchemeForClass: jest.fn(),
    findSubmissionsForTerm: jest.fn(),
    findAssessmentsForTerm: jest.fn(),
    findManualScores: jest.fn(),
    findByStudent: jest.fn(),
    upsert: jest.fn(),
    findEnrollmentDatesByClass: jest.fn(),
    findGradingOverridesByClass: jest.fn(),
  };

  const auditLog = { logActivityEvent: jest.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GradeEducatorService(repo as any, new GradeCoreService(), auditLog as any);
  });

  it('PROOF: skipping a locked grade writes a grade_recompute_skipped_locked audit entry with the preserved grade shape', async () => {
    repo.findClassWithSubject.mockResolvedValue({
      id: 'class-1',
      subject_id: 'subj-1',
      school_year_id: 'sy-1',
      educator_id: 'e-1',
      enrollments: [],
    });
    repo.findByStudent.mockResolvedValue({
      is_locked: true,
      final_score: 88,
      final_grade: 'Pass',
      locked_at: new Date(),
    });

    await service.recomputeStudentGrade('class-1', 'term-1', 's-1', 'org-1');

    expect(auditLog.logActivityEvent).toHaveBeenCalledTimes(1);
    expect(auditLog.logActivityEvent).toHaveBeenCalledWith({
      orgId: 'org-1',
      actorId: 'system',
      action: 'grade_recompute_skipped_locked',
      entityType: 'class',
      entityId: 'class-1',
      metadata: {
        termId: 'term-1',
        studentId: 's-1',
        existingFinalScore: 88,
        existingFinalGrade: 'Pass',
      },
    });
    // The locked grade is preserved — nothing is recomputed or overwritten.
    expect(repo.upsert).not.toHaveBeenCalled();
    // The lock short-circuits before the expensive parallel fetch.
    expect(repo.findGradingSchemeForClass).not.toHaveBeenCalled();
    expect(repo.findSubmissionsForTerm).not.toHaveBeenCalled();
    expect(repo.findAssessmentsForTerm).not.toHaveBeenCalled();
  });
});