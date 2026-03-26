// src/modules/grade/core/grade-core.service.ts
import { Injectable } from '@nestjs/common';

// ── Rubric category shape from Rubric.categories JSON ────────────────────────
export interface RubricCategory {
  name: string;   // e.g. "Quiz", "Exam", "Activity", "Attendance"
  type: string;   // direct match to assessment.type: quiz | exam | activity | custom
                  // for manual-only categories (attendance, behavior) type = 'manual'
  weight: number; // e.g. 0.3 = 30%
}

// ── GradingScale range shape ──────────────────────────────────────────────────
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
   * Compute weighted final score across all rubric categories.
   * Handles both assessment-backed and manual-only categories.
   * Returns 0 if no categories contribute (graceful degradation).
   */
  computeWeightedScore(
    submissions: any[],
    manualScores: any[],
    categories: RubricCategory[],
  ): number {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const category of categories) {
      const weight = category.weight;

      if (category.type === 'manual') {
        // Manual-only category (e.g. attendance, behavior)
        const manual = manualScores.find(
          (m) => m.category.toLowerCase() === category.name.toLowerCase(),
        );
        if (manual !== undefined) {
          totalWeightedScore += manual.score * weight;
          totalWeight += weight;
        }
      } else {
        // Assessment-backed category: type match (quiz→quiz, exam→exam, etc.)
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

  /**
   * Build per-category breakdown for display purposes.
   * Returns weight, rawAverage, manualScore, and weightedScore per category.
   */
  buildCategoryBreakdown(
    submissions: any[],
    manualScores: any[],
    categories: RubricCategory[],
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

  /**
   * Resolve final letter grade from a numeric score using grading scale ranges.
   */
  resolveGrade(score: number, ranges: GradeRange[]): string {
    const match = ranges.find(
      (r) => score >= r.minPercent && score <= r.maxPercent,
    );
    return match?.gradeValue ?? 'N/A';
  }
}