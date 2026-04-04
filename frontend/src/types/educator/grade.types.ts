export type AssessmentType = "quiz" | "exam" | "activity" | "custom";

export interface AssessmentScore {
  assessmentId: string;
  type: AssessmentType;
  score: number | null;
  manualScore: number | null;
  totalItems: number;
  status: string;
}

export interface CategoryBreakdown {
  category: string;
  weight: number;
  rawAverage: number;
  manualScore: number | null;
  weightedScore: number;
}

export interface StudentGrade {
  studentId: string;
  studentName: string;
  studentCode: string;
  grade: {
    student_id: string;
    final_score: number;
    final_grade: string;
    is_locked: boolean;
  } | null;
  assessmentScores: AssessmentScore[];
  categoryBreakdown: CategoryBreakdown[];
}

export interface TermGrades {
  termId: string;
  termName: string;
  students: StudentGrade[];
}