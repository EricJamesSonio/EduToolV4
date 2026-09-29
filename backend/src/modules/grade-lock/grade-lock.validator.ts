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

    // 2-4. Student names, scheme, and all term data in parallel. Assessments
    // and submissions load class-wide once (grouped by term in memory)
    // instead of 2 sequential queries per term (Perf Phase 3).
    const [nameMap, scheme, terms, termAssessments, termSubmissions] =
      await Promise.all([
        enrolledIds.length > 0
          ? this.gradeRepo.findStudentProfiles(enrolledIds)
          : Promise.resolve(new Map<string, { name: string; code: string }>()),
        this.gradeRepo.findGradingSchemeForClass(classId, orgId),
        this.gradeRepo.findTemplateTermsByClass(classId, orgId),
        this.gradeRepo.findClassAssessments(classId, orgId),
        this.gradeRepo.findSubmissionsForClass(classId, orgId),
      ]);

    // 3. Grading scheme components (non-optional)
    const nonOptionalComponents =
      scheme?.components?.filter((c: any) => !c.is_optional) ?? [];

    const assessmentsByTerm = new Map<string, typeof termAssessments>();
    const termByAssessment = new Map<string, string>();
    for (const assessment of termAssessments) {
      termByAssessment.set(assessment.id, assessment.term_id);
      const list = assessmentsByTerm.get(assessment.term_id);
      if (list) list.push(assessment);
      else assessmentsByTerm.set(assessment.term_id, [assessment]);
    }
    const submissionsByTerm = new Map<string, typeof termSubmissions>();
    for (const submission of termSubmissions) {
      const termId = termByAssessment.get(submission.assessment_id);
      if (!termId) continue;
      const list = submissionsByTerm.get(termId);
      if (list) list.push(submission);
      else submissionsByTerm.set(termId, [submission]);
    }

    // 5. Track which component categories have at least one assessment
    const coveredCategories = new Set<string>();

    for (const term of terms) {
      const assessments = assessmentsByTerm.get(term.id) ?? [];
      if (assessments.length === 0) continue;

      // Mark covered categories
      for (const a of assessments) {
        coveredCategories.add(a.type);
      }

      // Get submissions for this term
      const submissions = submissionsByTerm.get(term.id) ?? [];

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
              assessmentTitle: assessment.title ?? '',
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
