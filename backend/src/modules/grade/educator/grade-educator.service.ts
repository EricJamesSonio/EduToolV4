import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GradeRepository } from '../grade.repository';
import { GradeCoreService, GradeRange } from '../core/grade-core.service';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import { SetManualScoreDto, SetGradeVisibilityDto } from './dto/grade-educator.dto';

function componentsToCategories(components: any[]) {
  return components.map((c) => ({
    name: c.name,
    type: c.type ?? c.name.toLowerCase(),
    weight: c.weight,
  }));
}

@Injectable()
export class GradeEducatorService {
  constructor(
    private readonly repo: GradeRepository,
    private readonly core: GradeCoreService,
    private readonly auditLog: AuditLogService,
  ) {}

  async setGradeVisibility(
    classId: string,
    assessmentId: string,
    orgId: string,
    educatorId: string,
    dto: SetGradeVisibilityDto,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    const updated = await this.repo.setAssessmentVisibility(assessmentId, dto.showBreakdown);

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'grade_visibility_set',
      entityType: 'class',
      entityId: classId,
      metadata: { assessmentId, showBreakdown: dto.showBreakdown },
    });

    return updated;
  }

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
    const terms = await this.repo.findTermsBySemester(cls.semester_id);
    return Promise.all(
      terms.map((term) =>
        this.buildTermResult(classId, term.id, term.name, orgId, cls),
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

    const terms = await this.repo.findTermsBySemester(cls.semester_id);
    const term = terms.find((t) => t.id === termId);
    const termName = term?.name ?? '';

    return this.buildTermResult(classId, termId, termName, orgId, cls);
  }

  /**
   * Recompute grade for a single student after submission.
   * Called automatically on submission finish.
   */
  async recomputeStudentGrade(
    classId: string,
    termId: string,
    studentId: string,
    orgId: string,
  ) {
    const cls = await this.repo.findClassWithSubject(classId, orgId);
    if (!cls) return;

    const [scheme, submissions, allAssessments, manualScores] = await Promise.all([
      this.repo.findGradingSchemeForClass(classId, orgId),
      this.repo.findSubmissionsForTerm(classId, termId, orgId),
      this.repo.findAssessmentsForTerm(classId, termId, orgId),
      this.repo.findManualScores(classId, termId, orgId, studentId),
    ]);

    if (!scheme) return;

    const categories = componentsToCategories(scheme.components);

    const gradingScale = await this.resolveGradingScale(cls, orgId);
    if (!gradingScale) return;
    const ranges = gradingScale.ranges as unknown as GradeRange[];

    const studentSubmissions = submissions.filter((s: any) => s.student_id === studentId);

    const finalScore = this.core.computeWeightedScore(
      studentSubmissions,
      manualScores,
      allAssessments,
      categories,
    );
    const finalGrade = this.core.resolveGrade(finalScore, ranges);

    await this.repo.upsert({ orgId, studentId, classId, termId, finalScore, finalGrade });
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

    const enrolledStudentIds = cls.enrollments.map((e: any) => e.student_id);
    if (enrolledStudentIds.length === 0) {
      return { computed: 0, message: 'No active enrollments.' };
    }

    const scheme = await this.repo.findGradingSchemeForClass(classId, orgId);
    if (!scheme) throw new NotFoundException('No grading scheme found for this class.');
    const categories = componentsToCategories(scheme.components);

    const gradingScale = await this.resolveGradingScale(cls, orgId);
    if (!gradingScale) throw new NotFoundException('No grading scale found for this class.');
    const ranges = gradingScale.ranges as unknown as GradeRange[];

    const [submissions, allAssessments, manualScores] = await Promise.all([
      this.repo.findSubmissionsForTerm(classId, termId, orgId),
      this.repo.findAssessmentsForTerm(classId, termId, orgId),
      this.repo.findManualScores(classId, termId, orgId),
    ]);

    let computed = 0;
    for (const studentId of enrolledStudentIds) {
      const studentSubmissions = submissions.filter((s: any) => s.student_id === studentId);
      const studentManuals = manualScores.filter((m: any) => m.student_id === studentId);

      const finalScore = this.core.computeWeightedScore(
        studentSubmissions,
        studentManuals,
        allAssessments,
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
  ) {
    const enrolledStudentIds: string[] = cls.enrollments.map((e: any) => e.student_id);

    const [submissions, grades, manualScores, allAssessments, scheme, studentProfiles] =
      await Promise.all([
        this.repo.findSubmissionsForTerm(classId, termId, orgId),
        this.repo.findByClassAndTerm(classId, termId, orgId),
        this.repo.findManualScores(classId, termId, orgId),
        this.repo.findAssessmentsForTerm(classId, termId, orgId),
        this.repo.findGradingSchemeForClass(classId, orgId),
        this.repo.findStudentProfiles(enrolledStudentIds),
      ]);

    const categories = scheme ? componentsToCategories(scheme.components) : [];
    const gradeMap = new Map(grades.map((g) => [g.student_id, g]));

    const students = enrolledStudentIds.map((studentId) => {
      const profile = studentProfiles.get(studentId);
      const studentSubs = submissions.filter((s: any) => s.student_id === studentId);
      const studentManuals = manualScores.filter((m: any) => m.student_id === studentId);

      const assessmentScores = studentSubs.map((s: any) => ({
        assessmentId: s.assessment_id,
        type: s.assessment.type,
        score: s.score,
        manualScore: s.manual_score,
        totalItems: s.assessment.total_items,
        status: s.status,
        gradingMode: s.assessment?.grading_mode ?? 'system',
        systemSectionScore: s.system_section_score ?? null,
        manualSectionScore: s.manual_section_score ?? null,
        isMissed: s.is_missed ?? false,
        isExempted: s.is_exempted ?? false,
      }));

      const categoryBreakdown = this.core.buildCategoryBreakdown(
        studentSubs,
        studentManuals,
        allAssessments,
        categories,
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

    return { termId, termName, students };
  }

  private async resolveGradingScale(cls: any, orgId: string) {
    const subject = await this.repo.findSubjectLevel(cls.subject_id, orgId);
    if (!subject) return null;

    const levelId = subject.level_id;

    if (!levelId) {
      throw new NotFoundException(
        'Subject has no level_id. Cannot determine grading scale.',
      );
    }

    return this.repo.findGradingScale(levelId, cls.school_year_id, orgId);
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