🎓 ASSESSMENT (STUDENT)

Same base: /classes/:classId/assessments

1. Get Assessments

GET /

Response
Array<{
  id: string;
  type: string;
  totalItems: number;
  releaseDate?: string;
  endDate?: string;
  isPublished: boolean;

  submissionStatus: 'not_started' | 'submitted' | 'graded' | string;
  submittedAt: string | null;
}>
2. Get Assessment Detail

GET /:id

Response
{
  id: string;
  type: string;
  totalItems: number;
  releaseDate?: string;
  endDate?: string;
  isPublished: boolean;

  locked: boolean;

  // only if NOT locked
  questions?: Array<{
    id: string;
    questionText: string;
    type: string;
    choices?: string[];
  }>;
}
3. Get Result

GET /:id/result

Response
{
  status: string;
  submittedAt: string;

  score: number | null; // null if not allowed to view
  isPublished: boolean;
}