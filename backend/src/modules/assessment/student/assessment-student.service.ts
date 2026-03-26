// @/modules/assessment/student/assessment-student.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AssessmentCoreService } from '../core/assessment-core.service';
import { ClassRepository } from '@/modules/class/class.repository';
import { GradeRepository } from '@/modules/grade/grade.repository';

@Injectable()
export class AssessmentStudentService {
  constructor(  
    private readonly core: AssessmentCoreService,
    private readonly classRepo: ClassRepository,
    private readonly gradeRepo: GradeRepository,
  ) {}

  private async assertStudentEnrolled(classId: string, studentId: string, orgId: string) {
    const enrollment = await this.classRepo.findEnrolledClassByStudent(classId, studentId, orgId);
    if (!enrollment) throw new ForbiddenException('Not enrolled in this class.');
    return enrollment;
  }

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

  async getAssessmentDetail(classId: string, assessmentId: string, orgId: string, studentId: string) {
    await this.assertStudentEnrolled(classId, studentId, orgId);
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    this.core.assertBelongsToClass(assessment, classId);

    if (!this.core.isReleased(assessment)) {
      return this.core.buildAssessmentDetail(assessment, null, true);
    }

    const questions = await this.core.getQuestions(assessmentId);
    return this.core.buildAssessmentDetail(assessment, questions, false);
  }

  async getResult(classId: string, assessmentId: string, orgId: string, studentId: string) {
    await this.assertStudentEnrolled(classId, studentId, orgId);
    const assessment = await this.core.findAssessmentOrThrow(assessmentId, orgId);
    this.core.assertBelongsToClass(assessment, classId);

    const submission = await this.core.getSubmissionByStudent(assessmentId, studentId);
    if (!submission) throw new NotFoundException('No submission found.');

      // TODO: wire real GradeLock
      const grade = await this.gradeRepo.findByStudent(
    studentId,
    classId,
    assessment.term_id,
    orgId,
  );

  const isLocked = grade?.is_locked ?? false;

  return this.core.buildResult(submission, assessment, isLocked);
    }
}