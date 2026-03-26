export interface ManualScore {
  categoryId: string;
  categoryName: string;
  score: number | null;
  maxScore: number;
}

export interface AssessmentScore {
  assessmentId: string;
  assessmentTitle: string;
  assessmentType: string;
  earned: number | null;
  total: number;
  isPublished: boolean;
}

export interface GradeView {
  studentId: string;
  studentName: string;
  studentCode: string;
  assessmentScores: AssessmentScore[];
  manualScores: ManualScore[];
  termGrade: number | null;
  isLocked: boolean;
}

export interface Grade {
  id: string;
  classId: string;
  termId: string;
  termName: string;
  gradeViews: GradeView[];
}