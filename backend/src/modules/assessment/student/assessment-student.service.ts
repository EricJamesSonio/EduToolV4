// @/modules/assessment/student/assessment-student.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentCoreService } from '../core/assessment-core.service';
import { DatabaseService } from '@/core/database/database.provider';
import { EnrollmentRepository } from '@/modules/enrollment/enrollment.repository';
import { GradeRepository } from '@/modules/grade/grade.repository';

@Injectable()
export class AssessmentStudentService {
  constructor(
    private readonly core: AssessmentCoreService,
    private readonly db: DatabaseService,
    private readonly enrollmentRepo: EnrollmentRepository,
    private readonly gradeRepo: GradeRepository,
  ) {}

  private async assertStudentEnrolled(
    classId: string,
    studentId: string,
    orgId: string,
  ) {
    const enrollment = await this.enrollmentRepo.findOneByStudentAndClass(
      classId,
      studentId,
      orgId,
    );

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this class.');
    }

    return enrollment;
  }

  async getAssessments(classId: string, orgId: string, studentId: string) {
    await this.assertStudentEnrolled(classId, studentId, orgId);

    const assessments = await this.core.findAssessmentsByClass(classId, orgId);
    if (!assessments.length) return [];

    const ids = assessments.map((a) => a.id);

    // Get this student's submission per assessment
    const submissions = await this.db.submission.findMany({
      where: { assessment_id: { in: ids }, student_id: studentId },
      select: {
        id: true,
        assessment_id: true,
        status: true,
        reopened_until: true,
      },
    });
    const subMap = new Map(submissions.map((s) => [s.assessment_id, s]));

    // Find active reopens for this student
    const now = new Date();

    return assessments.map((a) => {
      const submission = subMap.get(a.id) ?? null;
      const reopenedUntil = submission?.reopened_until;
      const isReopened = !!reopenedUntil && now <= new Date(reopenedUntil);

      const item = this.core.buildAssessmentListItem(a, submission);

      return {
        ...item,
        status: isReopened ? 'open' : item.submissionStatus,
        reopenedUntil: reopenedUntil ? reopenedUntil.toISOString() : null,
      };
    });
  }

  async getAssessmentDetail(
    classId: string,
    assessmentId: string,
    orgId: string,
    studentId: string,
  ) {
    await this.assertStudentEnrolled(classId, studentId, orgId);

    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    this.core.assertBelongsToClass(assessment, classId);

    if (!this.core.isReleased(assessment)) {
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

    const assessment = await this.core.findAssessmentOrThrow(
      assessmentId,
      orgId,
    );
    this.core.assertBelongsToClass(assessment, classId);

    const submission = await this.core.getSubmissionByStudent(
      assessmentId,
      studentId,
    );

    if (!submission) {
      throw new NotFoundException('No submission found.');
    }

    // TODO: wire real GradeLock
    const grade = await this.gradeRepo.findByStudent(
      studentId,
      classId,
      assessment.term_id,
      orgId,
    );

    const isLocked = grade?.is_locked ?? false;

    const questions = await this.core.getQuestions(assessmentId);
    const answers = await this.db.submissionAnswer.findMany({
      where: { submission_id: submission.id },
    });

    return this.core.buildResult(
      submission,
      assessment,
      isLocked,
      questions,
      answers,
    );
  }
}
