import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { GradeRepository } from './grade.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SetManualScoreDto } from './dto/grade.dto';
// TICK-GRADE-005: single source of truth for "is this category scored
// directly by the educator" and for its maximum. Must match
// grade-core.service.ts exactly, or the weighted score and the breakdown
// disagree with each other.
import {
  isManualScoredCategory,
  manualCategoryMax,
} from './core/grade-core.service';

// TODO: Add a `type` column to GradingSchemeComponent in schema.prisma
// (e.g. type String @default("manual")) so components can map to assessment.type.
// Until then, component.name.toLowerCase() is used as the type discriminator.
interface SchemeCategory {
  name: string; // e.g. "Quiz", "Exam", "Activity"
  type: string; // maps to assessment.type: quiz | exam | activity | manual
  weight: number; // e.g. 0.3 = 30%
  maxScore?: number | null;
  is_optional: boolean;
}

interface GradeRange {
  minPercent: number;
  maxPercent: number;
  gradeValue: string;
  remark: string;
  isPassing: boolean;
}

function componentsToCategories(components: any[]): SchemeCategory[] {
  return components.map((c) => ({
    name: c.name,
    type: c.type ?? c.name.toLowerCase(), // use explicit type if present, else derive from name
    weight: c.weight,
    maxScore: c.max_score ?? c.maxScore ?? null,
    is_optional: c.is_optional,
  }));
}

@Injectable()
export class GradeService {
  constructor(
    private readonly repo: GradeRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async publishAllByClass(classId: string, orgId: string) {
    return this.repo.publishByClass(classId, orgId);
  }

  async unlockAllByClass(classId: string, orgId: string) {
    return this.repo.unlockByClass(classId, orgId);
  }

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

  async getGradesByClass(classId: string, orgId: string, educatorId: string) {
    console.log('[GradeService] getGradesByClass called — new path');
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    const cls = await this.repo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const terms = await this.repo.findTemplateTermsByClass(classId, orgId);
    console.log(
      '[GradeService] terms from template:',
      terms.map((t) => ({ id: t.id, name: t.name })),
    );

    // Perf Phase 2: class-level scheme/profiles are identical for every term —
    // fetch once and build terms in parallel instead of awaiting sequentially.
    const enrolledStudentIds: string[] = cls.enrollments.map(
      (e: any) => e.student_id,
    );
    const [scheme, studentProfiles] = await Promise.all([
      this.repo.findGradingSchemeForClass(classId, orgId),
      this.repo.findStudentProfiles(enrolledStudentIds),
    ]);
    const shared = { scheme, studentProfiles };

    return Promise.all(
      terms.map((term) =>
        this.buildTermResult(
          classId,
          term.id,
          term.name,
          orgId,
          cls,
          { id: term.semesterIndex.toString(), name: term.semesterName },
          shared,
        ),
      ),
    );
  }

  async getGradesByTerm(
    classId: string,
    termId: string,
    orgId: string,
    educatorId: string,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    const cls = await this.repo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const terms = await this.repo.findTemplateTermsByClass(classId, orgId);
    const term = terms.find((t) => t.id === termId);

    return this.buildTermResult(
      classId,
      termId,
      term?.name ?? '',
      orgId,
      cls,
      term
        ? { id: term.semesterIndex.toString(), name: term.semesterName }
        : undefined,
    );
  }

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

    const scheme = await this.repo.findGradingSchemeForClass(classId, orgId);
    if (!scheme)
      throw new NotFoundException('No grading scheme found for this class.');
    const categories = componentsToCategories(scheme.components);

    const gradingScale = await this.resolveGradingScale(cls, orgId);
    if (!gradingScale)
      throw new NotFoundException('No grading scale found for this class.');
    const ranges = gradingScale.ranges as unknown as GradeRange[];

    const submissions = await this.repo.findSubmissionsForTerm(
      classId,
      termId,
      orgId,
    );
    const manualScores = await this.repo.findManualScores(
      classId,
      termId,
      orgId,
    );

    // Perf Phase 2: group once, compute in memory, persist via one batched
    // repository call (single lock check + chunked transaction) instead of N
    // sequential upserts.
    const subsByStudent = new Map<string, any[]>();
    for (const s of submissions) {
      const list = subsByStudent.get(s.student_id);
      if (list) list.push(s);
      else subsByStudent.set(s.student_id, [s]);
    }
    const manualsByStudent = new Map<string, any[]>();
    for (const m of manualScores) {
      const list = manualsByStudent.get(m.student_id);
      if (list) list.push(m);
      else manualsByStudent.set(m.student_id, [m]);
    }

    const rows = enrolledStudentIds.map((studentId) => {
      const studentSubmissions = subsByStudent.get(studentId) ?? [];
      const studentManuals = manualsByStudent.get(studentId) ?? [];

      const finalScore = this.computeWeightedScore(
        studentSubmissions,
        studentManuals,
        categories,
      );
      const finalGrade = this.resolveGrade(finalScore, ranges);

      return { studentId, finalScore, finalGrade };
    });

    // TICK-GRADE-004: bulk compute honors grade locks (skip, don't
    // overwrite) — mirroring recomputeStudentGrade. Business-logic change.
    const { computed, skippedLocked } = await this.repo.saveComputedGrades(
      {
        orgId,
        classId,
        termId,
        rows,
      },
      { skipLocked: true },
    );

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'grades_computed',
      entityType: 'class',
      entityId: classId,
      metadata: { termId, studentsComputed: computed, skippedLocked },
    });

    return {
      computed,
      skippedLocked,
      message:
        `Grades computed for ${computed} student(s).` +
        (skippedLocked > 0 ? ` ${skippedLocked} locked skipped.` : ''),
    };
  }

  async setManualScore(
    classId: string,
    termId: string,
    studentId: string,
    orgId: string,
    educatorId: string,
    dto: SetManualScoreDto,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const grade = await this.repo.findByStudent(
      studentId,
      classId,
      termId,
      orgId,
    );
    if (grade?.is_locked) {
      throw new ForbiddenException(
        'Grade is locked. Admin must unlock before manual scores can be changed.',
      );
    }

    // TICK-GRADE-005: the frontend clamps to the category max for UX, but the
    // server is authoritative for grade data (CORE.md Part 1). Resolve the
    // category first so a typo cannot create an orphan ManualScore row that
    // silently never affects any grade, and so the cap is enforced here.
    const { score } = await this.resolveManualScoreInput(
      classId,
      orgId,
      dto.category,
      dto.score,
    );

    const saved = await this.repo.upsertManualScore({
      orgId,
      classId,
      studentId,
      termId,
      category: dto.category,
      score,
    });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'manual_score_set',
      entityType: 'class',
      entityId: classId,
      metadata: { termId, studentId, category: dto.category, score },
    });

    return saved;
  }

  /**
   * TICK-GRADE-005: validate a manual score against the class grading scheme.
   *
   * Prevents two things:
   *  - an orphan `ManualScore` row for a category that does not exist. Manual
   *    scores are matched by category NAME, so a typo or stale name is silently
   *    ignored by the grade engine while the educator believes they saved a
   *    score.
   *  - a score above the category maximum, which would otherwise inflate the
   *    weighted grade past 100.
   */
  private async resolveManualScoreInput(
    classId: string,
    orgId: string,
    categoryName: string,
    score: number,
  ): Promise<{ score: number }> {
    const scheme = await this.repo.findGradingSchemeForClass(classId, orgId);
    if (!scheme) {
      throw new NotFoundException('No grading scheme found for this class.');
    }
    const categories = componentsToCategories(scheme.components);
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase(),
    );
    if (!category) {
      throw new BadRequestException(
        `"${categoryName}" is not a category in this class's grading scheme. ` +
          `Allowed: ${categories.map((c) => c.name).join(', ')}`,
      );
    }
    if (!isManualScoredCategory(category.type)) {
      throw new BadRequestException(
        `"${categoryName}" is scored from its assessments, not entered manually. ` +
          `Set the score on the assessment instead.`,
      );
    }
    const max = manualCategoryMax(category);
    if (max != null && score > max) {
      throw new BadRequestException(
        `Score for "${categoryName}" cannot exceed the category maximum of ${max}.`,
      );
    }
    return { score };
  }

  private async buildTermResult(
    classId: string,
    termId: string,
    termName: string,
    orgId: string,
    cls: any,
    semesterInfo?: { id: string; name: string },
    shared?: {
      scheme: any;
      studentProfiles: Map<string, { name: string; code: string }>;
    },
  ) {
    const enrolledStudentIds: string[] = cls.enrollments.map(
      (e: any) => e.student_id,
    );

    // Term-level rows vary per term; scheme/profiles are reused when hoisted.
    const [submissions, grades, manualScores, termAssessments] =
      await Promise.all([
        this.repo.findSubmissionsForTerm(classId, termId, orgId),
        this.repo.findByClassAndTerm(classId, termId, orgId),
        this.repo.findManualScores(classId, termId, orgId),
        this.repo.findAssessmentsForTerm(classId, termId, orgId), // was dropped before
      ]);

    let scheme: any;
    let studentProfiles: Map<string, { name: string; code: string }>;
    if (shared) {
      ({ scheme, studentProfiles } = shared);
    } else {
      [scheme, studentProfiles] = await Promise.all([
        this.repo.findGradingSchemeForClass(classId, orgId),
        this.repo.findStudentProfiles(enrolledStudentIds),
      ]);
    }

    const categories = scheme ? componentsToCategories(scheme.components) : [];
    const gradeMap = new Map(grades.map((g) => [g.student_id, g]));

    // Key: `${studentId}:${assessmentId}` → submission row
    const subLookup = new Map<string, any>();
    // Perf Phase 2: per-student groups built once instead of filter() per
    // student (O(S²·A) → O(S·A)). subLookup kept for the per-assessment join.
    const subsByStudent = new Map<string, any[]>();
    for (const s of submissions) {
      subLookup.set(`${s.student_id}:${s.assessment_id}`, s);
      const list = subsByStudent.get(s.student_id);
      if (list) list.push(s);
      else subsByStudent.set(s.student_id, [s]);
    }
    const manualsByStudent = new Map<string, any[]>();
    for (const m of manualScores) {
      const list = manualsByStudent.get(m.student_id);
      if (list) list.push(m);
      else manualsByStudent.set(m.student_id, [m]);
    }

    const students = enrolledStudentIds.map((studentId) => {
      const profile = studentProfiles.get(studentId);
      const studentSubs = subsByStudent.get(studentId) ?? [];
      const studentManuals = manualsByStudent.get(studentId) ?? [];

      // Build one entry per term assessment regardless of submission existence
      const assessmentScores = termAssessments.map((a) => {
        const s = subLookup.get(`${studentId}:${a.id}`);
        return {
          assessmentId: a.id,
          type: a.type,
          title: a.title ?? null,
          score: s?.score ?? null,
          manualScore: s?.manual_score ?? null,
          totalItems: a.total_items,
          status: s?.status ?? 'not_started',
          isMissed: s?.is_missed ?? false,
          isExempted: s?.is_exempted ?? false,
          created_at: a.created_at,
          submissionId: s?.id ?? undefined,
        };
      });

      const totalActiveWeight = categories.reduce((sum, cat) => {
        if (isManualScoredCategory(cat.type)) {
          return studentManuals.some(
            (m) => m.category.toLowerCase() === cat.name.toLowerCase(),
          )
            ? sum + cat.weight
            : sum;
        }
        const hasActive = studentSubs.some(
          (s) =>
            s.assessment.type === cat.type &&
            s.status !== 'exempted' &&
            !s.is_exempted,
        );
        return hasActive ? sum + cat.weight : sum;
      }, 0);

      const categoryBreakdown = this.buildCategoryBreakdown(
        studentSubs,
        studentManuals,
        categories,
        totalActiveWeight,
      );

      return {
        studentId,
        studentName: profile?.name ?? 'Unknown',
        studentCode: profile?.code ?? '',
        grade: gradeMap.get(studentId) ?? null,
        assessmentScores,
        categoryBreakdown,
      };
    });

    return {
      termId,
      termName,
      students,
      ...(semesterInfo
        ? { semesterId: semesterInfo.id, semesterName: semesterInfo.name }
        : {}),
    };
  }

  private computeWeightedScore(
    submissions: any[],
    manualScores: any[],
    categories: SchemeCategory[],
  ): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const category of categories) {
      const weight = category.weight;

      if (isManualScoredCategory(category.type)) {
        const manual = manualScores.find(
          (m) => m.category.toLowerCase() === category.name.toLowerCase(),
        );
        if (manual !== undefined) {
          totalWeightedScore += manual.score * weight;
          totalWeight += weight;
        }
      } else {
        const categorySubs = submissions.filter(
          (s) =>
            s.assessment.type === category.type &&
            !s.is_exempted &&
            s.status !== 'exempted',
        );
        if (categorySubs.length === 0) {
          const anyExempted = submissions.some(
            (s) =>
              s.assessment.type === category.type &&
              (s.is_exempted || s.status === 'exempted'),
          );
          if (!anyExempted) continue;
          continue;
        }

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

    if (totalWeight === 0) return 0;
    return Math.round((totalWeightedScore / totalWeight) * 100) / 100;
  }

  private buildCategoryBreakdown(
    submissions: any[],
    manualScores: any[],
    categories: SchemeCategory[],
    totalActiveWeight: number,
  ) {
    return categories.map((category) => {
      let rawAverage = 0;
      let manualScore: number | null = null;
      let isAllExempted = false;

      if (isManualScoredCategory(category.type)) {
        const manual = manualScores.find(
          (m) => m.category.toLowerCase() === category.name.toLowerCase(),
        );
        manualScore = manual?.score ?? null;
        if (manualScore != null) {
          rawAverage = manualScore;
        } else {
          isAllExempted = true;
        }
      } else {
        const categorySubs = submissions.filter(
          (s) => s.assessment.type === category.type,
        );

        const nonExemptedSubs = categorySubs.filter(
          (s) => !s.is_exempted && s.status !== 'exempted',
        );
        const exemptedCount = categorySubs.length - nonExemptedSubs.length;

        if (nonExemptedSubs.length > 0) {
          const percentages = nonExemptedSubs.map((s) => {
            const rawScore = s.manual_score ?? s.score ?? 0;
            return s.assessment.total_items > 0
              ? (rawScore / s.assessment.total_items) * 100
              : 0;
          });
          rawAverage =
            percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
        }

        if (exemptedCount > 0 && nonExemptedSubs.length === 0) {
          isAllExempted = true;
        }
      }

      const effectiveWeight =
        totalActiveWeight > 0 && !isAllExempted
          ? Math.round((category.weight / totalActiveWeight) * 10000) / 100
          : null;

      return {
        category: category.name,
        type: category.type,
        // TICK-GRADE-005: the frontend decides whether a column is editable
        // from isManualScored, and labels/clamps it with maxScore. Without
        // these it had to infer editability from a non-null manualScore, which
        // can never bootstrap (no score -> no column -> no way to enter one).
        isManualScored: isManualScoredCategory(category.type),
        maxScore: manualCategoryMax(category),
        weight: category.weight,
        rawAverage: isAllExempted ? null : Math.round(rawAverage * 100) / 100,
        manualScore,
        weightedScore: isAllExempted
          ? null
          : Math.round(rawAverage * category.weight * 100) / 100,
        isAllExempted,
        effectiveWeight,
      };
    });
  }

  private resolveGrade(score: number, ranges: GradeRange[]): string {
    const match = ranges.find(
      (r) => score >= r.minPercent && score <= r.maxPercent,
    );
    return match?.gradeValue ?? 'N/A';
  }

  private async resolveGradingScale(cls: any, orgId: string) {
    const subject = await this.repo.findSubjectLevel(cls.subject_id, orgId);
    if (!subject) return null;

    const programId = subject.program_id;
    if (programId) {
      return this.repo.findGradingScale(programId, cls.school_year_id, orgId);
    }

    throw new NotFoundException(
      'Subject has no program. Cannot determine grading scale.',
    );
  }

  private async resolveTerms(semesterId: string) {
    return this.repo.findTermsBySemester(semesterId);
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
