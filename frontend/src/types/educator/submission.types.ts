export type SubmissionStatus =
  | "not_started"
  | "draft"
  | "submitted"
  | "exempted"
  | "custom_score";

export interface SubmissionAnswer {
  questionId: string;
  answer: string | null;
  earnedPoints: number | null;
  feedback: string | null;
}

export interface Submission {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  status: SubmissionStatus;
  score: number | null;
  totalPoints: number;
  isPublished: boolean;
  essayGraded: boolean;
  answers: SubmissionAnswer[];
  startedAt: string | null;
  submittedAt: string | null;
  updatedAt: string;
}