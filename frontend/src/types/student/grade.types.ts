export interface StudentAssessmentScore {
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: string;
  earned: number | null;
  total: number;
  isPublished: boolean;
}

export interface StudentManualScore {
  categoryId: string;
  categoryName: string;
  score: number | null;
  maxScore: number;
  isPublished: boolean;
}

export interface StudentTermGrade {
  termId: string;
  termName: string;
  assessmentScores: StudentAssessmentScore[];
  manualScores: StudentManualScore[];
  /** Only shown after grade lock */
  termGrade: number | null;
  isLocked: boolean;
}

export interface StudentSubjectGrade {
  classId: string;
  subjectTitle: string;
  termGrades: StudentTermGrade[];
  /** Only shown after final grade lock */
  finalGrade: number | null;
  remark: string | null;       // "Passed" | "Failed"
  gradingScaleLabel: string | null;
}