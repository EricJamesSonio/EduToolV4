🧑‍🏫 ASSESSMENT (EDUCATOR)

Base: /classes/:classId/assessments

1. Create Assessment

POST /

Request
{
  lessonId: string;
  termId: string;
  type: 'quiz' | 'activity' | 'exam' | 'custom';
  totalItems: number;

  ranges: Array<{
    from: number;
    to: number;
    questionType: 'multiple_choice' | 'true_or_false' | 'identification' | 'enumeration' | 'essay';
    conceptSections: string[];
  }>;

  releaseDate?: string;
  endDate?: string;
}
Response
{
  id: string;
  classId: string;
  lessonId: string;
  termId: string;
  type: string;
  totalItems: number;
  releaseDate?: string;
  endDate?: string;
}
2. Get Assessments (Educator)

GET /

Response
Array<{
  id: string;
  type: string;
  totalItems: number;
  releaseDate?: string;
  endDate?: string;
}>
3. Get One Assessment

GET /:id

Response
{
  id: string;
  type: string;
  totalItems: number;
  releaseDate?: string;
  endDate?: string;

  questions: Array<{
    id: string;
    questionText: string;
    type: string;
    choices?: string[];
    correctAnswer?: string;
  }>;
}
4. Update Assessment

PATCH /:id

Request
{
  type?: string;
  releaseDate?: string;
  endDate?: string;
}
Response
{
  id: string;
  type: string;
  releaseDate?: string;
}
5. Delete Assessment

DELETE /:id

Response
{
  success: true;
}
6. Update Question

PATCH /:id/questions/:questionId

Request
{
  questionText?: string;
  correctAnswer?: string;
  choices?: string[];
}
Response
{
  id: string;
  questionText: string;
  correctAnswer?: string;
}
7. Get Submissions

GET /:id/submissions

Response
Array<{
  id: string;
  studentId: string;
  status: string;
  submittedAt: string | null;
  score?: number;
}>
8. Update Submission Status

PATCH /:id/submissions/:submissionId/status

Request
{
  status: 'exempted' | 'custom';
  manualScore?: number;
}
Response
{
  id: string;
  status: string;
  manualScore?: number;
}
9. Grade Essay

PATCH /:id/submissions/:submissionId/grade

Request
{
  score: number;
}
Response
{
  id: string;
  score: number;
}
10. Publish Scores

POST /:id/publish

Request
{
  studentIds?: string[]; // optional
}
Response
{
  success: true;
}
11. Unpublish Scores

POST /:id/unpublish

Response
{
  success: true;
}