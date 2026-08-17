// @/modules/submission/submission.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class SubmissionRepository {
  constructor(private readonly db: DatabaseService) {}

  // ───────── SUBMISSION ─────────

  async findByStudent(assessmentId: string, studentId: string) {
    return this.db.submission.findFirst({
      where: { assessment_id: assessmentId, student_id: studentId },
    });
  }

  async findById(id: string) {
    return this.db.submission.findFirst({ where: { id } });
  }

  async create(data: {
    orgId: string;
    assessmentId: string;
    studentId: string;
    status: string;
  }) {
    return this.db.submission.create({
      data: {
        org_id: data.orgId,
        assessment_id: data.assessmentId,
        student_id: data.studentId,
        status: data.status as any,
        score: null,
        manual_score: null,
        manual_section_score: null,
        system_section_score: null,
        is_missed: false,
        is_exempted: false,
        submitted_at: null,
      },
    });
  }

  async updateStatus(
    id: string,
    data: {
      status: string;
      score?: number;
      systemSectionScore?: number;
      submittedAt?: Date;
    },
  ) {
    return this.db.submission.update({
      where: { id },
      data: {
        status: data.status as any,
        ...(data.score !== undefined ? { score: data.score } : {}),
        ...(data.systemSectionScore !== undefined
          ? { system_section_score: data.systemSectionScore }
          : {}),
        ...(data.submittedAt !== undefined
          ? { submitted_at: data.submittedAt }
          : {}),
      },
    });
  }

  // ───────── ANSWERS ─────────

  async findAnswers(submissionId: string) {
    return this.db.submissionAnswer.findMany({
      where: { submission_id: submissionId },
    });
  }

  async upsertAnswers(
    submissionId: string,
    orgId: string,
    answers: Array<{ questionId: string; answer: string }>,
  ) {
    // Delete existing answers then recreate — cleanest upsert for bulk
    await this.db.submissionAnswer.deleteMany({
      where: { submission_id: submissionId },
    });

    if (answers.length === 0) return [];

    await this.db.submissionAnswer.createMany({
      data: answers.map((a) => ({
        org_id: orgId,
        submission_id: submissionId,
        question_id: a.questionId,
        answer: a.answer,
        is_correct: null, // graded on finish
      })),
    });

    return this.db.submissionAnswer.findMany({
      where: { submission_id: submissionId },
    });
  }

  async gradeAnswers(
    submissionId: string,
    gradedAnswers: Array<{ id: string; isCorrect: boolean }>,
  ) {
    // Update each answer's is_correct flag
    await Promise.all(
      gradedAnswers.map((a) =>
        this.db.submissionAnswer.update({
          where: { id: a.id },
          data: { is_correct: a.isCorrect },
        }),
      ),
    );
  }

  // ───────── QUESTIONS (for auto-grading) ─────────

  async findQuestionsByAssessment(assessmentId: string) {
    return this.db.question.findMany({
      where: { assessment_id: assessmentId },
    });
  }

  // ───────── REOPEN ─────────

  async clearReopenedUntil(submissionId: string) {
    return this.db.submission.update({
      where: { id: submissionId },
      data: { reopened_until: null },
    });
  }

  // ───────── AUTO-CLOSE DRAFTS ─────────

  async closeExpiredDrafts(assessmentId: string) {
    return this.db.submission.updateMany({
      where: {
        assessment_id: assessmentId,
        status: 'draft',
      },
      data: {
        status: 'submitted',
        submitted_at: new Date(),
      },
    });
  }
}
