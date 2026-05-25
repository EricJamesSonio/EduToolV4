// @/modules/assessment/core/assessment.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/core/database/database.provider';

@Injectable()
export class AssessmentRepository {
  constructor(private readonly db: DatabaseService) {}

  // ───────── ASSESSMENT CRUD ─────────

  async create(data: {
    orgId: string;
    classId: string;
    lessonId?: string;
    termId: string;
    type: string;
    title?: string;
    totalItems: number;
    releaseDate?: Date;
    endDate?: Date;
    gradingMode?: string;
    manualMaxScore?: number;
    showBreakdown?: boolean;
  }) {
    return this.db.assessment.create({
      data: {
        org_id: data.orgId,
        class_id: data.classId,
        lesson_id: data.lessonId ?? null,
        term_id: data.termId,
        type: data.type,
        title: data.title ?? null,
        total_items: data.totalItems,
        release_date: data.releaseDate ?? null,
        is_published: false,
        grading_mode: data.gradingMode as any ?? 'system',
        manual_max_score: data.manualMaxScore ?? null,
        show_breakdown: data.showBreakdown ?? false,
      },
    });
  }

  async findAll(classId: string, orgId: string, filters: { termId?: string; type?: string }) {
    return this.db.assessment.findMany({
      where: {
        class_id: classId,
        org_id: orgId,
        ...(filters.termId ? { term_id: filters.termId } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async findById(id: string, orgId: string) {
    return this.db.assessment.findFirst({ where: { id, org_id: orgId } });
  }

  async update(id: string, data: { releaseDate?: Date | null; endDate?: Date | null; type?: string; title?: string; isPublished?: boolean; showBreakdown?: boolean; gradingMode?: string; manualMaxScore?: number | null }) {
    return this.db.assessment.update({
      where: { id },
      data: {
        ...(data.releaseDate !== undefined ? { release_date: data.releaseDate } : {}),
        ...(data.endDate !== undefined ? { end_date: data.endDate } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.isPublished !== undefined ? { is_published: data.isPublished } : {}),
        ...(data.showBreakdown !== undefined ? { show_breakdown: data.showBreakdown } : {}),
        ...(data.gradingMode !== undefined ? { grading_mode: data.gradingMode as any } : {}),
        ...(data.manualMaxScore !== undefined ? { manual_max_score: data.manualMaxScore } : {}),
      },
    });
  }

  async softDelete(id: string) {
    return this.db.assessment.delete({ where: { id } });
  }

  // ───────── QUESTIONS ─────────

  async createQuestions(questions: Array<{ orgId: string; assessmentId: string; type: string; questionText: string; correctAnswer?: string; choices?: string[]; order: number; isManual?: boolean; sectionType?: string }>) {
    return this.db.question.createMany({
      data: questions.map(q => ({
        org_id: q.orgId,
        assessment_id: q.assessmentId,
        type: q.type,
        question_text: q.questionText,
        correct_answer: q.correctAnswer ?? null,
        choices: q.choices ? q.choices : undefined,
        order: q.order,
        is_manual: q.isManual ?? false,
        section_type: q.sectionType ?? null,
      })),
    });
  }

  async findQuestions(assessmentId: string) {
    return this.db.question.findMany({
      where: { assessment_id: assessmentId },
      orderBy: { order: 'asc' },
    });
  }

  async findQuestionById(id: string) {
    return this.db.question.findFirst({ where: { id } });
  }

  async updateQuestion(id: string, data: { questionText?: string; correctAnswer?: string }) {
    return this.db.question.update({
      where: { id },
      data: {
        ...(data.questionText !== undefined ? { question_text: data.questionText } : {}),
        ...(data.correctAnswer !== undefined ? { correct_answer: data.correctAnswer } : {}),
      },
    });
  }

  // ───────── SUBMISSIONS ─────────

  async findSubmissions(assessmentId: string, orgId: string) {
    return this.db.submission.findMany({ where: { assessment_id: assessmentId, org_id: orgId } });
  }

  async findSubmissionById(id: string) {
    return this.db.submission.findFirst({ where: { id } });
  }

  async findSubmissionByStudent(assessmentId: string, studentId: string) {
    return this.db.submission.findFirst({ where: { assessment_id: assessmentId, student_id: studentId } });
  }

  async upsertSubmission(data: {
    orgId: string;
    assessmentId: string;
    studentId: string;
    status: string;
    score?: number;
    manualScore?: number;
    submittedAt?: Date;
    manualSectionScore?: number;
    systemSectionScore?: number;
    isMissed?: boolean;
    isExempted?: boolean;
  }) {
    const existing = await this.findSubmissionByStudent(data.assessmentId, data.studentId);

    if (existing) {
      return this.db.submission.update({
        where: { id: existing.id },
        data: {
          status: data.status as any,
          ...(data.score !== undefined ? { score: data.score } : {}),
          ...(data.manualScore !== undefined ? { manual_score: data.manualScore } : {}),
          ...(data.manualSectionScore !== undefined ? { manual_section_score: data.manualSectionScore } : {}),
          ...(data.systemSectionScore !== undefined ? { system_section_score: data.systemSectionScore } : {}),
          ...(data.isMissed !== undefined ? { is_missed: data.isMissed } : {}),
          ...(data.isExempted !== undefined ? { is_exempted: data.isExempted } : {}),
          ...(data.submittedAt !== undefined ? { submitted_at: data.submittedAt } : {}),
        },
      });
    }

    return this.db.submission.create({
      data: {
        org_id: data.orgId,
        assessment_id: data.assessmentId,
        student_id: data.studentId,
        status: data.status as any,
        score: data.score ?? null,
        manual_score: data.manualScore ?? null,
        manual_section_score: data.manualSectionScore ?? null,
        system_section_score: data.systemSectionScore ?? null,
        is_missed: data.isMissed ?? false,
        is_exempted: data.isExempted ?? false,
        submitted_at: data.submittedAt ?? null,
      },
    });
  }

  async updateSubmissionStatus(id: string, data: { status: string; manualScore?: number; isExempted?: boolean; isMissed?: boolean; score?: number }) {
    return this.db.submission.update({
      where: { id },
      data: {
        status: data.status as any,
        ...(data.manualScore !== undefined ? { manual_score: data.manualScore } : {}),
        ...(data.isExempted !== undefined ? { is_exempted: data.isExempted } : {}),
        ...(data.isMissed !== undefined ? { is_missed: data.isMissed } : {}),
        ...(data.score !== undefined ? { score: data.score } : {}),
      },
    });
  }

  async gradeEssay(id: string, score: number, manualSectionScore?: number) {
    return this.db.submission.update({
      where: { id },
      data: {
        manual_score: score,
        ...(manualSectionScore !== undefined ? { manual_section_score: manualSectionScore } : {}),
      },
    });
  }

  async publishAllByClass(classId: string, orgId: string) {
    return this.db.assessment.updateMany({
      where: { class_id: classId, org_id: orgId },
      data: { is_published: true },
    });
  }
}