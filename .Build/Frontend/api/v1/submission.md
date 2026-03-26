=========================
SUBMISSION MODULE
Base: /assessments/:assessmentId
=========================
Answer Structure
{
  "questionId": "uuid",
  "answer": "string"
}
6. START / RESUME Submission

POST /assessments/:assessmentId/submit

Roles: student

Response:

{
  "id": "submissionId",
  "status": "draft",
  "answers": []
}

Errors:

403 → not published / not released / expired
403 → already submitted

Notes:

Creates draft OR resumes existing
Prevents multiple submissions
7. SAVE DRAFT

PATCH /assessments/:assessmentId/submit/save

Roles: student

Request:

{
  "answers": [
    { "questionId": "uuid", "answer": "text" }
  ]
}

Response:

{
  "submissionId": "uuid",
  "savedAnswers": number
}

Errors:

404 → no active attempt
403 → already submitted
400 → invalid questionId

Notes:

Validates question ownership
Uses UPSERT (insert/update answers)
8. FINISH Submission

POST /assessments/:assessmentId/submit/finish

Roles: student

Request:

{
  "answers": [...]
}

Response:

{
  "submissionId": "uuid",
  "score": number,
  "totalGraded": number,
  "essayPending": boolean,
  "submittedAt": "date"
}

Errors:

404 → no attempt
403 → already submitted
400 → invalid question
AUTO GRADING LOGIC (CRITICAL)
Only NON-ESSAY questions auto-graded
Comparison:
case-insensitive
trimmed
correct = answer.toLowerCase().trim() === correctAnswer
Essay = manual grading
IMPORTANT BEHAVIOR
ACCESS CONTROL

Student can ONLY submit if:

assessment is published
current date >= release_date
current date <= end_date
SUBMISSION FLOW
Start → draft created
Save → auto-save answers
Finish → final submission
ATTENDANCE INTEGRATION
If assessment has class:
submission → marks PRESENT automatically
Non-blocking (won’t break submission if fails)
SAFETY RULES
Cannot submit twice
Cannot edit after submit
All answers validated against questions
9. GET Submission Answers

GET /assessments/:assessmentId/submissions/:submissionId/answers

Roles: educator, admin

Response:

[
  {
    "question": {...},
    "answer": "..."
  }
]

Notes:

Includes question details
Used for:
grading UI
review page

SUBMISSION FLOW
Assessment → Submission → Answers → Grade

Key rules:

one attempt per student
auto + manual grading combined
strict validation