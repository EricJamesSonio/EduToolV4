// src/modules/grade/entity/grade.entity.ts

export class GradeEntity {
  id: string;
  org_id: string;
  student_id: string;
  class_id: string;
  term_id: string;
  final_score: number;
  final_grade: string;
  is_locked: boolean;
  locked_at: Date | null;
}

export class ManualScoreEntity {
  id: string;
  org_id: string;
  class_id: string;
  student_id: string;
  term_id: string;
  category: string;
  score: number;
  updated_at: Date;
}

// ── Shaped responses ──────────────────────────────────────────

export class AssessmentScoreEntry {
  assessmentId: string;
  type: string; // quiz | exam | activity | custom
  score: number | null;
  manualScore: number | null;
  totalItems: number;
  status: string;
}

export class CategoryBreakdown {
  category: string;
  weight: number;
  rawAverage: number; // average % across assessments in this category
  manualScore: number | null; // manual override (e.g. attendance, behavior)
  weightedScore: number; // rawAverage * weight (or manualScore * weight)
}

export class StudentGradeRow {
  studentId: string;
  grade: GradeEntity | null;
  assessmentScores: AssessmentScoreEntry[];
  categoryBreakdown: CategoryBreakdown[];
}

export class TermGradeResult {
  termId: string;
  students: StudentGradeRow[];
}
