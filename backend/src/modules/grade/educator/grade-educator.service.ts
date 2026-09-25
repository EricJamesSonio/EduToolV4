import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { GradeRepository } from '../grade.repository';
import { GradeCoreService, GradeRange } from '../core/grade-core.service';
import {
  resolveAssessmentInclusion,
  AssessmentInclusionReason,
} from '../core/assessment-inclusion.util';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';
import {
  SetManualScoreDto,
  SetGradeVisibilityDto,
  SetAssessmentStatusOverrideDto,
} from './dto/grade-educator.dto';

function componentsToCategories(components: any[]) {
  return components.map((c) => ({
    name: c.name,
    type: c.type ?? c.name.toLowerCase(),
    weight: c.weight,
    maxScore: c.max_score ?? c.maxScore ?? null,
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
    const updated = await this.repo.setAssessmentVisibility(
      assessmentId,
      dto.showBreakdown,
    );

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

  async publishByStudent(
    classId: string,
    termId: string,
    studentId: string,
    orgId: string,
    educatorId: string,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    return this.repo.publishByStudent(studentId, termId, orgId);
  }

  async unlockByStudent(
    classId: string,
    termId: string,
    studentId: string,
    orgId: string,
    educatorId: string,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    return this.repo.unlockByStudent(studentId, termId, orgId);
  }

  // ───────── ASSESSMENT STATUS / OVERRIDE (Phase 3) ─────────

  /**
   * Resolve the effective grading status of every assessment in a class for a
   * single student: the submission-derived status, whether it counts toward
   * the grade (Phase 2 inclusion rule ∩ countable states), the reason from the
   * Phase 2 enum, and the override row if one exists. Status model per Phase 3:
   * MISSING/PENDING/SUBMITTED/EXEMPTED mapped onto the include boolean override.
   */
  async getAssessmentStatuses(
    classId: string,
    studentId: string,
    orgId: string,
    educatorId: string,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const enrollment = await this.repo.getActiveEnrollment(
      classId,
      studentId,
      orgId,
    );
    if (!enrollment) {
      throw new NotFoundException(
        'Student is not actively enrolled in this class.',
      );
    }

    const [assessments, submissions, overrides] = await Promise.all([
      this.repo.findClassAssessments(classId, orgId),
      this.repo.findSubmissionsByStudentInClass(classId, studentId, orgId),
      this.repo.findGradingOverridesByClass(classId, orgId),
    ]);

    const subByAssessment = new Map(
      submissions.map((s) => [s.assessment_id, s]),
    );
    const overrideByAssessment = new Map(
      overrides.map((o) => [o.assessment_id, o]),
    );

    return assessments.map((assessment) => {
      const override = overrideByAssessment.get(assessment.id);
      const inclusion = resolveAssessmentInclusion({
        assessmentEffectiveDate:
          assessment.release_date ?? assessment.created_at,
        enrollmentDate: enrollment.created_at,
        override: override ?? null,
        assessmentDeletedAt: null,
      });

      const status = this.resolveAssessmentStatus(
        assessment,
        subByAssessment.get(assessment.id),
      );
      const countsTowardGrade =
        inclusion.included && (status === 'MISSING' || status === 'SUBMITTED');

      const result: any = {
        assessmentId: assessment.id,
        title: assessment.title ?? null,
        effectiveDate: assessment.release_date ?? assessment.created_at,
        status,
        countsTowardGrade,
        reason: inclusion.reason,
      };

      if (override) {
        result.overrideId = override.id;
        result.overrideStatus = override.include ? 'MISSING' : 'EXEMPTED';
        result.overrideReason = override.reason ?? null;
        result.overriddenBy = override.created_by;
        result.overriddenAt = override.updated_at ?? override.created_at;
      }

      return result;
    });
  }

  /**
   * Upsert an override for (assessment, student). EXEMPTED maps to
   * include=false (excluded from grading), MISSING maps to include=true
   * (forces inclusion, counted as 0 if not submitted). PENDING and SUBMITTED
   * are rejected by the DTO — they are system-driven states.
   */
  async setAssessmentStatusOverride(
    classId: string,
    assessmentId: string,
    studentId: string,
    orgId: string,
    educatorId: string,
    dto: SetAssessmentStatusOverrideDto,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const assessment = await this.repo.findAssessmentInClass(
      assessmentId,
      classId,
      orgId,
    );
    if (!assessment)
      throw new NotFoundException('Assessment not found in this class.');

    const enrollment = await this.repo.getActiveEnrollment(
      classId,
      studentId,
      orgId,
    );
    if (!enrollment)
      throw new NotFoundException(
        'Student is not actively enrolled in this class.',
      );

    const previous = await this.repo.findAssessmentOverride(
      assessmentId,
      studentId,
      orgId,
    );
    const previousStatus = previous
      ? previous.include
        ? 'MISSING'
        : 'EXEMPTED'
      : null;

    // MISSING forces inclusion; EXEMPTED excludes — mirroring Phase 3 rules.
    const include = dto.overrideStatus === 'MISSING';
    const saved = await this.repo.upsertAssessmentOverride({
      orgId,
      assessmentId,
      studentId,
      include,
      reason: dto.reason ?? null,
      createdBy: educatorId,
    });

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'assessment_status_override',
      entityType: 'class',
      entityId: classId,
      metadata: {
        assessmentId,
        studentId,
        previousStatus,
        newStatus: dto.overrideStatus,
        reason: dto.reason ?? null,
      },
    });

    return {
      overrideId: saved.id,
      overrideStatus: saved.include ? 'MISSING' : 'EXEMPTED',
      overrideReason: saved.reason ?? null,
      overriddenBy: saved.created_by,
      overriddenAt: saved.updated_at ?? saved.created_at,
    };
  }

  async deleteAssessmentStatusOverride(
    classId: string,
    assessmentId: string,
    studentId: string,
    orgId: string,
    educatorId: string,
  ) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);

    const enrollment = await this.repo.getActiveEnrollment(
      classId,
      studentId,
      orgId,
    );
    if (!enrollment)
      throw new NotFoundException(
        'Student is not actively enrolled in this class.',
      );

    const previous = await this.repo.findAssessmentOverride(
      assessmentId,
      studentId,
      orgId,
    );
    const previousStatus = previous
      ? previous.include
        ? 'MISSING'
        : 'EXEMPTED'
      : null;

    const deleted = await this.repo.deleteAssessmentOverride(
      assessmentId,
      studentId,
      orgId,
    );

    await this.auditLog.logActivityEvent({
      orgId,
      actorId: educatorId,
      action: 'assessment_status_override_deleted',
      entityType: 'class',
      entityId: classId,
      metadata: {
        assessmentId,
        studentId,
        previousStatus,
        newStatus: null,
        reason: previous?.reason ?? null,
      },
    });

    return { deleted: deleted.count };
  }

  /**
   * Map a submission (+ assessment dates) onto the Phase 3 status model.
   * Draft / not-yet-released work is PENDING; overdue non-submission is
   * MISSING; exempted/missed/custom/submitted states follow their row flags.
   */
  private resolveAssessmentStatus(
    assessment: any,
    submission?: any,
    now: Date = new Date(),
  ): 'MISSING' | 'PENDING' | 'SUBMITTED' | 'EXEMPTED' {
    if (!submission) {
      if (assessment.end_date && now > new Date(assessment.end_date))
        return 'MISSING';
      return 'PENDING';
    }
    if (submission.is_exempted || submission.status === 'exempted')
      return 'EXEMPTED';
    if (submission.is_missed) return 'MISSING';
    if (
      submission.status === 'submitted' ||
      submission.status === 'custom' ||
      submission.score != null ||
      submission.manual_score != null ||
      submission.manual_section_score != null ||
      submission.system_section_score != null
    ) {
      return 'SUBMITTED';
    }
    return 'PENDING'; // draft in progress
  }

  async registerAssessmentForAllStudents(
    assessmentId: string,
    classId: string,
    orgId: string,
  ) {
    return this.repo.registerAssessmentForAllStudents(
      assessmentId,
      classId,
      orgId,
    );
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

    const terms = await this.repo.findTemplateTermsByClass(classId, orgId);

    // Perf Phase 2: class-level invariants are identical for every term, so
    // fetch them once and build each term in parallel instead of awaiting
    // T sequential 8-query buildTermResult() calls.
    const enrolledStudentIds: string[] = cls.enrollments.map(
      (e: any) => e.student_id,
    );
    const [scheme, enrollmentDates, overrides, studentProfiles] =
      await Promise.all([
        this.repo.findGradingSchemeForClass(classId, orgId),
        this.repo.findEnrollmentDatesByClass(classId, orgId),
        this.repo.findGradingOverridesByClass(classId, orgId),
        this.repo.findStudentProfiles(enrolledStudentIds),
      ]);
    const shared = this.buildSharedTermContext(
      scheme,
      enrollmentDates,
      overrides,
      studentProfiles,
    );

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

  async getTermOptions(classId: string, orgId: string, educatorId: string) {
    await this.assertEducatorOwnsClass(classId, orgId, educatorId);
    const terms = await this.repo.findTemplateTermsByClass(classId, orgId);
    return terms.map((t) => ({
      termId: t.id,
      termName: t.name,
      semesterName: t.semesterName,
    }));
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

    const existing = await this.repo.findByStudent(
      studentId,
      classId,
      termId,
      orgId,
    );
    if (existing?.is_locked) {
      await this.auditLog.logActivityEvent({
        orgId,
        actorId: 'system',
        action: 'grade_recompute_skipped_locked',
        entityType: 'class',
        entityId: classId,
        metadata: {
          termId,
          studentId,
          existingFinalScore: existing.final_score,
          existingFinalGrade: existing.final_grade,
        },
      });
      return;
    }

    const [
      scheme,
      submissions,
      allAssessments,
      manualScores,
      enrollmentDates,
      overrides,
    ] = await Promise.all([
      this.repo.findGradingSchemeForClass(classId, orgId),
      this.repo.findSubmissionsForTerm(classId, termId, orgId),
      this.repo.findAssessmentsForTerm(classId, termId, orgId),
      this.repo.findManualScores(classId, termId, orgId, studentId),
      this.repo.findEnrollmentDatesByClass(classId, orgId),
      this.repo.findGradingOverridesByClass(classId, orgId),
    ]);

    if (!scheme) return;

    const categories = componentsToCategories(scheme.components);

    const gradingScale = await this.resolveGradingScale(cls, orgId);
    if (!gradingScale) return;
    const ranges = gradingScale.ranges as unknown as GradeRange[];

    const studentSubmissions = submissions.filter(
      (s: any) => s.student_id === studentId,
    );

    const { excludedAssessmentIds } = this.buildInclusionMaps(
      allAssessments,
      new Map(enrollmentDates.map((e) => [e.student_id, e.created_at])),
      new Map(overrides.map((o) => [`${o.assessment_id}:${o.student_id}`, o])),
      studentId,
    );

    const finalScore = this.core.computeWeightedScore(
      studentSubmissions,
      manualScores,
      allAssessments,
      categories,
      { excludedAssessmentIds },
    );
    const finalGrade = this.core.resolveGrade(finalScore, ranges);

    await this.repo.upsert({
      orgId,
      studentId,
      classId,
      termId,
      finalScore,
      finalGrade,
    });
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
    if (!scheme)
      throw new NotFoundException('No grading scheme found for this class.');
    const categories = componentsToCategories(scheme.components);

    const gradingScale = await this.resolveGradingScale(cls, orgId);
    if (!gradingScale)
      throw new NotFoundException('No grading scale found for this class.');
    const ranges = gradingScale.ranges as unknown as GradeRange[];

    const [
      submissions,
      allAssessments,
      manualScores,
      enrollmentDates,
      overrides,
    ] = await Promise.all([
      this.repo.findSubmissionsForTerm(classId, termId, orgId),
      this.repo.findAssessmentsForTerm(classId, termId, orgId),
      this.repo.findManualScores(classId, termId, orgId),
      this.repo.findEnrollmentDatesByClass(classId, orgId),
      this.repo.findGradingOverridesByClass(classId, orgId),
    ]);

    // Perf Phase 2: group once + hoist inclusion maps out of the per-student
    // loop (previously rebuilt per student), then persist in one batched
    // repository call instead of N sequential upserts.
    const subsByStudent = new Map<string, any[]>();
    for (const sub of submissions) {
      const list = subsByStudent.get(sub.student_id);
      if (list) list.push(sub);
      else subsByStudent.set(sub.student_id, [sub]);
    }
    const manualsByStudent = new Map<string, any[]>();
    for (const manual of manualScores) {
      const list = manualsByStudent.get(manual.student_id);
      if (list) list.push(manual);
      else manualsByStudent.set(manual.student_id, [manual]);
    }
    const enrollmentDateByStudent = new Map(
      enrollmentDates.map((e) => [e.student_id, e.created_at]),
    );
    const overridesByKey = new Map(
      overrides.map((o) => [`${o.assessment_id}:${o.student_id}`, o]),
    );

    const rows = enrolledStudentIds.map((studentId) => {
      const studentSubmissions = subsByStudent.get(studentId) ?? [];
      const studentManuals = manualsByStudent.get(studentId) ?? [];

      const { excludedAssessmentIds } = this.buildInclusionMaps(
        allAssessments,
        enrollmentDateByStudent,
        overridesByKey,
        studentId,
      );

      const finalScore = this.core.computeWeightedScore(
        studentSubmissions,
        studentManuals,
        allAssessments,
        categories,
        { excludedAssessmentIds },
      );
      const finalGrade = this.core.resolveGrade(finalScore, ranges);

      return { studentId, finalScore, finalGrade };
    });

    const { computed, skippedLocked } = await this.repo.saveComputedGrades({
      orgId,
      classId,
      termId,
      rows,
    });

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

  // Resolve which assessments are excluded for a single student by the
  // late-enrollment rule. Returns the ids to drop from grading plus the
  // per-assessment reason (Phase 2) for display in the UI.
  private buildInclusionMaps(
    allAssessments: any[],
    enrollmentDatesByStudent: Map<string, Date>,
    overridesByKey: Map<string, { include: boolean }>,
    studentId: string,
  ): {
    excludedAssessmentIds: Set<string>;
    reasons: Map<string, AssessmentInclusionReason>;
  } {
    const excludedAssessmentIds = new Set<string>();
    const reasons = new Map<string, AssessmentInclusionReason>();

    for (const assessment of allAssessments) {
      const decision = resolveAssessmentInclusion({
        assessmentEffectiveDate:
          assessment.release_date ?? assessment.created_at,
        enrollmentDate: enrollmentDatesByStudent.get(studentId),
        override: overridesByKey.get(`${assessment.id}:${studentId}`) ?? null,
        assessmentDeletedAt: assessment.deleted_at ?? null,
      });
      reasons.set(assessment.id, decision.reason);
      if (!decision.included) excludedAssessmentIds.add(assessment.id);
    }

    return { excludedAssessmentIds, reasons };
  }

  // Class-level data shared across every term of a getGradesByClass() call.
  // Built once; buildTermResult() falls back to per-term fetching when absent
  // (single-term path via getGradesByTerm()).
  private buildSharedTermContext(
    scheme: any,
    enrollmentDates: any[],
    overrides: any[],
    studentProfiles: Map<string, { name: string; code: string }>,
  ) {
    return {
      scheme,
      studentProfiles,
      enrollmentDateByStudent: new Map(
        enrollmentDates.map((e) => [e.student_id, e.created_at]),
      ),
      overridesByKey: new Map(
        overrides.map((o) => [`${o.assessment_id}:${o.student_id}`, o]),
      ),
    };
  }

  private async buildTermResult(
    classId: string,
    termId: string,
    termName: string,
    orgId: string,
    cls: any,
    semesterInfo?: { id: string; name: string },
    shared?: ReturnType<GradeEducatorService['buildSharedTermContext']>,
  ) {
    const enrolledStudentIds: string[] = cls.enrollments.map(
      (e: any) => e.student_id,
    );

    // Term-level data always varies by term; class-level data is reused when
    // the caller hoisted it (getGradesByClass) and fetched otherwise.
    const [submissions, grades, manualScores, allAssessments] =
      await Promise.all([
        this.repo.findSubmissionsForTerm(classId, termId, orgId),
        this.repo.findByClassAndTerm(classId, termId, orgId),
        this.repo.findManualScores(classId, termId, orgId),
        this.repo.findAssessmentsForTerm(classId, termId, orgId),
      ]);

    let scheme: any;
    let studentProfiles: Map<string, { name: string; code: string }>;
    let enrollmentDateByStudent: Map<string, Date>;
    let overridesByKey: Map<string, { include: boolean }>;
    if (shared) {
      ({ scheme, studentProfiles, enrollmentDateByStudent, overridesByKey } =
        shared);
    } else {
      const [fetchedScheme, enrollmentDates, overrides, fetchedProfiles] =
        await Promise.all([
          this.repo.findGradingSchemeForClass(classId, orgId),
          this.repo.findEnrollmentDatesByClass(classId, orgId),
          this.repo.findGradingOverridesByClass(classId, orgId),
          this.repo.findStudentProfiles(enrolledStudentIds),
        ]);
      const ctx = this.buildSharedTermContext(
        fetchedScheme,
        enrollmentDates,
        overrides,
        fetchedProfiles,
      );
      scheme = ctx.scheme;
      studentProfiles = ctx.studentProfiles;
      enrollmentDateByStudent = ctx.enrollmentDateByStudent;
      overridesByKey = ctx.overridesByKey;
    }

    const categories = scheme ? componentsToCategories(scheme.components) : [];
    const gradeMap = new Map(grades.map((g) => [g.student_id, g]));

    // Perf Phase 2: group term rows once instead of filter()/some() per
    // student (O(S²·A) → O(S·A)) and group assessments by type once.
    const subsByStudent = new Map<string, any[]>();
    for (const sub of submissions) {
      const list = subsByStudent.get(sub.student_id);
      if (list) list.push(sub);
      else subsByStudent.set(sub.student_id, [sub]);
    }
    const manualsByStudent = new Map<string, any[]>();
    for (const manual of manualScores) {
      const list = manualsByStudent.get(manual.student_id);
      if (list) list.push(manual);
      else manualsByStudent.set(manual.student_id, [manual]);
    }
    const assessmentsByType = new Map<string, any[]>();
    for (const assessment of allAssessments) {
      const list = assessmentsByType.get(assessment.type);
      if (list) list.push(assessment);
      else assessmentsByType.set(assessment.type, [assessment]);
    }

    const students = enrolledStudentIds.map((studentId) => {
      const profile = studentProfiles.get(studentId);
      const studentSubs = subsByStudent.get(studentId) ?? [];
      const studentManuals = manualsByStudent.get(studentId) ?? [];

      const submittedAssessmentIds = new Set(
        studentSubs.map((s: any) => s.assessment_id),
      );

      const assessmentScores: any[] = studentSubs.map((s: any) => ({
        assessmentId: s.assessment_id,
        submissionId: s.id,
        type: s.assessment.type,
        title: s.assessment.title ?? null,
        score: s.score,
        manualScore: s.manual_score,
        totalItems: s.assessment.total_items,
        status: s.status,
        gradingMode: s.assessment?.grading_mode ?? 'system',
        systemSectionScore: s.system_section_score ?? null,
        manualSectionScore: s.manual_section_score ?? null,
        isMissed: s.is_missed ?? false,
        isExempted: s.is_exempted ?? false,
        created_at: s.assessment.created_at ?? null,
      }));

      // Include all non-deleted assessments the student hasn't submitted to
      for (const assessment of allAssessments) {
        if (!submittedAssessmentIds.has(assessment.id)) {
          assessmentScores.push({
            assessmentId: assessment.id,
            submissionId: null,
            type: assessment.type,
            title: assessment.title ?? null,
            score: null,
            manualScore: null,
            totalItems: assessment.total_items ?? 0,
            status: 'not_started',
            gradingMode: assessment.grading_mode ?? 'system',
            systemSectionScore: null,
            manualSectionScore: null,
            isMissed: false,
            isExempted: false,
            created_at: assessment.created_at ?? null,
          });
        }
      }

      // Late-enrollment rule: which assessments count for this student, and why.
      const { excludedAssessmentIds, reasons } = this.buildInclusionMaps(
        allAssessments,
        enrollmentDateByStudent,
        overridesByKey,
        studentId,
      );
      for (const scoreEntry of assessmentScores) {
        scoreEntry.included = !excludedAssessmentIds.has(
          scoreEntry.assessmentId,
        );
        scoreEntry.inclusionReason =
          reasons.get(scoreEntry.assessmentId) ?? 'included';
      }

      // Compute total active weight (sum of weights of categories with at least one valid score)
      // Perf Phase 2: pre-grouped assessments + per-student active-id set
      // instead of filter().some().some() nesting.
      const activeSubAssessmentIds = new Set(
        studentSubs
          .filter((s: any) => s.status !== 'exempted' && !s.is_exempted)
          .map((s: any) => s.assessment_id),
      );
      const totalActiveWeight = categories.reduce((sum, cat) => {
        if (cat.type === 'manual') {
          return studentManuals.some(
            (m) => m.category.toLowerCase() === cat.name.toLowerCase(),
          )
            ? sum + cat.weight
            : sum;
        }
        const catAssessments = assessmentsByType.get(cat.type) ?? [];
        const hasActive = catAssessments.some((a) =>
          activeSubAssessmentIds.has(a.id),
        );
        return hasActive ? sum + cat.weight : sum;
      }, 0);

      const categoryBreakdown = this.core.buildCategoryBreakdown(
        studentSubs,
        studentManuals,
        allAssessments,
        categories,
        totalActiveWeight,
        { excludedAssessmentIds },
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
