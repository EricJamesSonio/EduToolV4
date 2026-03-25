// src/modules/submission/entity/submission.entity.ts

export class SubmissionAnswerEntity {
  id: string;
  orgId: string;
  submissionId: string;
  questionId: string;
  answer: string;
  isCorrect: boolean | null;
}

export class SubmissionEntity {
  id: string;
  orgId: string;
  assessmentId: string;
  studentId: string;
  status: 'draft' | 'submitted' | 'exempted' | 'custom';
  score: number | null;
  manualScore: number | null;
  submittedAt: Date | null;
  answers?: SubmissionAnswerEntity[];
}