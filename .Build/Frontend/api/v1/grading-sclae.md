=========================
GRADING SCALE MODULE
Base: /grading-scales
=========================
11. CREATE Grading Scale

POST /grading-scales

Roles: admin

Request:
{
"levelId": "uuid",
"schoolYearId": "uuid",
"name": "string",
"ranges": [
{
"minPercent": number,
"maxPercent": number,
"gradeValue": "string",
"remark": "string",
"isPassing": boolean
}
]
}

Response:
{
"id": "uuid",
"name": "string",
"ranges": [...]
}

Validation Rules:

Must start at 0 and end at 100
No overlaps
No gaps
At least one passing range

Notes:

Frontend should validate BEFORE sending
Build UI with continuous range enforcement
12. GET Grading Scales

GET /grading-scales?levelId=&schoolYearId=

Response:
[
{
"id": "uuid",
"levelId": "uuid",
"schoolYearId": "uuid",
"name": "string",
"ranges": [...]
}
]

Notes:

Use for dropdown / selection
Cache per school year if needed
13. UPDATE Grading Scale

PATCH /grading-scales/:id

Roles: admin

Request:
{
"name": "string (optional)",
"ranges": [...] (optional)
}

Response:
{
"id": "uuid",
"name": "string",
"ranges": [...]
}

Errors:

400 if locked
404 if not found

Notes:

Disable editing if class already locked
Sync with grade lock module behavior