import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GradeRepository } from '../grade.repository';
import { EnrollmentRepository } from 'src/modules/enrollment/enrollment.repository';
import { GradeCoreService, SchemeCategory } from '../core/grade-core.service';

function componentsToCategories(components: any[]): SchemeCategory[] {
  return components.map((c) => ({
    name: c.name,
    type: c.type ?? c.name.toLowerCase(),
    weight: c.weight,
    maxScore: c.max_score ?? c.maxScore ?? null,
  }));
}

@Injectable()
export class GradeStudentService {
  constructor(
    private readonly gradeRepo: GradeRepository,
    private readonly enrollmentRepo: EnrollmentRepository,
    private readonly core: GradeCoreService,
  ) {}

  async getMyGrades(classId: string, studentId: string, orgId: string) {
    const enrollment = await this.enrollmentRepo.findOneByStudentAndClass(
      classId,
      studentId,
      orgId,
    );

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this class.');
    }

    const cls = await this.gradeRepo.findClassWithSubject(classId, orgId);
    if (!cls) {
      throw new NotFoundException('Class not found.');
    }

    const terms = await this.gradeRepo.findTemplateTermsByClass(classId, orgId);

    // If the template has no terms (or can't be resolved), fall back to showing
    // whatever grade rows exist for this student (legacy behavior).
    if (terms.length === 0) {
      const grades = await this.gradeRepo.findByClass(classId, orgId);
      return grades
        .filter((g) => g.student_id === studentId)
        .map((g) => ({
          termId: g.term_id,
          termName: '',
          finalScore: g.final_score,
          finalGrade: g.is_locked ? g.final_grade : null,
          isReleased: g.is_locked,
          categoryBreakdown: [] as any[],
        }));
    }

    const results = await Promise.all(
      terms.map(async (term) => {
        const [grade, submissions, manualScores, assessments, scheme] =
          await Promise.all([
            this.gradeRepo.findByStudent(studentId, classId, term.id, orgId),
            this.gradeRepo.findSubmissionsForTerm(classId, term.id, orgId),
            this.gradeRepo.findManualScores(classId, term.id, orgId),
            this.gradeRepo.findAssessmentsForTerm(classId, term.id, orgId),
            this.gradeRepo.findGradingSchemeForClass(classId, orgId),
          ]);

        const studentSubs = submissions.filter(
          (s) => s.student_id === studentId,
        );
        const studentManuals = manualScores.filter(
          (m) => m.student_id === studentId,
        );

        const categories = scheme
          ? componentsToCategories(scheme.components)
          : [];

        const totalActiveWeight = categories.reduce((sum, cat) => {
          if (cat.type === 'manual') {
            return studentManuals.some(
              (m) => m.category.toLowerCase() === cat.name.toLowerCase(),
            )
              ? sum + cat.weight
              : sum;
          }
          const catAssessments = assessments.filter(
            (a) => a.type === cat.type,
          );
          const hasActive = catAssessments.some((a) =>
            studentSubs.some(
              (s) =>
                s.assessment_id === a.id &&
                s.status !== 'exempted' &&
                !s.is_exempted,
            ),
          );
          return hasActive ? sum + cat.weight : sum;
        }, 0);

        const categoryBreakdown = this.core.buildCategoryBreakdown(
          studentSubs,
          studentManuals,
          assessments,
          categories,
          totalActiveWeight,
        );

        return {
          termId: term.id,
          termName: term.name,
          semesterName: term.semesterName,
          semesterIndex: term.semesterIndex,
          finalScore: grade?.final_score ?? null,
          finalGrade: grade?.is_locked ? grade.final_grade : null,
          isReleased: grade?.is_locked ?? false,
          categoryBreakdown,
        };
      }),
    );

    return results;
  }
}