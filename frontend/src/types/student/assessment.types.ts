import { AssessmentType, Question } from "@/types/educator/assessment.types";

export type StudentAssessmentStatus =
  | "not_yet_open"
  | "open"
  | "draft"
  | "submitted"
  | "missed"
  | "exempted";

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
  questions: Question[];
}