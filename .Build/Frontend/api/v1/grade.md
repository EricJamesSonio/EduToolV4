=========================
GRADE MODULE (EDUCATOR / ADMIN)
Base: /classes/:classId/grades
=========================
1. GET Grades By Class

GET /classes/:classId/grades

Roles: educator, admin

Response:
[
{
"termId": "uuid",
"students": [
{
"studentId": "uuid",
"grade": {
"student_id": "uuid",
"final_score": number,
"final_grade": string,
"is_locked": boolean
} | null,
"assessmentScores": [
{
"assessmentId": "uuid",
"type": "quiz" | "exam" | "activity" | "custom",
"score": number,
"manualScore": number | null,
"totalItems": number,
"status": string
}
],
"categoryBreakdown": [
{
"category": string,
"weight": number,
"rawAverage": number,
"manualScore": number | null,
"weightedScore": number
}
]
}
]
}
]

Notes:

grade can be NULL if not yet computed
Use assessmentScores for per-activity display
Use categoryBreakdown for grade summary UI
2. GET Grades By Term

GET /classes/:classId/grades/:termId

Roles: educator, admin

Response:
{
"termId": "uuid",
"students": [
{
"studentId": "uuid",
"grade": {
"final_score": number,
"final_grade": string,
"is_locked": boolean
} | null,
"assessmentScores": [...],
"categoryBreakdown": [...]
}
]
}

Notes:

Same structure as full list but filtered per term
Preferred endpoint for grading screens
3. COMPUTE Grades

POST /classes/:classId/grades/:termId/compute

Roles: educator, admin

Response:
{
"computed": number,
"message": "Grades computed for X student(s)."
}

Notes:

Grades are NOT auto-calculated
Must call this before showing final grades
Should trigger after score updates
4. SET Manual Score

PATCH /classes/:classId/grades/:termId/students/:studentId/manual

Roles: educator, admin

Request Body:
{
"category": "Attendance",
"score": number (0–100)
}

Response:
{
"id": "uuid",
"classId": "uuid",
"studentId": "uuid",
"termId": "uuid",
"category": string,
"score": number
}

Errors:

403 if grade is locked

Notes:

Used for manual override (e.g. attendance, participation)
Disable input in UI if is_locked = true
=========================
STUDENT GRADE VIEW
Base: /student/classes/:classId/grades
=========================
5. GET My Grades

GET /student/classes/:classId/grades

Roles: student

Response:
[
{
"termId": "uuid",
"finalScore": number,
"finalGrade": string | null,
"isReleased": boolean
}
]

Notes:

finalScore is always visible
finalGrade is NULL if not released
isReleased = true only when class is locked
Hide grade label until released

Teacher workflow:
Input scores → Compute grades → Review → Lock grades
Lock = critical state:
Enables student visibility
Disables ALL grade edits
Freezes grading scale
Frontend must handle:
NULL values (not computed / not released)
Locked vs unlocked UI states
Manual vs computed scores
Key UI States:
Draft → Computed → Locked (Final)