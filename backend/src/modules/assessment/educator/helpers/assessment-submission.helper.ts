import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AssessmentRepository } from '../../core/assessment-core.repository';
import { DatabaseService } from '@/core/database/database.provider';
import {
  UpdateSubmissionStatusDto,
  AssignStudentsDto,
  ReopenAssessmentDto,
  GradeEssayDto,
} from '../../dto/assessment.dto';

@Injectable()
export class AssessmentSubmissionHelper {
  constructor(
    private readonly repo: AssessmentRepository,
    private readonly db: DatabaseService,
  ) {}

  async getSubmissions(assessment: any, orgId: string) {
    const enrollments = await this.db.enrollment.findMany({
      where: {
        class_id: assessment.class_id,
        org_id: orgId,
        status: { not: 'removed' },
      },
      select: { student_id: true },
    });
    const studentIds = enrollments.map((e) => e.student_id);
    if (!studentIds.length) return [];

    const profiles = await this.db.profile.findMany({
      where: { account_id: { in: studentIds } },
      select: {
        account_id: true,
        full_name: true,
        account: { select: { email: true } },
      },
    });
    const profileMap = new Map(
      profiles.map((p) => [
        p.account_id,
        { name: p.full_name, email: p.account?.email ?? null },
      ]),
    );

    const submissions = await this.repo.findSubmissions(assessment.id, orgId);
    const submissionIds = submissions.map((s) => s.id);
    const answers = submissionIds.length
      ? await this.db.submissionAnswer.findMany({
          where: { submission_id: { in: submissionIds } },
          select: {
            id: true,
            submission_id: true,
            question_id: true,
            answer: true,
            is_correct: true,
          },
        })
      : [];

    const answerMap = new Map<string, typeof answers>();
    for (const a of answers) {
      const list = answerMap.get(a.submission_id) ?? [];
      list.push(a);
      answerMap.set(a.submission_id, list);
    }
    const subMap = new Map(submissions.map((s) => [s.student_id, s]));

    return studentIds.map((studentId) => {
      const profile = profileMap.get(studentId);
      const sub = subMap.get(studentId);
      const subAnswers = sub ? (answerMap.get(sub.id) ?? []) : [];
      return {
        id: sub?.id ?? `not_started_${studentId}`,
        assessment_id: assessment.id,
        student_id: studentId,
        student_name: profile?.name ?? 'Unknown',
        student_code: profile?.email ?? '',
        status: !sub ? 'not_started' : sub.status,
        score: sub?.score ?? null,
        manual_score: sub?.manual_score ?? null,
        total_points: assessment.total_items,
        is_published: assessment.is_published,
        essay_graded: false,
        answers: subAnswers.map((a) => ({
          id: a.id,
          questionId: a.question_id,
          answer: a.answer,
          isCorrect: a.is_correct,
        })),
        started_at: null,
        submitted_at: sub?.submitted_at ?? null,
        updated_at: sub?.submitted_at ?? null,
        system_section_score: sub?.system_section_score ?? null,
        manual_section_score: sub?.manual_section_score ?? null,
        is_missed: sub?.is_missed ?? false,
        is_exempted: sub?.is_exempted ?? false,
      };
    });
  }

  async updateSubmissionStatus(
    assessment: any,
    submissionId: string,
    orgId: string,
    dto: UpdateSubmissionStatusDto,
  ) {
    let submission = await this.repo.findSubmissionById(submissionId);

    if (!submission || submission.assessment_id !== assessment.id) {
      const prefix = 'not_started_';
      const studentId = submissionId.startsWith(prefix)
        ? submissionId.slice(prefix.length)
        : null;
      if (!studentId) throw new NotFoundException('Submission not found.');

      const enrollment = await this.db.enrollment.findFirst({
        where: {
          class_id: assessment.class_id,
          org_id: orgId,
          student_id: studentId,
          status: { not: 'removed' },
        },
      });
      if (!enrollment)
        throw new NotFoundException('Student not enrolled in this class.');

      submission = await this.db.submission.create({
        data: {
          org_id: orgId,
          assessment_id: assessment.id,
          student_id: studentId,
          status: 'draft',
        },
      });
    }

    if (dto.status === 'custom' && dto.manualScore === undefined) {
      throw new BadRequestException(
        'manualScore is required for custom status.',
      );
    }

    const updateData: any = {
      status: dto.status,
      manualScore: dto.manualScore,
    };
    if (dto.status === 'exempted') {
      updateData.isExempted = true;
      updateData.score = 0;
    }
    if (dto.status === 'missed') {
      updateData.status = 'custom';
      updateData.isMissed = true;
      updateData.score = 0;
    }

    return this.repo.updateSubmissionStatus(submission.id, updateData);
  }

  async gradeEssay(assessment: any, submissionId: string, dto: GradeEssayDto) {
    const submission = await this.repo.findSubmissionById(submissionId);
    if (!submission || submission.assessment_id !== assessment.id)
      throw new NotFoundException('Submission not found.');
    return this.repo.gradeEssay(submissionId, dto.score, dto.score);
  }

  async assignStudents(assessment: any, orgId: string, dto: AssignStudentsDto) {
    for (const studentId of dto.studentIds) {
      await this.repo
        .upsertSubmission({
          orgId,
          assessmentId: assessment.id,
          studentId,
          status: 'draft',
        })
        .catch(() => {});
    }
    return { success: true, assigned: dto.studentIds.length };
  }

  async reopen(assessment: any, orgId: string, dto: ReopenAssessmentDto) {
    const reopenedUntil = new Date(dto.reopenedUntil);
    for (const studentId of dto.studentIds) {
      const existing = await this.repo.findSubmissionByStudent(
        assessment.id,
        studentId,
      );
      if (existing) {
        await this.db.submissionAnswer.deleteMany({
          where: { submission_id: existing.id },
        });
        await this.db.submission.update({
          where: { id: existing.id },
          data: {
            status: 'draft',
            score: null,
            manual_score: null,
            submitted_at: null,
            reopened_until: reopenedUntil,
          },
        });
      } else {
        await this.db.submission.create({
          data: {
            org_id: orgId,
            assessment_id: assessment.id,
            student_id: studentId,
            status: 'draft',
            reopened_until: reopenedUntil,
          },
        });
      }
    }
    return { success: true, reopened: dto.studentIds.length };
  }
}
