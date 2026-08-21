import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SubmissionService } from '../submission.service';

describe('SubmissionService', () => {
  let service: SubmissionService;
  let submissionRepo: any;
  let assessmentRepo: any;
  let attendanceService: any;
  let gradeService: any;
  const orgId = 'org-1';
  const assessmentId = 'ass-1';
  const studentId = 'stu-1';

  beforeEach(() => {
    submissionRepo = {
      findByStudent: jest.fn(),
      findById: jest.fn(),
      findAnswers: jest.fn(),
      findQuestionsByAssessment: jest.fn(),
      create: jest.fn(),
      upsertAnswers: jest.fn(),
      gradeAnswers: jest.fn(),
      updateStatus: jest.fn(),
      clearReopenedUntil: jest.fn().mockResolvedValue(undefined),
      closeExpiredDrafts: jest.fn(),
    };
    assessmentRepo = { findById: jest.fn() };
    attendanceService = { markPresentFromSubmission: jest.fn().mockResolvedValue(undefined) };
    gradeService = { recomputeStudentGrade: jest.fn().mockResolvedValue(undefined) };
    service = new SubmissionService(submissionRepo, assessmentRepo, attendanceService, gradeService);
    jest.clearAllMocks();
  });

  function assessment(overrides: any = {}) {
    return {
      id: assessmentId,
      release_date: null,
      end_date: null,
      grading_mode: 'system',
      class_id: 'class-1',
      term_id: 'term-1',
      ...overrides,
    };
  }

  describe('assertAssessmentOpen via startOrResume', () => {
    it('throws NotFound when assessment missing', async () => {
      assessmentRepo.findById.mockResolvedValue(null);
      await expect(service.startOrResume(assessmentId, orgId, studentId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Forbidden when not yet released', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment({ release_date: new Date(Date.now() + 1000000) }));
      await expect(service.startOrResume(assessmentId, orgId, studentId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('throws Forbidden when deadline passed without extension', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment({ end_date: new Date(Date.now() - 1000000) }));
      submissionRepo.findByStudent.mockResolvedValue(null);
      await expect(service.startOrResume(assessmentId, orgId, studentId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('allows when deadline passed but reopened_until valid', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment({ end_date: new Date(Date.now() - 1000000) }));
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', reopened_until: new Date(Date.now() + 1000000) });
      submissionRepo.findAnswers.mockResolvedValue([]);
      // This path is in assertAssessmentOpen for startOrResume -> it returns assessment then finds existing
      // Need to mock findByStudent twice: first for assert, second for existing
      submissionRepo.findByStudent.mockResolvedValueOnce({ id: 'sub-1', reopened_until: new Date(Date.now() + 1000000), status: 'draft' }).mockResolvedValueOnce({ id: 'sub-1', status: 'draft' });
      const res = await service.startOrResume(assessmentId, orgId, studentId);
      expect(res.id).toBe('sub-1');
    });
  });

  describe('startOrResume', () => {
    it('throws when already submitted', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment());
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', status: 'submitted' });
      await expect(service.startOrResume(assessmentId, orgId, studentId)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('resumes draft with answers', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment());
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', status: 'draft' });
      submissionRepo.findAnswers.mockResolvedValue([{ id: 'a-1' }]);
      const res = await service.startOrResume(assessmentId, orgId, studentId);
      expect(res.id).toBe('sub-1');
      expect(res.answers).toHaveLength(1);
    });
    it('creates new draft when no existing', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment());
      submissionRepo.findByStudent.mockResolvedValue(null);
      submissionRepo.create.mockResolvedValue({ id: 'new-sub', status: 'draft' });
      const res = await service.startOrResume(assessmentId, orgId, studentId);
      expect(submissionRepo.create).toHaveBeenCalledWith({ orgId, assessmentId, studentId, status: 'draft' });
      expect(res.answers).toEqual([]);
    });
  });

  describe('saveDraft', () => {
    it('throws NotFound when no active attempt', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment());
      submissionRepo.findByStudent.mockResolvedValue(null);
      await expect(service.saveDraft(assessmentId, orgId, studentId, { answers: [] } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('throws Forbidden when already submitted', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment());
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', status: 'submitted' });
      await expect(service.saveDraft(assessmentId, orgId, studentId, { answers: [] } as any)).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('throws BadRequest when question not in assessment', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment());
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', status: 'draft' });
      submissionRepo.findQuestionsByAssessment.mockResolvedValue([{ id: 'q-1' }]);
      await expect(service.saveDraft(assessmentId, orgId, studentId, { answers: [{ questionId: 'bad', answer: 'x' }] } as any)).rejects.toBeInstanceOf(BadRequestException);
    });
    it('upserts answers', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment());
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', status: 'draft' });
      submissionRepo.findQuestionsByAssessment.mockResolvedValue([{ id: 'q-1' }]);
      submissionRepo.upsertAnswers.mockResolvedValue([{ id: 'a-1' }]);
      const res = await service.saveDraft(assessmentId, orgId, studentId, { answers: [{ questionId: 'q-1', answer: 'hello' }] } as any);
      expect(res.savedAnswers).toBe(1);
      expect(submissionRepo.upsertAnswers).toHaveBeenCalledWith('sub-1', orgId, expect.any(Array));
    });
  });

  describe('finish', () => {
    it('throws NotFound when no attempt', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment());
      submissionRepo.findByStudent.mockResolvedValue(null);
      await expect(service.finish(assessmentId, orgId, studentId, { answers: [] } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('auto-grades system mode and marks score', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment({ grading_mode: 'system' }));
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', status: 'draft', reopened_until: null });
      submissionRepo.findQuestionsByAssessment.mockResolvedValue([
        { id: 'q-1', type: 'multiple_choice', correct_answer: 'A', is_manual: false },
        { id: 'q-2', type: 'essay', correct_answer: '', is_manual: false },
      ]);
      submissionRepo.upsertAnswers.mockResolvedValue([
        { id: 'a-1', question_id: 'q-1', answer: 'a' },
        { id: 'a-2', question_id: 'q-2', answer: 'essay text' },
      ]);
      submissionRepo.gradeAnswers.mockResolvedValue(undefined);
      submissionRepo.updateStatus.mockResolvedValue({ submitted_at: new Date() });
      const res = await service.finish(assessmentId, orgId, studentId, { answers: [{ questionId: 'q-1', answer: 'A' }, { questionId: 'q-2', answer: 'essay' }] } as any);
      expect(submissionRepo.gradeAnswers).toHaveBeenCalled();
      expect(res.score).toBe(1);
      expect(res.essayPending).toBe(true);
      expect(res.totalGraded).toBe(1);
    });
    it('skips grading for manual mode', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment({ grading_mode: 'manual' }));
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', status: 'draft' });
      submissionRepo.findQuestionsByAssessment.mockResolvedValue([{ id: 'q-1', type: 'multiple_choice', correct_answer: 'A', is_manual: false }]);
      submissionRepo.upsertAnswers.mockResolvedValue([{ id: 'a-1', question_id: 'q-1', answer: 'A' }]);
      submissionRepo.updateStatus.mockResolvedValue({ submitted_at: new Date() });
      const res = await service.finish(assessmentId, orgId, studentId, { answers: [{ questionId: 'q-1', answer: 'A' }] } as any);
      expect(submissionRepo.gradeAnswers).not.toHaveBeenCalled();
      expect(res.score).toBeNull();
      expect(res.totalGraded).toBe(0);
    });
    it('hybrid mode sets systemSectionScore', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment({ grading_mode: 'hybrid' }));
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', status: 'draft' });
      submissionRepo.findQuestionsByAssessment.mockResolvedValue([{ id: 'q-1', type: 'multiple_choice', correct_answer: 'A', is_manual: false }]);
      submissionRepo.upsertAnswers.mockResolvedValue([{ id: 'a-1', question_id: 'q-1', answer: 'A' }]);
      submissionRepo.updateStatus.mockResolvedValue({ submitted_at: new Date() });
      const res = await service.finish(assessmentId, orgId, studentId, { answers: [{ questionId: 'q-1', answer: 'A' }] } as any);
      expect(res.score).toBe(1);
      expect(submissionRepo.updateStatus).toHaveBeenCalledWith('sub-1', expect.objectContaining({ score: 1, systemSectionScore: 1 }));
    });
    it('clears reopened_until and fires attendance/grade', async () => {
      assessmentRepo.findById.mockResolvedValue(assessment({ class_id: 'class-1', term_id: 'term-1' }));
      submissionRepo.findByStudent.mockResolvedValue({ id: 'sub-1', status: 'draft', reopened_until: new Date() });
      submissionRepo.findQuestionsByAssessment.mockResolvedValue([]);
      submissionRepo.upsertAnswers.mockResolvedValue([]);
      submissionRepo.updateStatus.mockResolvedValue({ submitted_at: new Date() });
      await service.finish(assessmentId, orgId, studentId, { answers: [] } as any);
      expect(submissionRepo.clearReopenedUntil).toHaveBeenCalledWith('sub-1');
      expect(attendanceService.markPresentFromSubmission).toHaveBeenCalled();
      expect(gradeService.recomputeStudentGrade).toHaveBeenCalledWith('class-1', 'term-1', studentId, orgId);
    });
  });

  describe('getAnswers / closeExpiredDrafts', () => {
    it('getAnswers throws NotFound when mismatch', async () => {
      submissionRepo.findById.mockResolvedValue(null);
      await expect(service.getAnswers(assessmentId, 'sub-1', orgId)).rejects.toBeInstanceOf(NotFoundException);
      submissionRepo.findById.mockResolvedValue({ id: 'sub-1', assessment_id: 'other-ass' });
      await expect(service.getAnswers(assessmentId, 'sub-1', orgId)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('getAnswers merges question', async () => {
      submissionRepo.findById.mockResolvedValue({ id: 'sub-1', assessment_id: assessmentId });
      submissionRepo.findAnswers.mockResolvedValue([{ id: 'a-1', question_id: 'q-1', answer: 'x' }]);
      submissionRepo.findQuestionsByAssessment.mockResolvedValue([{ id: 'q-1', question_text: 'Q?' }]);
      const res = await service.getAnswers(assessmentId, 'sub-1', orgId);
      expect(res[0].question.question_text).toBe('Q?');
    });
    it('closeExpiredDrafts delegates', async () => {
      submissionRepo.closeExpiredDrafts.mockResolvedValue(2);
      expect(await service.closeExpiredDrafts(assessmentId)).toBe(2);
    });
  });
});
