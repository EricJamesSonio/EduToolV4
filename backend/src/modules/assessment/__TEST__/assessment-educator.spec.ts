import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssessmentEducatorService } from './assessment-educator.service';
import { GradingMode } from '../dto/assessment.dto';

describe('AssessmentEducatorService (High-Value Tests)', () => {
  let service: AssessmentEducatorService;

  const repo = {
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    findQuestionById: jest.fn(),
    softDelete: jest.fn(),
    createQuestions: jest.fn(),
  };

  const core = {
    findAssessmentOrThrow: jest.fn(),
    getQuestions: jest.fn(),
  };

  const db = {
    submission: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    submissionAnswer: {
      groupBy: jest.fn(),
    },
  };

  const classRepo = {
    findById: jest.fn(),
  };

  const auditLog = {
    logActivityEvent: jest.fn(),
  };

  const attendanceService = {
    markPresentFromSubmission: jest.fn(),
  };

  const gradeService = {
    computeGrades: jest.fn(),
    registerAssessmentForAllStudents: jest.fn(),
  };

  const creation = {
    assertTypeMatchesScheme: jest.fn(),
    resolveGradingMode: jest.fn(),
    validateSystemDto: jest.fn(),
    createAssessmentRecord: jest.fn(),
    createManualQuestions: jest.fn(),
    createManualSectionQuestions: jest.fn(),
  };

  const submission = {
    getSubmissions: jest.fn(),
    updateSubmissionStatus: jest.fn(),
    gradeEssay: jest.fn(),
    assignStudents: jest.fn(),
    reopen: jest.fn(),
  };

  const generation = {
    startGeneration: jest.fn(),
    startPreview: jest.fn(),
    getPreview: jest.fn(),
    getPreviewResult: jest.fn(),
    clearPreview: jest.fn(),
    cancelPreview: jest.fn(),
    getGenerationStatus: jest.fn(),
  };

  const logger = { error: jest.fn(), log: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AssessmentEducatorService(
      repo as any,
      core as any,
      db as any,
      classRepo as any,
      auditLog as any,
      attendanceService as any,
      gradeService as any,
      creation as any,
      submission as any,
      generation as any,
    );

    (service as any).logger = logger;
  });

  // ─────────────────────────────────────────────
  // 1. SECURITY: CLASS OWNERSHIP
  // ─────────────────────────────────────────────

  it('blocks access when educator does not own class', async () => {
    core.findAssessmentOrThrow.mockResolvedValue({
      class_id: 'class-1',
    });

    classRepo.findById.mockResolvedValue({
      id: 'class-1',
      educator_id: 'other-educator',
    });

    await expect(
      service.findOne('a1', 'org1', 'educator-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFound when class is missing', async () => {
    core.findAssessmentOrThrow.mockResolvedValue({
      class_id: 'class-1',
    });

    classRepo.findById.mockResolvedValue(null);

    await expect(
      service.findOne('a1', 'org1', 'educator-1'),
    ).rejects.toThrow(NotFoundException);
  });

  // ─────────────────────────────────────────────
  // 2. EDIT LOCK AFTER RELEASE
  // ─────────────────────────────────────────────

  it('prevents editing question after release date', async () => {
    repo.findById.mockResolvedValue({
      id: 'a1',
      class_id: 'c1',
      release_date: new Date(Date.now() - 10000),
    });

    await expect(
      service.updateQuestion(
        'a1',
        'q1',
        'org1',
        'educator-1',
        {} as any,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects question from different assessment', async () => {
    repo.findById.mockResolvedValue({
      id: 'a1',
      class_id: 'c1',
    });

    classRepo.findById.mockResolvedValue({
      educator_id: 'educator-1',
    });

    repo.findQuestionById.mockResolvedValue({
      id: 'q1',
      assessment_id: 'other-assessment',
    });

    await expect(
      service.updateQuestion(
        'a1',
        'q1',
        'org1',
        'educator-1',
        {} as any,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  // ─────────────────────────────────────────────
  // 3. CREATE LOGIC SAFETY
  // ─────────────────────────────────────────────

  it('does NOT trigger AI generation in manual mode', async () => {
    classRepo.findById.mockResolvedValue({
      educator_id: 'educator-1',
    });

    creation.resolveGradingMode.mockReturnValue(
      GradingMode.MANUAL,
    );

    creation.createAssessmentRecord.mockResolvedValue({
      id: 'a1',
    });

    await service.create(
      'class-1',
      'org1',
      'educator-1',
      {} as any,
    );

    expect(generation.startGeneration).not.toHaveBeenCalled();
  });

  it('filters manual questions out of AI generation', async () => {
    classRepo.findById.mockResolvedValue({
      educator_id: 'educator-1',
    });

    creation.resolveGradingMode.mockReturnValue(
      GradingMode.SYSTEM,
    );

    creation.createAssessmentRecord.mockResolvedValue({
      id: 'a1',
    });

    await service.create('class-1', 'org1', 'educator-1', {
      ranges: [
        { questionType: 'essay' },
        { questionType: 'manual' },
        { questionType: 'mcq' },
      ],
    } as any);

    expect(generation.startGeneration).toHaveBeenCalledWith(
      'a1',
      'org1',
      'educator-1',
      expect.objectContaining({
        ranges: [
          { questionType: 'essay' },
          { questionType: 'mcq' },
        ],
      }),
    );
  });

  // ─────────────────────────────────────────────
  // 4. SCORE PUBLISH FLOW SAFETY
  // ─────────────────────────────────────────────

  it('always registers students when publishing scores', async () => {
    core.findAssessmentOrThrow.mockResolvedValue({
      id: 'a1',
      class_id: 'c1',
    });

    classRepo.findById.mockResolvedValue({
      educator_id: 'educator-1',
    });

    await service.publishScores('a1', 'org1', 'educator-1', {
      studentIds: ['s1'],
    } as any);

    expect(
      gradeService.registerAssessmentForAllStudents,
    ).toHaveBeenCalledWith('a1', 'c1', 'org1');
  });

  it('does not fail publish when grade recomputation fails', async () => {
    core.findAssessmentOrThrow.mockResolvedValue({
      id: 'a1',
      class_id: 'c1',
      term_id: 't1',
    });

    classRepo.findById.mockResolvedValue({
      educator_id: 'educator-1',
    });

    gradeService.computeGrades.mockRejectedValue(
      new Error('boom'),
    );

    await expect(
      service.publishScores('a1', 'org1', 'educator-1', {}),
    ).resolves.toEqual({ success: true });
  });

  // ─────────────────────────────────────────────
  // 5. PREVIEW SAFETY
  // ─────────────────────────────────────────────

  it('rejects empty preview results', async () => {
    generation.getPreviewResult.mockReturnValue({
      questions: [],
      dto: { lessonId: 'l1' },
    });

    await expect(
      service.confirmPreview('p1', 'c1', 'org1', 'e1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects preview without lessonId', async () => {
    generation.getPreviewResult.mockReturnValue({
      questions: [{ type: 'essay' }],
      dto: {},
    });

    await expect(
      service.confirmPreview('p1', 'c1', 'org1', 'e1'),
    ).rejects.toThrow(NotFoundException);
  });

  // ─────────────────────────────────────────────
  // 6. AGGREGATION INTEGRITY (DASHBOARD BUG CLASS)
  // ─────────────────────────────────────────────

  it('correctly computes submission and essay counts', async () => {
    classRepo.findById.mockResolvedValue({
      educator_id: 'educator-1',
    });

    repo.findAll.mockResolvedValue([
      { id: 'a1' },
    ]);

    db.submission.groupBy.mockResolvedValue([
      {
        assessment_id: 'a1',
        status: 'submitted',
        _count: { id: 3 },
      },
    ]);

    db.question.findMany.mockResolvedValue([
      { id: 'q1', assessment_id: 'a1' },
    ]);

    db.submission.findMany
      .mockResolvedValueOnce([{ id: 's1', assessment_id: 'a1' }])
      .mockResolvedValueOnce([]);

    db.submissionAnswer.groupBy.mockResolvedValue([
      {
        submission_id: 's1',
        _count: { id: 2 },
      },
    ]);

    const result = await service.findAll(
      'c1',
      'org1',
      'educator-1',
      {},
    );

    expect(result[0].submittedCount).toBe(3);
    expect(result[0].pendingEssayCount).toBe(2);
  });
});