import { Injectable, ForbiddenException } from '@nestjs/common';
import { GradeLockRepository } from './grade-lock.repository';
import { GradeRepository } from '../grade/grade.repository';

export interface GradeEditCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface GradeEditCheckInput {
  classId: string;
  userId: string;
  userRole: string; // 'admin' | 'educator' | 'student'
  orgId: string;
}

export interface ReadinessIssue {
  type: 'missing_submission' | 'missing_category_assessment';
  termId?: string;
  termName?: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  assessmentId?: string;
  assessmentTitle?: string;
  category?: string;
}

export interface ReadinessValidationResult {
  ready: boolean;
  issues: ReadinessIssue[];
}

@Injectable()
export class GradeLockValidator {
  constructor(
    private readonly repo: GradeLockRepository,
    private readonly gradeRepo: GradeRepository,
  ) {}

  async canEditGrades(
    input: GradeEditCheckInput,
  ): Promise<GradeEditCheckResult> {
    const { classId, userRole } = input;

    const gradeLock = await this.repo.findLockByClassId(classId);

    // No lock assigned — editing always allowed
    if (!gradeLock) return { allowed: true };

    if (gradeLock.is_locked) {
      if (userRole === 'admin') return { allowed: true };
      return { allowed: false, reason: 'Class is locked by administrator' };
    }

    const { setting } = gradeLock;

    // Check absolute deadline
    if (setting.lock_deadline) {
      const deadlinePassed = new Date() > setting.lock_deadline;
      if (deadlinePassed) {
        if (userRole === 'admin') return { allowed: true };
        return {
          allowed: false,
          reason: `Grading deadline has passed (${setting.lock_deadline.toISOString()}). Contact administrator for override.`,
        };
      }
    }

    return { allowed: true };
  }

  async assertCanEditGrades(input: GradeEditCheckInput): Promise<void> {
    const result = await this.canEditGrades(input);
    if (!result.allowed) {
      throw new ForbiddenException(
        result.reason ?? 'Cannot edit grades at this time',
      );
    }
  }

  async validateReadiness(
    classId: string,
    orgId: string,
  ): Promise<ReadinessValidationResult> {
    const issues: ReadinessIssue[] = [];

    // 1. Class & enrollments
    const cls = await this.gradeRepo.findClassWithSubject(classId, orgId);
    if (!cls) return { ready: true, issues: [] };

    const enrolledIds = cls.enrollments.map((e: any) => e.student_id);

    // 2. Build student name map
    const nameMap =
      enrolledIds.length > 0
        ? await this.gradeRepo.findStudentProfiles(enrolledIds)
        : new Map<string, { name: string; code: string }>();

    // 3. Grading scheme components (non-optional)
    const scheme = await this.gradeRepo.findGradingSchemeForClass(
      classId,
      orgId,
    );
    const nonOptionalComponents =
      scheme?.components?.filter((c: any) => !c.is_optional) ?? [];

    // 4. All terms for this class
    const terms = await this.gradeRepo.findTemplateTermsByClass(classId, orgId);

    // 5. Track which component categories have at least one assessment
    const coveredCategories = new Set<string>();

    for (const term of terms) {
      const assessments = await this.gradeRepo.findAssessmentsForTerm(
        classId,
        term.id,
        orgId,
      );
      if (assessments.length === 0) continue;

      // Mark covered categories
      for (const a of assessments) {
        coveredCategories.add(a.type);
      }

      // Build assessment id → title map
      const assessmentMap = new Map(assessments.map((a: any) => [a.id, a]));

      // Get submissions for this term
      const submissions = await this.gradeRepo.findSubmissionsForTerm(
        classId,
        term.id,
        orgId,
      );

      // Group non-draft submissions by (student_id, assessment_id)
      const nonDraftSubs = new Set<string>();
      for (const s of submissions) {
        if (s.status !== 'draft') {
          nonDraftSubs.add(`${s.student_id}|${s.assessment_id}`);
        }
      }

      // Check each student has a submission for each assessment
      for (const studentId of enrolledIds) {
        const studentInfo = nameMap.get(studentId);
        const studentName = studentInfo?.name ?? 'Unknown';
        const studentCode = studentInfo?.code ?? '';

        for (const assessment of assessments) {
          if (!nonDraftSubs.has(`${studentId}|${assessment.id}`)) {
            issues.push({
              type: 'missing_submission',
              termId: term.id,
              termName: term.name,
              studentId,
              studentName,
              studentCode,
              assessmentId: assessment.id,
              assessmentTitle: assessment.title,
            });
          }
        }
      }
    }

    // 6. Check non-optional grading scheme categories have at least one assessment
    for (const component of nonOptionalComponents) {
      if (!coveredCategories.has(component.type)) {
        issues.push({
          type: 'missing_category_assessment',
          category: component.type,
        });
      }
    }

    return { ready: issues.length === 0, issues };
  }
}
