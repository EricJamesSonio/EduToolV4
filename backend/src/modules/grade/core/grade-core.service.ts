import { Injectable } from '@nestjs/common';

export interface SchemeCategory {
  name: string;
  type: string;
  weight: number;
}

export type RubricCategory = SchemeCategory;

export interface GradeRange {
  minPercent: number;
  maxPercent: number;
  gradeValue: string;
  remark: string;
  isPassing: boolean;
}

@Injectable()
export class GradeCoreService {
  /**
   * Compute weighted score for a student considering ALL assessments in the term.
   * Missing assessments (no submission or draft) count as 0.
   * Exempted submissions are skipped entirely.
   * Hybrid assessments use system_section_score + manual_section_score.
   */
  computeWeightedScore(
    studentSubmissions: any[],
    studentManualScores: any[],
    allAssessments: any[],
    categories: SchemeCategory[],
  ): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const category of categories) {
      const weight = category.weight;

      if (category.type === 'manual') {
        const manual = studentManualScores.find(
          (m) => m.category.toLowerCase() === category.name.toLowerCase(),
        );
        if (manual !== undefined) {
          totalWeightedScore += manual.score * weight;
          totalWeight += weight;
        }
      } else {
        const categoryAssessments = allAssessments.filter(
          (a) => a.type === category.type && a.is_published,
        );
        if (categoryAssessments.length === 0) continue;

        const percentages: number[] = [];
        for (const assessment of categoryAssessments) {
          const sub = studentSubmissions.find(
            (s) => s.assessment_id === assessment.id,
          );
          if (!sub || sub.status === 'draft') {
            percentages.push(0);
          } else if (sub.status === 'exempted' || sub.is_exempted) {
            continue;
          } else if (sub.is_missed) {
            percentages.push(0);
          } else {
            const rawScore = this.mergeHybridScores(sub);
            const effectiveTotal =
              assessment.grading_mode === 'manual'
                ? (assessment.manual_max_score ?? 1)
                : assessment.total_items;
            const pct =
              effectiveTotal > 0
                ? (rawScore / effectiveTotal) * 100
                : 0;
            percentages.push(pct);
          }
        }

        if (percentages.length > 0) {
          const average =
            percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
          totalWeightedScore += average * weight;
          totalWeight += weight;
        }
      }
    }

    if (totalWeight === 0) return 0;
    return Math.round((totalWeightedScore / totalWeight) * 100) / 100;
  }

  /**
   * Merge hybrid scores: for hybrid grading, use system + manual section scores.
   * Otherwise use manual_score ?? score.
   */
  mergeHybridScores(submission: any): number {
    if (submission.assessment?.grading_mode === 'hybrid' || submission.manual_section_score != null) {
      return (submission.system_section_score ?? 0) + (submission.manual_section_score ?? 0);
    }
    return submission.manual_score ?? submission.score ?? 0;
  }

  buildCategoryBreakdown(
    studentSubmissions: any[],
    studentManualScores: any[],
    allAssessments: any[],
    categories: SchemeCategory[],
  ) {
    return categories.map((category) => {
      let rawAverage = 0;
      let manualScore: number | null = null;

      if (category.type === 'manual') {
        const manual = studentManualScores.find(
          (m) => m.category.toLowerCase() === category.name.toLowerCase(),
        );
        manualScore = manual?.score ?? null;
        rawAverage = manualScore ?? 0;
      } else {
        const categoryAssessments = allAssessments.filter(
          (a) => a.type === category.type && a.is_published,
        );
        if (categoryAssessments.length > 0) {
          const percentages: number[] = [];
          for (const assessment of categoryAssessments) {
            const sub = studentSubmissions.find(
              (s) => s.assessment_id === assessment.id,
            );
            if (!sub || sub.status === 'draft') {
              percentages.push(0);
            } else if (sub.status === 'exempted' || sub.is_exempted) {
              continue;
            } else if (sub.is_missed) {
              percentages.push(0);
            } else {
              const rawScore = this.mergeHybridScores(sub);
              const effectiveTotal =
                assessment.grading_mode === 'manual'
                  ? (assessment.manual_max_score ?? 1)
                  : assessment.total_items;
              const pct =
                effectiveTotal > 0
                  ? (rawScore / effectiveTotal) * 100
                  : 0;
              percentages.push(pct);
            }
          }
          if (percentages.length > 0) {
            rawAverage =
              percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
          }
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

  resolveGrade(score: number, ranges: GradeRange[]): string {
    const match = ranges.find(
      (r) => score >= r.minPercent && score <= r.maxPercent,
    );
    return match?.gradeValue ?? 'N/A';
  }
}