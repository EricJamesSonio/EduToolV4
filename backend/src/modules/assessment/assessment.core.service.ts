// @/modules/assessment/assessment.core.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AssessmentRepository } from './assessment.repository';

@Injectable()
export class AssessmentCoreService {
  constructor(private readonly repo: AssessmentRepository) {}

  // ─────────────────────────────────────────
  // FETCHERS
  // ─────────────────────────────────────────

  async findAssessmentOrThrow(assessmentId: string, orgId: string) {
    const assessment = await this.repo.findById(assessmentId, orgId);
    if (!assessment) throw new NotFoundException('Assessment not found.');
    return assessment;
  }

  async findAssessmentsByClass(
    classId: string,
    orgId: string,
    filters: { termId?: string; type?: string } = {},
  ) {
    return this.repo.findAll(classId, orgId, filters);
  }

  async getQuestions(assessmentId: string) {
    return this.repo.findQuestions(assessmentId);
  }

  async getSubmissionByStudent(assessmentId: string, studentId: string) {
    return this.repo.findSubmissionByStudent(assessmentId, studentId);
  }

  // ─────────────────────────────────────────
  // BUSINESS RULES
  // ─────────────────────────────────────────

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

  canViewScore(params: { assessment: any; isGradeLocked: boolean }): boolean {
    const { assessment, isGradeLocked } = params;
    if (assessment.is_published) return true;
    if (isGradeLocked) return true;
    return false;
  }

  assertBelongsToClass(assessment: any, classId: string) {
    if (assessment.class_id !== classId) {
      throw new ForbiddenException('Invalid class access.');
    }
  }

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

  buildAssessmentDetail(assessment: any, questions: any[] | null, locked: boolean) {
    return {
      id: assessment.id,
      type: assessment.type,
      totalItems: assessment.total_items,
      releaseDate: assessment.release_date,
      endDate: assessment.end_date,
      isPublished: assessment.is_published,
      locked,
      ...(locked ? {} : { questions }),
    };
  }

  buildResult(submission: any, assessment: any, isGradeLocked: boolean) {
    const canView = this.canViewScore({ assessment, isGradeLocked });
    return {
      status: submission.status,
      submittedAt: submission.submitted_at,
      score: canView ? (submission.manual_score ?? submission.score) : null,
      isPublished: assessment.is_published,
    };
  }
}