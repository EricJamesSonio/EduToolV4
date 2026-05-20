// @/modules/submission/submission.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SubmissionRepository } from './submission.repository';
import { AssessmentRepository } from '../assessment/core/assessment-core.repository';
import { AttendanceService } from '../attendance/attendance.service';
import { GradeEducatorService } from '../grade/educator/grade-educator.service';
import { SaveDraftDto, FinishSubmissionDto } from './dto/submission.dto';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly submissionRepo: SubmissionRepository,
    private readonly assessmentRepo: AssessmentRepository,
    private readonly attendanceService: AttendanceService,
    private readonly gradeService: GradeEducatorService,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async assertAssessmentOpen(assessmentId: string, orgId: string, studentId?: string) {
    const assessment = await this.assessmentRepo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    const now = new Date();

    // Must be past release date
    if (!assessment.release_date || now < new Date(assessment.release_date)) {
      throw new ForbiddenException('Assessment has not been released yet.');
    }

    // Check end date — skip if student has a reopened_until extension
    if (assessment.end_date && now > new Date(assessment.end_date)) {
      if (studentId) {
        const submission = await this.submissionRepo.findByStudent(assessmentId, studentId);
        if (submission?.reopened_until && now < new Date(submission.reopened_until)) {
          return assessment; // extension is still valid
        }
      }
      throw new ForbiddenException('Assessment deadline has passed.');
    }

    return assessment;
  }

  // ── START / RESUME attempt ────────────────────────────────────────────────

  async startOrResume(
    assessmentId: string,
    orgId: string,
    studentId: string,
  ) {
    const assessment = await this.assertAssessmentOpen(assessmentId, orgId, studentId);

    // Check existing attempt
    const existing = await this.submissionRepo.findByStudent(
      assessmentId,
      studentId,
    );

    if (existing) {
      if (existing.status === 'submitted') {
        throw new ForbiddenException('You have already submitted this assessment.');
      }
      // Resume draft — return existing with saved answers
      const answers = await this.submissionRepo.findAnswers(existing.id);
      return { ...existing, answers };
    }

    // Create new draft attempt
    const submission = await this.submissionRepo.create({
      orgId,
      assessmentId,
      studentId,
      status: 'draft',
    });

    return { ...submission, answers: [] };
  }

  // ── SAVE DRAFT ────────────────────────────────────────────────────────────

  async saveDraft(
    assessmentId: string,
    orgId: string,
    studentId: string,
    dto: SaveDraftDto,
  ) {
    await this.assertAssessmentOpen(assessmentId, orgId, studentId);

    const submission = await this.submissionRepo.findByStudent(
      assessmentId,
      studentId,
    );

    if (!submission) {
      throw new NotFoundException('No active attempt found. Start the assessment first.');
    }

    if (submission.status === 'submitted') {
      throw new ForbiddenException('Assessment already submitted.');
    }

    // Validate all questionIds belong to this assessment
    const questions = await this.submissionRepo.findQuestionsByAssessment(assessmentId);
    const validIds = new Set(questions.map((q) => q.id));

    for (const answer of dto.answers) {
      if (!validIds.has(answer.questionId)) {
        throw new BadRequestException(
          `Question ${answer.questionId} does not belong to this assessment.`,
        );
      }
    }

    const answers = await this.submissionRepo.upsertAnswers(
      submission.id,
      orgId,
      dto.answers,
    );

    return { submissionId: submission.id, savedAnswers: answers.length };
  }

  // ── FINISH / SUBMIT ───────────────────────────────────────────────────────

  async finish(
    assessmentId: string,
    orgId: string,
    studentId: string,
    dto: FinishSubmissionDto,
  ) {
    const assessment = await this.assertAssessmentOpen(assessmentId, orgId, studentId);

    const submission = await this.submissionRepo.findByStudent(
      assessmentId,
      studentId,
    );

    if (!submission) {
      throw new NotFoundException('No active attempt found. Start the assessment first.');
    }

    if (submission.status === 'submitted') {
      throw new ForbiddenException('Assessment already submitted.');
    }

    // Save final answers
    const questions = await this.submissionRepo.findQuestionsByAssessment(assessmentId);
    const validIds = new Set(questions.map((q) => q.id));

    for (const answer of dto.answers) {
      if (!validIds.has(answer.questionId)) {
        throw new BadRequestException(
          `Question ${answer.questionId} does not belong to this assessment.`,
        );
      }
    }

    const savedAnswers = await this.submissionRepo.upsertAnswers(
      submission.id,
      orgId,
      dto.answers,
    );

    // ── Auto-grade (skip entirely for manual mode) ───────────────────────────

    const isManual = assessment.grading_mode === 'manual';
    const isHybrid = assessment.grading_mode === 'hybrid';

    let gradedAnswers: Array<{ id: string; isCorrect: boolean }> = [];
    let score: number | null = null;
    let systemSectionScore: number | undefined;
    let essayPending = false;

    if (!isManual) {
      const questionMap = new Map(questions.map((q) => [q.id, q]));

      // For hybrid: only auto-grade system (non-manual) questions
      // For system: auto-grade all non-essay questions
      const autoGradable = savedAnswers.filter((a) => {
        const q = questionMap.get(a.question_id);
        if (!q) return false;
        if (q.type === 'essay' || q.type === 'manual') return false;
        if (q.is_manual) return false;
        return true;
      });

      gradedAnswers = autoGradable
        .map((a) => {
          const q = questionMap.get(a.question_id)!;
          return {
            id: a.id,
            isCorrect:
              a.answer.trim().toLowerCase() ===
              (q.correct_answer ?? '').trim().toLowerCase(),
          };
        });

      await this.submissionRepo.gradeAnswers(submission.id, gradedAnswers);

      score = gradedAnswers.filter((a) => a.isCorrect).length;
      systemSectionScore = isHybrid ? score : undefined;
      essayPending = savedAnswers.length - gradedAnswers.length > 0;
    }

    // Mark as submitted — also clear reopened_until so extension is consumed
    const updated = await this.submissionRepo.updateStatus(submission.id, {
      status: 'submitted',
      ...(score !== null ? { score } : {}),
      ...(systemSectionScore !== undefined ? { systemSectionScore } : {}),
      submittedAt: new Date(),
    });

    // Clear reopened_until if it was set
    if (submission.reopened_until) {
      await this.submissionRepo.clearReopenedUntil(submission.id).catch(() => {});
    }

    // ── Fire-and-forget: auto-mark present ───────────────────────────────────
    if (assessment.class_id) {
      this.attendanceService
        .markPresentFromSubmission({
          orgId,
          classId: assessment.class_id,
          studentId,
          submittedAt: updated.submitted_at ?? new Date(),
        })
        .catch(() => {}); // non-blocking, never throws
    }

    // ── Fire-and-forget: auto-recompute grade ─────────────────────────────────
    if (assessment.class_id && assessment.term_id) {
      this.gradeService
        .recomputeStudentGrade(assessment.class_id, assessment.term_id, studentId, orgId)
        .catch((err) =>
          console.error(`[Submission] Grade recompute failed for ${studentId}:`, err),
        );
    }

    return {
      submissionId: submission.id,
      score,
      totalGraded: isManual ? 0 : gradedAnswers.length,
      essayPending,
      submittedAt: updated.submitted_at,
    };
  }

  // ── GET ANSWERS (educator view) ───────────────────────────────────────────

  async getAnswers(
    assessmentId: string,
    submissionId: string,
    orgId: string,
  ) {
    const submission = await this.submissionRepo.findById(submissionId);

    if (!submission || submission.assessment_id !== assessmentId) {
      throw new NotFoundException('Submission not found.');
    }

    const answers = await this.submissionRepo.findAnswers(submissionId);
    const questions = await this.submissionRepo.findQuestionsByAssessment(assessmentId);

    // Merge answers with question text for readability
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    return answers.map((a) => ({
      ...a,
      question: questionMap.get(a.question_id) ?? null,
    }));
  }

  // ── CLOSE EXPIRED DRAFTS ──────────────────────────────────────────────────

  async closeExpiredDrafts(assessmentId: string) {
    return this.submissionRepo.closeExpiredDrafts(assessmentId);
  }
}