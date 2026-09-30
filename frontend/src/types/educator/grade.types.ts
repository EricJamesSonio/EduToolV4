export type AssessmentType = "quiz" | "exam" | "activity" | "custom";

export interface AssessmentScore {
  assessmentId: string;
  submissionId?: string;
  type: AssessmentType;
  title?: string | null;
  score: number | null;
  manualScore: number | null;
  totalItems: number;
  status: string;
  gradingMode?: string;
  systemSectionScore?: number | null;
  manualSectionScore?: number | null;
  isMissed?: boolean;
  isExempted?: boolean;
  included?: boolean;
  inclusionReason?: string;
  created_at?: string | null;
}

export interface CategoryBreakdown {
  category: string;
  type?: string;
  /**
   * TICK-GRADE-005: true when the educator scores this category directly
   * (Behavior, Participation, Attendance, Performance Task) instead of it being
   * derived from assessments. Drives whether the column renders as an editable
   * cell. Previously the frontend inferred this from a non-null `manualScore`,
   * which could never bootstrap: no score -> no column -> no way to enter one.
   */
  isManualScored?: boolean;
  /** The maximum an educator may enter. null = no explicit cap. */
  maxScore?: number | null;
  weight: number;
  rawAverage: number;
  manualScore: number | null;
  weightedScore: number;
  isAllExempted?: boolean;
  effectiveWeight?: number | null;
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
  semesterId?: string;
  semesterName?: string;
  students: StudentGrade[];
}