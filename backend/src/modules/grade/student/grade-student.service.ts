import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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

    // Perf Phase 3: load this student's whole class-term picture in 5 queries
    // (grades, submissions, manuals, assessments, scheme) instead of 5 per
    // term, then assemble per-term rows in memory.
    const termIds = terms.map((t) => t.id);
    const [allGrades, allSubmissions, allManuals, allAssessments, scheme] =
      await Promise.all([
        this.gradeRepo.findByClass(classId, orgId),
        this.gradeRepo.findSubmissionsByStudentInClass(
          classId,
          studentId,
          orgId,
        ),
        this.gradeRepo.findManualScores(classId, '', orgId, studentId, termIds),
        this.gradeRepo.findClassAssessments(classId, orgId),
        this.gradeRepo.findGradingSchemeForClass(classId, orgId),
      ]);

    const gradeByTerm = new Map(
      allGrades
        .filter((g) => g.student_id === studentId)
        .map((g) => [g.term_id, g]),
    );
    const subsByTerm = new Map<string, typeof allSubmissions>();
    for (const sub of allSubmissions) {
      const termId = (sub.assessment as { term_id?: string })?.term_id;
      if (!termId || !termIds.includes(termId)) continue;
      const list = subsByTerm.get(termId);
      if (list) list.push(sub);
      else subsByTerm.set(termId, [sub]);
    }
    const manualsByTerm = new Map<string, typeof allManuals>();
    for (const manual of allManuals) {
      const list = manualsByTerm.get(manual.term_id);
      if (list) list.push(manual);
      else manualsByTerm.set(manual.term_id, [manual]);
    }
    const assessmentsByTerm = new Map<string, typeof allAssessments>();
    for (const assessment of allAssessments) {
      if (!termIds.includes(assessment.term_id)) continue;
      const list = assessmentsByTerm.get(assessment.term_id);
      if (list) list.push(assessment);
      else assessmentsByTerm.set(assessment.term_id, [assessment]);
    }

    const categories = scheme ? componentsToCategories(scheme.components) : [];

    return terms.map((term) => {
      const grade = gradeByTerm.get(term.id);
      const studentSubs = subsByTerm.get(term.id) ?? [];
      const studentManuals = manualsByTerm.get(term.id) ?? [];
      const assessments = assessmentsByTerm.get(term.id) ?? [];

        const totalActiveWeight = categories.reduce((sum, cat) => {
          if (cat.type === 'manual') {
            return studentManuals.some(
              (m) => m.category.toLowerCase() === cat.name.toLowerCase(),
            )
              ? sum + cat.weight
              : sum;
          }
          const catAssessments = assessments.filter((a) => a.type === cat.type);
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
      },
    );
  }
}
