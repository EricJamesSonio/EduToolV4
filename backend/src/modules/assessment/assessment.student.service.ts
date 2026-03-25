// @/modules/assessment/assessment.student.service.ts

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssessmentCoreService } from './assessment.core.service';
import { ClassRepository } from '../class/class.repository';

@Injectable()
export class AssessmentStudentService {
  constructor(
    private readonly core: AssessmentCoreService,
    private readonly classRepo: ClassRepository,
  ) {}

  // ─────────────────────────────────────────
  // GUARD
  // ─────────────────────────────────────────

  private async assertStudentEnrolled(classId: string, studentId: string, orgId: string) {
    const enrollment = await this.classRepo.findEnrolledClassByStudent(classId, studentId, orgId);
    if (!enrollment) throw new ForbiddenException('Not enrolled in this class.');
    return enrollment;
  }

  // ─────────────────────────────────────────
  // USE CASES
  // ─────────────────────────────────────────

  async getAssessments(classId: string, orgId: string, studentId: string) {
    await this.assertStudentEnrolled(classId, studentId, orgId);

    const assessments = await this.core.findAssessmentsByClass(classId, orgId);

    return Promise.all(
      assessments.map(async (a) => {
        const submission = await this.core.getSubmissionByStudent(a.id, studentId);
        return this.core.buildAssessmentListItem(a, submission);
      }),
    );
  }

  async getAssessmentDetail(
    classId: string,
    assessmentId: string,
    orgId: string,
    studentId: string,
  ) {
    await this.assertStudentEnrolled(classId, studentId, orgId);

    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    this.core.assertBelongsToClass(assessment, classId);

    const released = this.core.isReleased(assessment);

    if (!released) {
      return this.core.buildAssessmentDetail(assessment, null, true);
    }

    const questions = await this.core.getQuestions(assessmentId);
    return this.core.buildAssessmentDetail(assessment, questions, false);
  }

  async getResult(
    classId: string,
    assessmentId: string,
    orgId: string,
    studentId: string,
  ) {
    await this.assertStudentEnrolled(classId, studentId, orgId);

    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    this.core.assertBelongsToClass(assessment, classId);

    const submission = await this.core.getSubmissionByStudent(assessmentId, studentId);
    if (!submission) throw new NotFoundException('No submission found.');

    // TODO: wire in real GradeLock check when that module is ready
    return this.core.buildResult(submission, assessment, false);
  }
}