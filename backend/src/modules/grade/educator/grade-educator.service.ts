// src/modules/grade/educator/grade-educator.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GradeRepository } from '../grade.repository';
import { GradeCoreService, RubricCategory, GradeRange } from '../core/grade-core.service';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { SetManualScoreDto } from './dto/grade-educator.dto';

@Injectable()
export class GradeEducatorService {
  constructor(
    private readonly repo: GradeRepository,
    private readonly core: GradeCoreService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ── Called by GradeLockService (existing contract) ────────────────────────

  async publishAllByClass(classId: string, orgId: string) {
    return this.repo.publishByClass(classId, orgId);
  }

  async unlockAllByClass(classId: string, orgId: string) {
    return this.repo.unlockByClass(classId, orgId);
  }

  // ── Kept for internal backward-compat ────────────────────────────────────

  async computeAndSaveGrade(data: {
    orgId: string;
    studentId: string;
    classId: string;
    termId: string;
    finalScore: number;
    finalGrade: string;
  }) {
    return this.repo.upsert(data);
  }

  async getClassGrades(classId: string, orgId: string) {
    return this.repo.findByClass(classId, orgId);
  }

  // ── GET /classes/:classId/grades ──────────────────────────────────────────

  async getGradesByClass(classId: string, orgId: string, educatorId: string) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const cls = await this.repo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const terms = await this.repo.findTermsBySemester(cls.semester_id);

    return Promise.all(
      terms.map((term) => this.buildTermResult(classId, term.id, orgId, cls)),
    );
  }

  // ── GET /classes/:classId/grades/:termId ──────────────────────────────────

  async getGradesByTerm(
    classId: string,
    termId: string,
    orgId: string,
    educatorId: string,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const cls = await this.repo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    return this.buildTermResult(classId, termId, orgId, cls);
  }

  // ── POST /classes/:classId/grades/:termId/compute ─────────────────────────

  async computeGrades(
    classId: string,
    termId: string,
    orgId: string,
    educatorId: string,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const cls = await this.repo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const enrolledStudentIds = cls.enrollments.map((e: any) => e.student_id);
    if (enrolledStudentIds.length === 0) {
      return { computed: 0, message: 'No active enrollments.' };
    }

    const rubric = await this.repo.findRubricForClass(classId, orgId);
    if (!rubric) throw new NotFoundException('No rubric found for this class.');
    const categories = rubric.categories as unknown as RubricCategory[];

    const gradingScale = await this.resolveGradingScale(cls, orgId);
    if (!gradingScale) throw new NotFoundException('No grading scale found for this class.');
    const ranges = gradingScale.ranges as unknown as GradeRange[];

    const submissions = await this.repo.findSubmissionsForTerm(classId, termId, orgId);
    const manualScores = await this.repo.findManualScores(classId, termId, orgId);

    let computed = 0;

    for (const studentId of enrolledStudentIds) {
      const studentSubmissions = submissions.filter((s: any) => s.student_id === studentId);
      const studentManuals = manualScores.filter((m: any) => m.student_id === studentId);

      const finalScore = this.core.computeWeightedScore(
        studentSubmissions,
        studentManuals,
        categories,
      );

      const finalGrade = this.core.resolveGrade(finalScore, ranges);

      await this.repo.upsert({ orgId, studentId, classId, termId, finalScore, finalGrade });
      computed++;
    }

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'grades_computed',
      entityType: 'class',
      entityId: classId,
      metadata: { termId, studentsComputed: computed },
    });

    return { computed, message: `Grades computed for ${computed} student(s).` };
  }

  // ── PATCH /classes/:classId/grades/:termId/students/:studentId/manual ─────

  async setManualScore(
    classId: string,
    termId: string,
    studentId: string,
    orgId: string,
    educatorId: string,
    dto: SetManualScoreDto,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const grade = await this.repo.findByStudent(studentId, classId, termId, orgId);
    if (grade?.is_locked) {
      throw new ForbiddenException(
        'Grade is locked. Admin must unlock before manual scores can be changed.',
      );
    }

    const saved = await this.repo.upsertManualScore({
      orgId,
      classId,
      studentId,
      termId,
      category: dto.category,
      score: dto.score,
    });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'manual_score_set',
      entityType: 'class',
      entityId: classId,
      metadata: { termId, studentId, category: dto.category, score: dto.score },
    });

    return saved;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async buildTermResult(
    classId: string,
    termId: string,
    orgId: string,
    cls: any,
  ) {
    const enrolledStudentIds: string[] = cls.enrollments.map((e: any) => e.student_id);

    const [submissions, grades, manualScores, rubric] = await Promise.all([
      this.repo.findSubmissionsForTerm(classId, termId, orgId),
      this.repo.findByClassAndTerm(classId, termId, orgId),
      this.repo.findManualScores(classId, termId, orgId),
      this.repo.findRubricForClass(classId, orgId),
    ]);

    const categories = (rubric?.categories ?? []) as unknown as RubricCategory[];
    const gradeMap = new Map(grades.map((g) => [g.student_id, g]));

    const students = enrolledStudentIds.map((studentId) => {
      const studentSubs = submissions.filter((s: any) => s.student_id === studentId);
      const studentManuals = manualScores.filter((m: any) => m.student_id === studentId);

      const assessmentScores = studentSubs.map((s: any) => ({
        assessmentId: s.assessment_id,
        type: s.assessment.type,
        score: s.score,
        manualScore: s.manual_score,
        totalItems: s.assessment.total_items,
        status: s.status,
      }));

      const categoryBreakdown = this.core.buildCategoryBreakdown(
        studentSubs,
        studentManuals,
        categories,
      );

      return {
        studentId,
        grade: gradeMap.get(studentId) ?? null,
        assessmentScores,
        categoryBreakdown,
      };
    });

    return { termId, students };
  }

  private async resolveGradingScale(cls: any, orgId: string) {
    const subject = await this.repo.findSubjectLevel(cls.subject_id, orgId);
    if (!subject) return null;
    return this.repo.findGradingScale(subject.level_id, cls.school_year_id, orgId);
  }

  private async assertEducatorOwnsClass(
    classId: string,
    orgId: string,
    educatorId: string,
  ) {
    const cls = await this.repo['db'].class.findFirst({
      where: { id: classId, org_id: orgId, deleted_at: null },
    });
    if (!cls) throw new NotFoundException('Class not found.');
    if (cls.educator_id !== educatorId) {
      throw new ForbiddenException('You do not own this class.');
    }
    return cls;
  }
}