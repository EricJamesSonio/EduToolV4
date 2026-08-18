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

export interface GradeComputationOptions {
  /**
   * Assessment ids excluded by the late-enrollment rule (Phase 2).
   * Excluded assessments are treated like exempted ones for averaging: they
   * contribute no percentage and do not count toward the category's active
   * status, so when every assessment in a category is excluded the category
   * drops out and the remaining weights renormalize. This is deliberately a
   * separate check from is_missed/is_exempted — it only decides presence in
   * the computation, never a score.
   */
  excludedAssessmentIds?: Set<string>;
}

@Injectable()
export class GradeCoreService {
  /**
   * Compute weighted score for a student considering ALL assessments in the term.
   * Missing assessments (no submission or draft) count as 0.
   * Exempted submissions are skipped entirely; if a category's submissions are
   * all exempted, the category is excluded and the remaining weights renormalize.
   * Assessment ids in options.excludedAssessmentIds (late-enrollment rule) are
   * likewise skipped without penalty, mirroring the exempted pattern.
   * Per-assessment percentages are bounded at 100 (hybrid scores are summed).
   * Hybrid assessments use system_section_score + manual_section_score.
   */
  computeWeightedScore(
    studentSubmissions: any[],
    studentManualScores: any[],
    allAssessments: any[],
    categories: SchemeCategory[],
    options?: GradeComputationOptions,
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

        const percentages: number[] = [];
        let hasCounted = false;

        for (const assessment of categoryAssessments) {
          // Late-enrollment exclusion: skipped like an exempted submission —
          // no percentage pushed, doesn't keep the category "active".
          if (options?.excludedAssessmentIds?.has(assessment.id)) continue;
          const sub = studentSubmissions.find(
            (s) => s.assessment_id === assessment.id,
          );
          if (!sub) {
            // Missing assessment counts as zero instead of being dropped from
            // the average — handed-out assessments are not optional work.
            hasCounted = true;
            percentages.push(0);
            continue;
          }
          if (sub.status === 'exempted' || sub.is_exempted) continue;
          if (sub.is_missed) {
            hasCounted = true;
            percentages.push(0);
            continue;
          }
          hasCounted = true;
          const pct = this.percentageOfMerge(sub, assessment);
          percentages.push(pct);
        }

        // A category whose submissions are all exempted contributes nothing so
        // the remaining weights renormalize — it is never penalty-scored as 0
        // at its full weight.
        if (hasCounted) {
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
    if (
      submission.assessment?.grading_mode === 'hybrid' ||
      submission.manual_section_score != null
    ) {
      return (
        (submission.system_section_score ?? 0) +
        (submission.manual_section_score ?? 0)
      );
    }
    return submission.manual_score ?? submission.score ?? 0;
  }

  /**
   * Convert a single submission into a per-assessment percentage of its total.
   * Bounding at 100 keeps hybrid system+manual sums (or over-full manual
   * scores) from inflating the weighted average past a perfect score.
   */
  private percentageOfMerge(submission: any, assessment: any): number {
    const rawScore = this.mergeHybridScores(submission);
    const effectiveTotal =
      assessment.grading_mode === 'manual'
        ? (assessment.manual_max_score ?? assessment.total_items ?? 1)
        : assessment.total_items;
    if (!effectiveTotal || effectiveTotal <= 0) return 0;
    return Math.min(100, (rawScore / effectiveTotal) * 100);
  }

  buildCategoryBreakdown(
    studentSubmissions: any[],
    studentManualScores: any[],
    allAssessments: any[],
    categories: SchemeCategory[],
    totalActiveWeight: number,
    options?: GradeComputationOptions,
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
              // Late-enrollment exclusion mirrors the exempted skip below.
              if (options?.excludedAssessmentIds?.has(assessment.id)) continue;
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
              // Late-enrollment exclusion mirrors the exempted skip below.
              if (options?.excludedAssessmentIds?.has(assessment.id)) continue;
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
                    ? (assessment.manual_max_score ??
                      assessment.total_items ??
                      1)
                    : assessment.total_items;
                const pct =
                  effectiveTotal > 0 ? (rawScore / effectiveTotal) * 100 : 0;
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
    // Ranges are configured as contiguous integer bands (e.g. 75-79, 80-84).
    // Scores are floating point, so a boundary fraction like 79.95 would fall
    // between two bands; round to the nearest integer before matching so it
    // resolves inside the valid range instead of silently yielding 'N/A'.
    const rounded = Math.round(score);
    const match = ranges.find(
      (r) => rounded >= r.minPercent && rounded <= r.maxPercent,
    );
    return match?.gradeValue ?? 'N/A';
  }
}
