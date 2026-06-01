// filepath: frontend/src/types/educator/assessment.types.ts

export type AssessmentType =
  | "written_work" | "performance_task" | "quarterly_assessment"
  | "exam" | "quiz" | "project" | "recitation"
  | "attendance" | "activity" | "custom" | "other";
  

export type GradingMode = "system" | "manual" | "hybrid";

export type QuestionType =
  | "multiple_choice"
  | "true_or_false"
  | "identification"
  | "enumeration"
  | "essay"
  | "manual";

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
  isManual?: boolean;
  sectionType?: string | null;
}

export interface ItemRange {
  id: string;
  startItem: number;
  endItem: number;
  questionType: QuestionType;
  conceptSectionIds: string[];
}

export type AssessmentStatus = "upcoming" | "open" | "closed";

export interface GenerationStatus {
  status: "generating" | "completed" | "failed";
  message: string;
  chunksTotal: number;
  chunksDone: number;
  currentChunk?: string;
  error?: string;
}

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
  gradingMode?: GradingMode;
  showBreakdown?: boolean;
  manualMaxScore?: number | null;
  weekNumber?: number;
  assignedStudentIds: string[] | null;
  submittedCount: number;
  pendingEssayCount: number;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  // In assessment.types.ts, add to Assessment interface:
reopenedUntil?: string | null;
}