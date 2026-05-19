export type QuestionType =
  | "multiple_choice"
  | "true_or_false"
  | "identification"
  | "enumeration"
  | "essay";

export type AssessmentType = "quiz" | "activity" | "exam" | "custom";

export type StudentAssessmentStatus =
  | "not_yet_open"
  | "open"
  | "draft"
  | "submitted"
  | "missed"
  | "exempted";

export interface StudentQuestion {
  id: string;
  order: number;
  type: QuestionType;
  questionText: string;
  choices?: string[];
}

export interface StudentAssessment {
  id: string;
  classId: string;
  title: string;
  type: AssessmentType;
  termName: string;
  releaseDate: string;
  endDate: string;
  totalItems: number;
  status: StudentAssessmentStatus;
  score: number | null;
  isPublished: boolean;
  questions: StudentQuestion[];
}
