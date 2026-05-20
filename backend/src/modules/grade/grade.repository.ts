// src/modules/grade/grade.repository.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.provider';
import { Prisma } from '@prisma/client';

type GradingSchemeWithComponents = Prisma.GradingSchemeGetPayload<{
  include: { components: true };
}>;
@Injectable()
export class GradeRepository {
  constructor(private db: DatabaseService) {}

  // ───────── FIND / QUERY ─────────

  async findByClass(classId: string, orgId: string) {
    return this.db.grade.findMany({
      where: {
        class_id: classId,
        org_id: orgId,
      },
    });
  }

  async findByClassAndTerm(classId: string, termId: string, orgId: string) {
    return this.db.grade.findMany({
      where: {
        class_id: classId,
        term_id: termId,
        org_id: orgId,
      },
    });
  }

  async findByStudent(
    studentId: string,
    classId: string,
    termId: string,
    orgId: string,
  ) {
    return this.db.grade.findFirst({
      where: {
        student_id: studentId,
        class_id: classId,
        term_id: termId,
        org_id: orgId,
      },
    });
  }

  // ───────── UPSERT GRADE ─────────

  async upsert(data: {
    orgId: string;
    studentId: string;
    classId: string;
    termId: string;
    finalScore: number;
    finalGrade: string;
  }) {
    return this.db.grade.upsert({
      where: {
        org_id_student_id_class_id_term_id: {
          org_id: data.orgId,
          student_id: data.studentId,
          class_id: data.classId,
          term_id: data.termId,
        },
      },
      update: {
        final_score: data.finalScore,
        final_grade: data.finalGrade,
      },
      create: {
        org_id: data.orgId,
        student_id: data.studentId,
        class_id: data.classId,
        term_id: data.termId,
        final_score: data.finalScore,
        final_grade: data.finalGrade,
      },
    });
  }

  // ───────── LOCK / UNLOCK ─────────

  async publishByClass(classId: string, orgId: string) {
    return this.db.grade.updateMany({
      where: { class_id: classId, org_id: orgId },
      data: { is_locked: true, locked_at: new Date() },
    });
  }

  async unlockByClass(classId: string, orgId: string) {
    return this.db.grade.updateMany({
      where: { class_id: classId, org_id: orgId },
      data: { is_locked: false, locked_at: null },
    });
  }

  // ───────── ASSESSMENTS (for computation) ─────────

  async findAssessmentsForTerm(classId: string, termId: string, orgId: string) {
    return this.db.assessment.findMany({
      where: {
        org_id: orgId,
        class_id: classId,
        term_id: termId,
        deleted_at: null,
      },
      select: {
        id: true,
        type: true,
        total_items: true,
        grading_mode: true,
        show_breakdown: true,
      },
    });
  }

  // ───────── SUBMISSIONS (for computation) ─────────

  async findSubmissionsForTerm(classId: string, termId: string, orgId: string) {
    return this.db.submission.findMany({
      where: {
        org_id: orgId,
        assessment: {
          class_id: classId,
          term_id: termId,
        },
      },
      include: {
        assessment: {
          select: {
            id: true,
            type: true,
            total_items: true,
            term_id: true,
            grading_mode: true,
          },
        },
      },
    });
  }

  // ───────── GRADING SCHEME (for weights) ─────────

  async findGradingSchemeForClass(
    classId: string,
    orgId: string,
  ): Promise<GradingSchemeWithComponents | null> {
    const classScheme = await this.db.gradingScheme.findFirst({
      where: { class_id: classId, org_id: orgId },
      include: { components: true },
    });
    if (classScheme) return classScheme;

    return this.db.gradingScheme.findFirst({
      where: { org_id: orgId, is_default: true },
      include: { components: true },
    });
  }

  // ───────── GRADING SCALE ─────────

  async findGradingScale(programId: string, schoolYearId: string, orgId: string) {
    return this.db.gradingScale.findFirst({
      where: {
        org_id: orgId,
        program_id: programId,
        school_year_id: schoolYearId,
      },
    });
  }

  // ───────── CLASS INFO ─────────

  async findClassWithSubject(classId: string, orgId: string) {
    return this.db.class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
      include: {
        enrollments: {
          where: { status: 'active' },
          select: { student_id: true },
        },
      },
    });
  }

  async findSubjectLevel(subjectId: string, orgId: string) {
    return this.db.subject.findFirst({
      where: { id: subjectId, org_id: orgId },
      select: { level_id: true },
    });
  }

  // ───────── MANUAL SCORES ─────────

  async findManualScores(
    classId: string,
    termId: string,
    orgId: string,
    studentId?: string,
  ) {
    return this.db.manualScore.findMany({
      where: {
        class_id: classId,
        term_id: termId,
        org_id: orgId,
        ...(studentId ? { student_id: studentId } : {}),
      },
    });
  }

  async upsertManualScore(data: {
    orgId: string;
    classId: string;
    studentId: string;
    termId: string;
    category: string;
    score: number;
  }) {
    return this.db.manualScore.upsert({
      where: {
        org_id_class_id_student_id_term_id_category: {
          org_id: data.orgId,
          class_id: data.classId,
          student_id: data.studentId,
          term_id: data.termId,
          category: data.category,
        },
      },
      update: { score: data.score },
      create: {
        org_id: data.orgId,
        class_id: data.classId,
        student_id: data.studentId,
        term_id: data.termId,
        category: data.category,
        score: data.score,
      },
    });
  }

  // ───────── TERMS ─────────

  async findTermsBySemester(semesterId: string) {
    const semester = await this.db.semester.findUnique({
      where: { id: semesterId },
      include: { terms: { orderBy: { order_index: 'asc' } } },
    });
    return semester?.terms ?? [];
  }

  async setAssessmentVisibility(assessmentId: string, showBreakdown: boolean) {
    return this.db.assessment.update({
      where: { id: assessmentId },
      data: { show_breakdown: showBreakdown },
    });
  }

  async findStudentProfiles(studentIds: string[]): Promise<Map<string, { name: string; code: string }>> {
    const accounts = await this.db.account.findMany({
      where: { id: { in: studentIds } },
      include: { profile: true },
    });

    const map = new Map<string, { name: string; code: string }>();
    for (const account of accounts) {
      const meta = (account.profile?.metadata ?? {}) as Record<string, any>;
      map.set(account.id, {
        name: account.profile?.full_name ?? 'Unknown',
        code: meta.studentId ?? '',
      });
    }
    return map;
  }
}