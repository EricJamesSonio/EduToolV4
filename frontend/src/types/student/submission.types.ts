import { SubmissionStatus } from "@/types/educator/submission.types";

export interface DraftAnswer {
  questionId: string;
  answer: string | null;
  isFlagged: boolean;
}

export interface StudentSubmission {
  id: string;
  assessmentId: string;
  status: SubmissionStatus;
  answers: DraftAnswer[];
  score: number | null;
  totalPoints: number;
  isPublished: boolean;
  startedAt: string | null;
  submittedAt: string | null;
  updatedAt: string;
}

export interface SubmissionResult {
  submissionId: string;
  assessmentTitle: string;
  score: number | null;
  totalPoints: number;
  isPublished: boolean;
  answers: Array<{
    questionId: string;
    questionText: string;
    studentAnswer: string | null;
    correctAnswer: string | null;
    earned: number | null;
    maxPoints: number;
    feedback: string | null;
    isEssay: boolean;
    essayGraded: boolean;
  }>;
}