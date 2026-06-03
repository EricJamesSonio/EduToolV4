import { Injectable } from '@nestjs/common';

export interface SchemeCategory {
  name: string;
  type: string;
  weight: number;
  maxScore?: number | null;
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
          (a) => a.type === category.type,
        );
        if (categoryAssessments.length === 0) continue;

        if (category.maxScore != null && category.maxScore > 0) {
          let totalRawScore = 0;
          for (const assessment of categoryAssessments) {
            const sub = studentSubmissions.find(
              (s) => s.assessment_id === assessment.id,
            );
            if (!sub) continue;
            if (sub.status === 'exempted' || sub.is_exempted) continue;
            if (sub.is_missed) continue;
            totalRawScore += this.mergeHybridScores(sub);
          }
          const average = (totalRawScore / category.maxScore) * 100;
          totalWeightedScore += average * weight;
          totalWeight += weight;
        } else {
          const percentages: number[] = [];
          for (const assessment of categoryAssessments) {
            const sub = studentSubmissions.find(
              (s) => s.assessment_id === assessment.id,
            );
            if (!sub) {
              percentages.push(0);
            } else if (sub.status === 'exempted' || sub.is_exempted) {
              continue;
            } else if (sub.is_missed) {
              percentages.push(0);
            } else {
              const rawScore = this.mergeHybridScores(sub);
              const effectiveTotal =
                assessment.grading_mode === 'manual'
                  ? (assessment.manual_max_score ?? assessment.total_items ?? 1)
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
    totalActiveWeight: number,
  ) {
    return categories.map((category) => {
      let rawAverage = 0;
      let manualScore: number | null = null;
      let isAllExempted = false;

      if (category.type === 'manual') {
        const manual = studentManualScores.find(
          (m) => m.category.toLowerCase() === category.name.toLowerCase(),
        );
        manualScore = manual?.score ?? null;
        if (manualScore != null) {
          rawAverage = manualScore;
        } else {
          isAllExempted = true;
        }
      } else {
        const categoryAssessments = allAssessments.filter(
          (a) => a.type === category.type,
        );
        if (categoryAssessments.length > 0) {
          if (category.maxScore != null && category.maxScore > 0) {
            let totalRawScore = 0;
            let hasActive = false;
            for (const assessment of categoryAssessments) {
              const sub = studentSubmissions.find(
                (s) => s.assessment_id === assessment.id,
              );
              if (!sub) continue;
              if (sub.status === 'exempted' || sub.is_exempted) continue;
              if (sub.is_missed) continue;
              totalRawScore += this.mergeHybridScores(sub);
              hasActive = true;
            }
            if (hasActive) {
              rawAverage = (totalRawScore / category.maxScore) * 100;
            } else if (categoryAssessments.length > 0) {
              isAllExempted = true;
            }
          } else {
            const percentages: number[] = [];
            let anyNonExemptedFound = false;

            for (const assessment of categoryAssessments) {
              const sub = studentSubmissions.find(
                (s) => s.assessment_id === assessment.id,
              );
              if (!sub) {
                // No submission at all — cannot contribute a score
                continue;
              }
              if (sub.status === 'exempted' || sub.is_exempted) {
                continue;
              }
              if (sub.is_missed) {
                anyNonExemptedFound = true;
                percentages.push(0);
              } else {
                anyNonExemptedFound = true;
                const rawScore = this.mergeHybridScores(sub);
                const effectiveTotal =
                  assessment.grading_mode === 'manual'
                    ? (assessment.manual_max_score ?? assessment.total_items ?? 1)
                    : assessment.total_items;
                const pct =
                  effectiveTotal > 0
                    ? (rawScore / effectiveTotal) * 100
                    : 0;
                percentages.push(pct);
              }
            }

            if (anyNonExemptedFound) {
              rawAverage =
                percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
            } else if (categoryAssessments.length > 0) {
              isAllExempted = true;
            }
          }
        } else {
          // No assessments of this type — treat as non-contributing
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

  resolveGrade(score: number, ranges: GradeRange[]): string {
    const match = ranges.find(
      (r) => score >= r.minPercent && score <= r.maxPercent,
    );
    return match?.gradeValue ?? 'N/A';
  }
}