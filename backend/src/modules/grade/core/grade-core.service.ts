import { Injectable } from '@nestjs/common';

// TODO: Add a `type` column to GradingSchemeComponent in schema.prisma
// so components can explicitly map to assessment.type (quiz | exam | activity | manual).
// Until then, callers derive `type` from component.name.toLowerCase().
export interface SchemeCategory {
  name: string;    // e.g. "Quiz", "Exam", "Activity"
  type: string;    // maps to assessment.type: quiz | exam | activity | manual
  weight: number;  // e.g. 0.3 = 30%
}

// Keep RubricCategory as a deprecated alias so any remaining imports don't break
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
  computeWeightedScore(
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
        const average =
          percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
        totalWeightedScore += average * weight;
        totalWeight += weight;
      }
    }

    if (totalWeight === 0) return 0;
    return Math.round((totalWeightedScore / totalWeight) * 100) / 100;
  }

  buildCategoryBreakdown(
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
          rawAverage =
            percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
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