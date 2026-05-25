import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GradeRepository } from './grade.repository';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SetManualScoreDto } from './dto/grade.dto';

// TODO: Add a `type` column to GradingSchemeComponent in schema.prisma
// (e.g. type String @default("manual")) so components can map to assessment.type.
// Until then, component.name.toLowerCase() is used as the type discriminator.
interface SchemeCategory {
  name: string;    // e.g. "Quiz", "Exam", "Activity"
  type: string;    // maps to assessment.type: quiz | exam | activity | manual
  weight: number;  // e.g. 0.3 = 30%
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
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    const cls = await this.repo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const semesters = await this.repo.findSemestersBySchoolYear(cls.school_year_id);
    const results: any[] = [];
    for (const semester of semesters) {
      const terms = await this.repo.findTermsBySemester(semester.id);
      for (const term of terms) {
        const termResult = await this.buildTermResult(
          classId, term.id, term.name, orgId, cls,
          { id: semester.id, name: semester.name },
        );
        results.push(termResult);
      }
    }
    return results;
  }

  async getGradesByTerm(classId: string, termId: string, orgId: string, educatorId: string) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    const cls = await this.repo.findClassWithSubject(classId, orgId);
    if (!cls) throw new NotFoundException('Class not found.');

    const semesters = await this.repo.findSemestersBySchoolYear(cls.school_year_id);
    let semesterInfo: { id: string; name: string } | undefined;
    let termName = '';
    for (const s of semesters) {
      const terms = await this.repo.findTermsBySemester(s.id);
      const found = terms.find((t: any) => t.id === termId);
      if (found) {
        termName = found.name;
        semesterInfo = { id: s.id, name: s.name };
        break;
      }
    }

    return this.buildTermResult(classId, termId, termName, orgId, cls, semesterInfo);
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
    if (!scheme) throw new NotFoundException('No grading scheme found for this class.');
    const categories = componentsToCategories(scheme.components);

    const gradingScale = await this.resolveGradingScale(cls, orgId);
    if (!gradingScale) throw new NotFoundException('No grading scale found for this class.');
    const ranges = gradingScale.ranges as unknown as GradeRange[];

    const submissions = await this.repo.findSubmissionsForTerm(classId, termId, orgId);
    const manualScores = await this.repo.findManualScores(classId, termId, orgId);

    let computed = 0;
    for (const studentId of enrolledStudentIds) {
      const studentSubmissions = submissions.filter((s) => s.student_id === studentId);
      const studentManuals = manualScores.filter((m) => m.student_id === studentId);

      const finalScore = this.computeWeightedScore(
        studentSubmissions,
        studentManuals,
        categories,
      );
      const finalGrade = this.resolveGrade(finalScore, ranges);

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

  private async buildTermResult(
    classId: string,
    termId: string,
    termName: string,
    orgId: string,
    cls: any,
    semesterInfo?: { id: string; name: string },
  ) {
    const enrolledStudentIds: string[] = cls.enrollments.map((e: any) => e.student_id);

    const [submissions, grades, manualScores, scheme, studentProfiles] = await Promise.all([
      this.repo.findSubmissionsForTerm(classId, termId, orgId),
      this.repo.findByClassAndTerm(classId, termId, orgId),
      this.repo.findManualScores(classId, termId, orgId),
      this.repo.findGradingSchemeForClass(classId, orgId),
      this.repo.findStudentProfiles(enrolledStudentIds),   // ← new
    ]);

    const categories = scheme ? componentsToCategories(scheme.components) : [];
    const gradeMap = new Map(grades.map((g) => [g.student_id, g]));

    const students = enrolledStudentIds.map((studentId) => {
      const profile = studentProfiles.get(studentId);   // ← new
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
        studentName: profile?.name ?? 'Unknown',    // ← new
        studentCode: profile?.code ?? '',            // ← new
        grade: gradeMap.get(studentId) ?? null,
        assessmentScores,
        categoryBreakdown,
      };
    });

    return {
      termId,
      termName,
      students,
      ...(semesterInfo ? { semesterId: semesterInfo.id, semesterName: semesterInfo.name } : {}),
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

      if (category.type === 'manual') {
        const manual = manualScores.find(
          (m) => m.category.toLowerCase() === category.name.toLowerCase(),
        );
        if (manual !== undefined) {
          totalWeightedScore += manual.score * weight;
          totalWeight += weight;
        }
      } else {
        const categorySubs = submissions.filter(
          (s) => s.assessment.type === category.type,
        );
        if (categorySubs.length === 0) continue;

        const percentages = categorySubs.map((s) => {
          const rawScore = s.manual_score ?? s.score ?? 0;
          const totalItems = s.assessment.total_items;
          return totalItems > 0 ? (rawScore / totalItems) * 100 : 0;
        });
        const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
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
          rawAverage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
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