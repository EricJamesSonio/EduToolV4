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
        title: true,
        total_items: true,
        grading_mode: true,
        show_breakdown: true,
        is_published: true,
        manual_max_score: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async registerAssessmentForAllStudents(assessmentId: string, classId: string, orgId: string) {
    const enrollments = await this.db.enrollment.findMany({
      where: { class_id: classId, org_id: orgId, status: 'active' },
      select: { student_id: true },
    });
    if (enrollments.length === 0) return 0;

    const existing = await this.db.submission.findMany({
      where: { assessment_id: assessmentId },
      select: { student_id: true },
    });
    const existingIds = new Set(existing.map((s: any) => s.student_id));

    const newSubs: any[] = enrollments
      .filter((e) => !existingIds.has(e.student_id))
      .map((e) => ({
        org_id: orgId,
        assessment_id: assessmentId,
        student_id: e.student_id,
        status: 'draft',
        score: null,
        manual_score: null,
        submitted_at: null,
      }));

    if (newSubs.length > 0) {
      await this.db.submission.createMany({ data: newSubs });
    }
    return newSubs.length;
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
            created_at: true,
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
    const assignment = await this.db.gradingScaleAssignment.findFirst({
      where: {
        org_id: orgId,
        program_id: programId,
        school_year_id: schoolYearId,
      },
      include: { grading_scale: true },
    });
    return assignment?.grading_scale ?? null;
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
      select: { level_id: true, program_id: true },
    });
  }

  async findSemestersBySchoolYear(schoolYearId: string) {
    return this.db.semester.findMany({
      where: { school_year_id: schoolYearId },
      orderBy: { start_date: 'asc' },
    });
  }

async findTemplateTermsByClass(classId: string, orgId: string) {
  // Get the class → subject → program → semester template assignment → terms with date ranges
  const cls = await this.db.class.findFirst({
    where: { id: classId, org_id: orgId, deleted_at: null },
    select: { subject_id: true, semester_id: true },
  });
  if (!cls) return [];

  const subject = await this.db.subject.findFirst({
    where: { id: cls.subject_id },
    select: { program_id: true },
  });
  if (!subject?.program_id) return [];

  const assignment = await this.db.programSemesterAssignment.findUnique({
    where: { program_id: subject.program_id },
    include: {
      template: {
        include: {
          semesters: {
            orderBy: { order_index: 'asc' },
            include: {
              terms: { orderBy: { order_index: 'asc' } },
            },
          },
        },
      },
      termDates: true,
    },
  });
  if (!assignment) return [];

  // Scope to the class's actual semester date range
  let classSemStart: Date | null = null;
  let classSemEnd: Date | null = null;
  if (cls.semester_id) {
    const actualSem = await this.db.semester.findUnique({
      where: { id: cls.semester_id },
      select: { start_date: true, end_date: true },
    });
    if (actualSem) {
      classSemStart = actualSem.start_date;
      classSemEnd = actualSem.end_date;
    }
  }

  const termDatesMap = new Map<string, { start: Date; end: Date }>();
  for (const td of assignment.termDates) {
    termDatesMap.set(td.term_id, {
      start: new Date(td.start_date),
      end: new Date(td.end_date),
    });
  }

  const result: { id: string; name: string; semesterName: string; semesterIndex: number }[] = [];

  for (let si = 0; si < assignment.template.semesters.length; si++) {
    const sem = assignment.template.semesters[si];

    // Filter to semesters overlapping the class's actual semester
    if (classSemStart && classSemEnd) {
      const semDates = sem.terms
        .map((t) => termDatesMap.get(t.id))
        .filter(Boolean) as { start: Date; end: Date }[];

      if (semDates.length === 0) continue;

      const semStart = new Date(Math.min(...semDates.map((d) => d.start.getTime())));
      const semEnd = new Date(Math.max(...semDates.map((d) => d.end.getTime())));

      if (semEnd < classSemStart || semStart > classSemEnd) continue;
    }

    for (const term of sem.terms) {
      result.push({
        id: term.id,
        name: term.name,
        semesterName: sem.name,
        semesterIndex: si + 1,
      });
    }
  }

  return result;
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