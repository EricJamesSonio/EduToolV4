// src/modules/grade/grade.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GradeRepository } from './grade.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SetManualScoreDto } from './dto/grade.dto';

// ── Rubric category shape from Rubric.categories JSON ────────────────────────
interface RubricCategory {
  name: string;   // e.g. "Quiz", "Exam", "Activity", "Attendance"
  type: string;   // direct match to assessment.type: quiz | exam | activity | custom
                  // for manual-only categories (attendance, behavior) type = 'manual'
  weight: number; // e.g. 0.3 = 30%
}

// ── GradingScale range shape ──────────────────────────────────────────────────
interface GradeRange {
  minPercent: number;
  maxPercent: number;
  gradeValue: string;
  remark: string;
  isPassing: boolean;
}

@Injectable()
export class GradeService {
  constructor(
    private readonly repo: GradeRepository,
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
  // Returns all terms with per-student grades + breakdowns

  async getGradesByClass(
    classId: string,
    orgId: string,
    educatorId: string,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const cls = await this.repo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    // Resolve semester terms
    const terms = await this.resolveTerms(cls.semester_id, orgId);

    const results = await Promise.all(
      terms.map((term) =>
        this.buildTermResult(classId, term.id, orgId, cls),
      ),
    );

    return results;
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

    const enrolledStudentIds = cls.enrollments.map((e) => e.student_id);
    if (enrolledStudentIds.length === 0) {
      return { computed: 0, message: 'No active enrollments.' };
    }

    // Load rubric
    const rubric = await this.repo.findRubricForClass(classId, orgId);
    if (!rubric) throw new NotFoundException('No rubric found for this class.');
    const categories = rubric.categories as unknown as RubricCategory[];

    // Load grading scale
    const gradingScale = await this.resolveGradingScale(cls, orgId);
    if (!gradingScale) throw new NotFoundException('No grading scale found for this class.');
    const ranges = gradingScale.ranges as unknown as GradeRange[];

    // Load all submissions for this term
    const submissions = await this.repo.findSubmissionsForTerm(classId, termId, orgId);

    // Load all manual scores for this term
    const manualScores = await this.repo.findManualScores(classId, termId, orgId);

    let computed = 0;

    for (const studentId of enrolledStudentIds) {
      const studentSubmissions = submissions.filter(
        (s) => s.student_id === studentId,
      );
      const studentManuals = manualScores.filter(
        (m) => m.student_id === studentId,
      );

      const finalScore = this.computeWeightedScore(
        studentSubmissions,
        studentManuals,
        categories,
      );

      const finalGrade = this.resolveGrade(finalScore, ranges);

      await this.repo.upsert({
        orgId,
        studentId,
        classId,
        termId,
        finalScore,
        finalGrade,
      });

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

    // Guard: cannot set manual score if grade is locked
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

  // ── Private: build term result for display ────────────────────────────────

  private async buildTermResult(
    classId: string,
    termId: string,
    orgId: string,
    cls: any,
  ) {
    const enrolledStudentIds: string[] = cls.enrollments.map(
      (e: any) => e.student_id,
    );

    const [submissions, grades, manualScores, rubric] = await Promise.all([
      this.repo.findSubmissionsForTerm(classId, termId, orgId),
      this.repo.findByClassAndTerm(classId, termId, orgId),
      this.repo.findManualScores(classId, termId, orgId),
      this.repo.findRubricForClass(classId, orgId),
    ]);

    const categories = (rubric?.categories ?? []) as unknown as RubricCategory[];

    const gradeMap = new Map(grades.map((g) => [g.student_id, g]));

    const students = enrolledStudentIds.map((studentId) => {
      const studentSubs = submissions.filter((s) => s.student_id === studentId);
      const studentManuals = manualScores.filter((m) => m.student_id === studentId);

      const assessmentScores = studentSubs.map((s) => ({
        assessmentId: s.assessment_id,
        type: s.assessment.type,
        score: s.score,
        manualScore: s.manual_score,
        totalItems: s.assessment.total_items,
        status: s.status,
      }));

      const categoryBreakdown = this.buildCategoryBreakdown(
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

  // ── Private: weighted score computation ──────────────────────────────────

  private computeWeightedScore(
    submissions: any[],
    manualScores: any[],
    categories: RubricCategory[],
  ): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const category of categories) {
      const weight = category.weight;

      if (category.type === 'manual') {
        // Manual-only category (e.g. attendance, behavior)
        const manual = manualScores.find(
          (m) => m.category.toLowerCase() === category.name.toLowerCase(),
        );
        if (manual !== undefined) {
          totalWeightedScore += manual.score * weight;
          totalWeight += weight;
        }
      } else {
        // Assessment-backed category: direct type match (quiz→quiz, exam→exam, activity→activity)
        const categorySubs = submissions.filter(
          (s) => s.assessment.type === category.type,
        );

        if (categorySubs.length === 0) continue;

        // Average percentage across all assessments in this category
        const percentages = categorySubs.map((s) => {
          const rawScore = s.manual_score ?? s.score ?? 0;
          const totalItems = s.assessment.total_items;
          return totalItems > 0 ? (rawScore / totalItems) * 100 : 0;
        });

        const average =
          percentages.reduce((sum, p) => sum + p, 0) / percentages.length;

        totalWeightedScore += average * weight;
        totalWeight += weight;
      }
    }

    // Normalize to total weight used (handles missing categories gracefully)
    if (totalWeight === 0) return 0;
    return Math.round((totalWeightedScore / totalWeight) * 100) / 100;
  }

  // ── Private: category breakdown for display ───────────────────────────────

  private buildCategoryBreakdown(
    submissions: any[],
    manualScores: any[],
    categories: RubricCategory[],
  ) {
    return categories.map((category) => {
      let rawAverage = 0;
      let manualScore: number | null = null;

      if (category.type === 'manual') {
        const manual = manualScores.find(
          (m) => m.category.toLowerCase() === category.name.toLowerCase(),
        );
        manualScore = manual?.score ?? null;
        rawAverage = manualScore ?? 0;
      } else {
        const categorySubs = submissions.filter(
          (s) => s.assessment.type === category.type,
        );

        if (categorySubs.length > 0) {
          const percentages = categorySubs.map((s) => {
            const rawScore = s.manual_score ?? s.score ?? 0;
            return s.assessment.total_items > 0
              ? (rawScore / s.assessment.total_items) * 100
              : 0;
          });
          rawAverage =
            percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
        }
      }

      return {
        category: category.name,
        weight: category.weight,
        rawAverage: Math.round(rawAverage * 100) / 100,
        manualScore,
        weightedScore: Math.round(rawAverage * category.weight * 100) / 100,
      };
    });
  }

  // ── Private: resolve final grade string from grading scale ────────────────

  private resolveGrade(score: number, ranges: GradeRange[]): string {
    const match = ranges.find(
      (r) => score >= r.minPercent && score <= r.maxPercent,
    );
    return match?.gradeValue ?? 'N/A';
  }

  // ── Private: resolve grading scale via subject → level → school year ──────

  private async resolveGradingScale(cls: any, orgId: string) {
    const subject = await this.repo.findSubjectLevel(cls.subject_id, orgId);
    if (!subject) return null;

    return this.repo.findGradingScale(
      subject.level_id,
      cls.school_year_id,
      orgId,
    );
  }

  // ── Private: resolve terms for a semester ────────────────────────────────

  private async resolveTerms(semesterId: string, orgId: string) {
    const semester = await this.repo['db'].semester.findUnique({
      where: { id: semesterId },
      include: { terms: { orderBy: { order_index: 'asc' } } },
    });
    return semester?.terms ?? [];
  }

  // ── Private: assert educator owns class ──────────────────────────────────

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