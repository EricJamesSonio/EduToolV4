// @/modules/assessment/core/assessment-core.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AssessmentRepository } from './assessment-core.repository';

@Injectable()
export class AssessmentCoreService {
  constructor(private readonly repo: AssessmentRepository) {}

  // ───────── FETCHERS ─────────

  async findAssessmentOrThrow(assessmentId: string, orgId: string) {
    const assessment = await this.repo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');
    return assessment;
  }

  async findAssessmentsByClass(classId: string, orgId: string, filters: { termId?: string; type?: string } = {}) {
    return this.repo.findAll(classId, orgId, filters);
  }

  async getQuestions(assessmentId: string) {
    return this.repo.findQuestions(assessmentId);
  }

  async getSubmissionByStudent(assessmentId: string, studentId: string) {
    return this.repo.findSubmissionByStudent(assessmentId, studentId);
  }

  // ───────── BUSINESS RULES ─────────

  isReleased(assessment: any): boolean {
    if (!assessment.release_date) return true;
    return new Date() >= new Date(assessment.release_date);
  }

  isEditable(assessment: any): boolean {
    if (!assessment.release_date) return true;
    return new Date() < new Date(assessment.release_date);
  }

  isPastEndDate(assessment: any): boolean {
    if (!assessment.end_date) return false;
    return new Date() > new Date(assessment.end_date);
  }

  canViewScore(assessment: any, isGradeLocked: boolean): boolean {
    return assessment.is_published || isGradeLocked;
  }

  assertBelongsToClass(assessment: any, classId: string) {
    if (assessment.class_id !== classId) throw new ForbiddenException('Invalid class access.');
  }

  // ───────── BUILDERS ─────────

  buildAssessmentListItem(assessment: any, submission: any | null) {
    return {
      id: assessment.id,
      type: assessment.type,
      totalItems: assessment.total_items,
      releaseDate: assessment.release_date,
      endDate: assessment.end_date,
      isPublished: assessment.is_published,
      submissionStatus: submission?.status ?? 'not_started',
      submittedAt: submission?.submitted_at ?? null,
    };
  }

  private mapQuestion(raw: any) {
    return {
      id: raw.id,
      questionText: raw.question_text,
      type: raw.type,
      choices: raw.choices,
      order: raw.order,
    };
  }

  private mapQuestionWithAnswer(raw: any, studentAnswer: string | null) {
    return {
      id: raw.id,
      questionText: raw.question_text,
      type: raw.type,
      correctAnswer: raw.correct_answer,
      choices: raw.choices,
      order: raw.order,
      studentAnswer,
    };
  }

  buildAssessmentDetail(assessment: any, questions: any[] | null, locked: boolean) {
    return {
      id: assessment.id,
      type: assessment.type,
      totalItems: assessment.total_items,
      releaseDate: assessment.release_date,
      endDate: assessment.end_date,
      isPublished: assessment.is_published,
      locked,
      ...(locked ? {} : { questions: questions?.map((q) => this.mapQuestion(q)) }),
    };
  }

  buildResult(submission: any, assessment: any, isGradeLocked: boolean, questions: any[] = [], answers: any[] = []) {
    const canView = this.canViewScore(assessment, isGradeLocked);
    const answerMap = new Map(answers.map((a: any) => [a.question_id, a]));

    const review = canView
      ? questions.map((q: any) => {
          const ans = answerMap.get(q.id);
          return {
            id: q.id,
            questionText: q.question_text,
            type: q.type,
            correctAnswer: q.correct_answer,
            choices: q.choices,
            order: q.order,
            studentAnswer: ans?.answer ?? null,
            isCorrect: ans?.is_correct ?? null,
          };
        })
      : undefined;

    return {
      status: submission.status,
      submittedAt: submission.submitted_at,
      score: canView
        ? (submission.manual_score ?? submission.score)
        : null,
      isPublished: assessment.is_published,
      totalItems: assessment.total_items,
      questions: review,
    };
  }
}