=========================
LESSON MODULE (EDUCATOR)
Base: /classes/:classId/lessons
=========================
1. CREATE Lesson

POST /classes/:classId/lessons

Roles: educator

Request:
{
"title": "string",
"description": "string (optional)",
"weekNumber": number (>=1),
"subIndex": number (>=1),
"detail": "string (min 10 words)"
}

Response:
{
"id": "uuid",
"title": "string",
"description": "string",
"weekNumber": number,
"subIndex": number,
"detail": "string",
"createdAt": "date"
}

Notes:

detail must be at least 10 words
(weekNumber + subIndex) must be UNIQUE per class
Automatically triggers AI concept extraction (async)
UI: show "Processing concepts..." after creation
2. GET Lessons

GET /classes/:classId/lessons?weekNumber=

Roles: educator

Response:
[
{
"id": "uuid",
"title": "string",
"description": "string",
"weekNumber": number,
"subIndex": number,
"detail": "string"
}
]

Notes:

Sorted typically by weekNumber → subIndex
Use weekNumber filter for weekly view UI
3. GET Lesson (with Concept)

GET /classes/:classId/lessons/:id

Response:
{
"id": "uuid",
"title": "string",
"description": "string",
"weekNumber": number,
"subIndex": number,
"detail": "string",
"concept": {
"content": any
} | null
}

Notes:

concept may be NULL if AI not finished yet
Frontend should handle loading/retry
4. UPDATE Lesson

PATCH /classes/:classId/lessons/:id

Request:
{
"title": "string (optional)",
"description": "string (optional)",
"weekNumber": number (optional),
"subIndex": number (optional),
"detail": "string (optional)"
}

Response:
{
"id": "uuid",
"title": "string",
...
}

Notes:

Updating (weekNumber + subIndex) must still be UNIQUE
If updating detail, it does NOT auto re-extract → must call re-extract endpoint
5. DELETE Lesson

DELETE /classes/:classId/lessons/:id

Response:
204 No Content

Notes:

Hard delete behavior (no return body)
Remove from UI immediately
6. GET Concept Only

GET /classes/:classId/lessons/:id/concept

Response:
{
"content": any
}

Errors:

404 if not yet generated

Notes:

Use when opening concept panel separately
7. RE-EXTRACT Concept

POST /classes/:classId/lessons/:id/re-extract

Request:
{
"detail": "string (min 10 words)"
}

Response:
{
"success": true,
"message": "Concept extraction started."
}

Notes:

Async process again
UI: show loading / toast feedback
Should be triggered after editing lesson detail
=========================
LESSON MODULE (STUDENT)
Base: /student/classes/:classId/lessons
=========================
8. GET My Lessons

GET /student/classes/:classId/lessons?weekNumber=

Response:
[
{
"id": "uuid",
"title": "string",
"description": "string",
"weekNumber": number,
"subIndex": number,
"detail": "string"
}
]

Notes:

Only accessible if student is enrolled
No concept included here (lighter payload)
9. GET My Lesson

GET /student/classes/:classId/lessons/:lessonId

Response:
{
"id": "uuid",
"title": "string",
"detail": "string",
...
}

Notes:

Same restriction: must be enrolled

LESSON FLOW
Create lesson → AI extracts concept
Fetch lesson → may not have concept yet
Re-extract manually if needed

Frontend must:

Handle async concept generation
Show loading / retry UI
Enforce min 10 words in editor