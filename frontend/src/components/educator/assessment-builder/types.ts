import type {
  AssessmentType,
  QuestionType,
  Question,
  GradingMode,
} from "@/types/educator/assessment.types";
import type { Lesson } from "@/types/educator/lesson.types";

export type { AssessmentType, QuestionType, Question, GradingMode, Lesson };

/* ─── Concept item from AI ─────────────────────────────────────────── */

export interface ConceptItemInfo {
  index: number;
  name: string;
  section: string;
  definition: string;
  difficulty: string;
}

/* ─── One assessment "section" (maps to a range in the API) ────────── */

export interface AssessmentSection {
  id: string;
  title: string;
  from: number;
  to: number;
  questionType: QuestionType;
  selectedItemIndices: number[];
  manualQuestionText?: string;
  manualMaxScore?: number;
}

/* ─── Parsed concept content ───────────────────────────────────────── */

export interface ConceptContent {
  sections: string[];
  keywords: string[];
  questionCapacity: Record<string, number>;
  conceptItems: ConceptItemInfo[];
}

/* ─── Full wizard state ────────────────────────────────────────────── */

export interface BuilderState {
  selectedLesson: Lesson | null;
  type: AssessmentType;
  title: string;
  gradingMode: GradingMode;
  showBreakdown: boolean;
  manualMaxScore: number;
  totalItems: number;
  sections: AssessmentSection[];
  createdAssessmentId: string | null;
  previewId: string | null;
  generatedQuestions: Question[];
  manualInstructions: string;
  releaseDate: string;
  endDate: string;
  selectedStudentIds: string[];
  selectedTermId: string;
  weekNumber: number;
}

/* ─── Term option for dropdowns ────────────────────────────────────── */

export interface TermOption {
  termId: string;
  termName: string;
  semesterName: string;
}

/* ─── Internal helper for API range conversion ─────────────────────── */

export interface RangeRow {
  from: number;
  to: number;
  questionType: QuestionType;
  conceptSections: string[];
  manualQuestionText?: string;
  manualMaxScore?: number;
}
