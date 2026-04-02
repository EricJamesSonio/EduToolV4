// filepath: frontend/src/types/educator/assessment.types.ts

export type AssessmentType = "quiz" | "activity" | "exam" | "custom";

export type QuestionType =
  | "multiple_choice"
  | "true_or_false"
  | "identification"
  | "enumeration"
  | "essay";

export interface Choice {
  label: "A" | "B" | "C" | "D";
  text: string;
}

export interface Question {
  id: string;
  assessmentId: string;
  order: number;
  type: QuestionType;
  text: string;
  choices: Choice[] | null;
  correctAnswer: string | null;
  points: number;
  isLocked: boolean;
}

export interface ItemRange {
  id: string;
  startItem: number;
  endItem: number;
  questionType: QuestionType;
  conceptSectionIds: string[];
}

export type AssessmentStatus = "upcoming" | "open" | "closed";

export interface Assessment {
  id: string;
  classId: string;
  lessonId: string;
  lessonTitle: string;
  title: string;
  type: AssessmentType;
  termId: string;
  termName: string;
  totalItems: number;
  releaseDate: string | null;
  endDate: string | null;
  status: AssessmentStatus;
  isPublished: boolean;
  assignedStudentIds: string[] | null;
  submittedCount: number;
  pendingEssayCount: number;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}