import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssessmentStudentService } from '../student/assessment-student.service';

describe('AssessmentStudentService (High-Value Tests)', () => {
  let service: AssessmentStudentService;

  const core = {
    findAssessmentsByClass: jest.fn(),
    findAssessmentOrThrow: jest.fn(),
    buildAssessmentListItem: jest.fn((a, s) => ({
      id: a.id,
      status: s?.status ?? 'not_started',
    })),
    getQuestions: jest.fn(),
    getSubmissionByStudent: jest.fn(),
    buildAssessmentDetail: jest.fn(),
    buildResult: jest.fn(),
    isReleased: jest.fn(),
    assertBelongsToClass: jest.fn(),
  };

  const db = {
    submission: {
      findMany: jest.fn(),
    },
    submissionAnswer: {
      findMany: jest.fn(),
    },
  };

  const enrollmentRepo = {
    findOneByStudentAndClass: jest.fn(),
  };

  const gradeRepo = {
    findByStudent: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AssessmentStudentService(
      core as any,
      db as any,
      enrollmentRepo as any,
      gradeRepo as any,
    );
  });

  it('blocks access when student is not enrolled', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue(null);

    await expect(
      service.getAssessments('class-1', 'org-1', 'student-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows access when student is enrolled', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({
      id: 'enroll-1',
    });

    core.findAssessmentsByClass.mockResolvedValue([]);

    const result = await service.getAssessments(
      'class-1',
      'org-1',
      'student-1',
    );

    expect(result).toEqual([]);
  });

  it('marks assessment as open when reopened window is active', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({
      id: 'enroll-1',
    });

    const future = new Date(Date.now() + 60_000);

    core.findAssessmentsByClass.mockResolvedValue([{ id: 'a1' }]);

    db.submission.findMany.mockResolvedValue([
      {
        assessment_id: 'a1',
        status: 'submitted',
        reopened_until: future,
      },
    ]);

    const result = await service.getAssessments(
      'class-1',
      'org-1',
      'student-1',
    );

    expect(result[0].status).toBe('open');
    expect(result[0].reopenedUntil).toBe(future.toISOString());
  });

  it('does NOT override status when reopen expired', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({
      id: 'enroll-1',
    });

    const past = new Date(Date.now() - 60_000);

    core.findAssessmentsByClass.mockResolvedValue([{ id: 'a1' }]);

    db.submission.findMany.mockResolvedValue([
      {
        assessment_id: 'a1',
        status: 'submitted',
        reopened_until: past,
      },
    ]);

    const result = await service.getAssessments(
      'class-1',
      'org-1',
      'student-1',
    );

    expect(result[0].status).not.toBe('open');
  });

  it('hides questions when assessment not released', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({
      id: 'enroll-1',
    });

    core.findAssessmentOrThrow.mockResolvedValue({
      id: 'a1',
      class_id: 'class-1',
    });

    core.isReleased.mockReturnValue(false);

    core.buildAssessmentDetail.mockReturnValue({
      locked: true,
    });

    const result = await service.getAssessmentDetail(
      'class-1',
      'a1',
      'org-1',
      'student-1',
    );

    expect(result.locked).toBe(true);
    expect(core.getQuestions).not.toHaveBeenCalled();
  });

  it('loads questions when assessment is released', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({
      id: 'enroll-1',
    });

    core.findAssessmentOrThrow.mockResolvedValue({
      id: 'a1',
      class_id: 'class-1',
    });

    core.isReleased.mockReturnValue(true);

    core.getQuestions.mockResolvedValue([{ id: 'q1' }]);

    core.buildAssessmentDetail.mockReturnValue({
      locked: false,
    });

    const result = await service.getAssessmentDetail(
      'class-1',
      'a1',
      'org-1',
      'student-1',
    );

    expect(result.locked).toBe(false);
    expect(core.getQuestions).toHaveBeenCalled();
  });

  it('throws when submission does not exist', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({
      id: 'enroll-1',
    });

    core.findAssessmentOrThrow.mockResolvedValue({
      id: 'a1',
      class_id: 'class-1',
    });

    core.getSubmissionByStudent.mockResolvedValue(null);

    await expect(
      service.getResult('class-1', 'a1', 'org-1', 'student-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('prevents score leakage when grade is locked flag missing', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({
      id: 'enroll-1',
    });

    core.findAssessmentOrThrow.mockResolvedValue({
      id: 'a1',
      class_id: 'class-1',
      term_id: 't1',
    });

    core.getSubmissionByStudent.mockResolvedValue({
      id: 's1',
    });

    gradeRepo.findByStudent.mockResolvedValue(null);

    core.getQuestions.mockResolvedValue([]);
    db.submissionAnswer.findMany.mockResolvedValue([]);

    core.buildResult.mockImplementation((sub, assessment, locked) => ({
      locked,
    }));

    const result = await service.getResult(
      'class-1',
      'a1',
      'org-1',
      'student-1',
    );

    expect(result.locked).toBe(false);
  });

  it('passes correct lock state into result builder', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({
      id: 'enroll-1',
    });

    core.findAssessmentOrThrow.mockResolvedValue({
      id: 'a1',
      class_id: 'class-1',
      term_id: 't1',
    });

    core.getSubmissionByStudent.mockResolvedValue({
      id: 's1',
    });

    gradeRepo.findByStudent.mockResolvedValue({
      is_locked: true,
    });

    core.getQuestions.mockResolvedValue([]);
    db.submissionAnswer.findMany.mockResolvedValue([]);

    core.buildResult.mockImplementation((sub, assessment, locked) => ({
      locked,
    }));

    const result = await service.getResult(
      'class-1',
      'a1',
      'org-1',
      'student-1',
    );

    expect(result.locked).toBe(true);
  });

  it('maps submissions correctly into assessment list', async () => {
    enrollmentRepo.findOneByStudentAndClass.mockResolvedValue({
      id: 'enroll-1',
    });

    core.findAssessmentsByClass.mockResolvedValue([{ id: 'a1' }]);

    db.submission.findMany.mockResolvedValue([
      {
        assessment_id: 'a1',
        status: 'submitted',
      },
    ]);

    const result = await service.getAssessments(
      'class-1',
      'org-1',
      'student-1',
    );

    expect(result[0].status).toBe('submitted');
  });
});
