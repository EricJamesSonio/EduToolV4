// src/modules/submission/submission.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SubmissionRepository } from './submission.repository';
import { AssessmentRepository } from '../assessment/assessment.repository';
import { SaveDraftDto, FinishSubmissionDto } from './dto/submission.dto';

@Injectable()
export class SubmissionService {
  constructor(
    private readonly submissionRepo: SubmissionRepository,
    private readonly assessmentRepo: AssessmentRepository,
  ) {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async assertAssessmentOpen(assessmentId: string, orgId: string) {
    const assessment = await this.assessmentRepo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');

    const now = new Date();

    // Must be past release date
    if (!assessment.release_date || now < new Date(assessment.release_date)) {
      throw new ForbiddenException('Assessment has not been released yet.');
    }

    // Must be before end date
    if (assessment.end_date && now > new Date(assessment.end_date)) {
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
    const assessment = await this.assertAssessmentOpen(assessmentId, orgId);

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
    await this.assertAssessmentOpen(assessmentId, orgId);

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
    await this.assertAssessmentOpen(assessmentId, orgId);

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

    // ── Auto-grade non-essay questions ───────────────────────────────────────

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    const gradedAnswers = savedAnswers
      .filter((a) => {
        const q = questionMap.get(a.question_id);
        return q && q.type !== 'essay'; // essays graded manually
      })
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

    // Score = number of correct non-essay answers
    const score = gradedAnswers.filter((a) => a.isCorrect).length;

    // Mark as submitted
    const updated = await this.submissionRepo.updateStatus(submission.id, {
      status: 'submitted',
      score,
      submittedAt: new Date(),
    });

    return {
      submissionId: submission.id,
      score,
      totalGraded: gradedAnswers.length,
      essayPending: savedAnswers.length - gradedAnswers.length > 0,
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