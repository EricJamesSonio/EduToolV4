// @/modules/assessment/entity/assessment.entity.ts

export class QuestionEntity {
  id: string;
  orgId: string;
  assessmentId: string;
  type: string;
  questionText: string;
  correctAnswer: string | null;
  choices?: string[]; // multiple choice only
}

export class AssessmentEntity {
  id: string;
  orgId: string;
  classId: string;
  lessonId: string | null;
  termId: string;
  type: string;
  totalItems: number;
  releaseDate: Date | null;
  endDate: Date | null;
  isPublished: boolean;
  createdAt: Date;
  questions?: QuestionEntity[];
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
}
