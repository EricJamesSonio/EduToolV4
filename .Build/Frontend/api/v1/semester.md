=========================
SEMESTER MODULE
Base: /semester-settings
=========================
STRUCTURE

Semester:
{
"id": "uuid",
"schoolYearId": "uuid",
"name": "string",
"startDate": "date",
"endDate": "date",
"terms": Term[]
}

Term:
{
"id": "uuid",
"name": "string",
"orderIndex": number,
"startDate": "date",
"endDate": "date"
}

5. CREATE Semester

POST /semester-settings

Roles: admin

Request:
{
"schoolYearId": "uuid",
"name": "1st Semester",
"startDate": "date",
"endDate": "date",
"terms": [
{
"name": "Prelim",
"orderIndex": 1,
"startDate": "date",
"endDate": "date"
}
]
}

Response:
{
"id": "uuid",
"name": "string",
"terms": [...]
}

Errors:

400 → invalid dates
409 → overlap or >3 semesters

Validation Rules:

Max 3 semesters per school year
Semester dates MUST NOT overlap
Term dates must:
be within semester
NOT overlap each other
start < end

Notes:

This is a HIGH-VALIDATION module
Frontend should:
use calendar/date pickers
visually block overlaps
6. GET Semesters

GET /semester-settings

Response:
[
{
"id": "uuid",
"name": "string",
"terms": [...]
}
]

Notes:

Used for:
scheduling
grading periods
7. UPDATE Semester

PATCH /semester-settings/:id

Roles: admin

Request:
{
"name": "optional",
"startDate": "optional",
"endDate": "optional",
"terms": [...]
}

Errors:

404 → not found
400 → invalid date ranges
409 → overlaps

Notes:

Same validation rules as create
Terms are UPSERTED (add/update/remove)
Frontend should:
allow editing inline terms
revalidate everything before submit
8. DELETE Semester

DELETE /semester-settings/:id

Roles: admin

Response:
204 No Content

Notes:

Deletes all terms as well
Use with caution (affects grading + schedules)
IMPORTANT BEHAVIOR
Semester controls:
grading timeline
class structure
Terms = grading periods (Prelim, Midterm, etc.)
Overlaps are STRICTLY prevented

SEMESTER FLOW
School Year → Semesters → Terms

Rules:

Max 3 semesters
No overlaps EVER

Frontend must:

visually block invalid dates
enforce constraints before submit