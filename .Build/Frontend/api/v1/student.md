=========================
STUDENT MODULE
Base: /students
=========================
ENUM: StudentStatus
active
pending
dropped
transferred
suspended
graduated
Student Structure

{
"id": "uuid",
"fullName": "string",
"email": "string",
"studentId": "string",
"levelId": "uuid",
"sectionId": "uuid | null",
"status": "enum"
}

9. CREATE Student

POST /students

Roles: admin

Request:
{
"fullName": "string",
"email": "string",
"studentId": "string",
"levelId": "uuid",
"sectionId": "uuid (optional)"
}

Response:
{
"id": "uuid",
"plainPassword": "generated"
}

Errors:

409 → email or studentId exists

Behavior:

If section FULL → becomes PENDING
If no section → PENDING
Else → ACTIVE

Notes:

Password shown ONLY once
Admin must distribute credentials
10. GET Students

GET /students

Query:

search
status
levelId
sectionId

Response:
[
{
"id": "uuid",
"fullName": "...",
"status": "..."
}
]

Notes:

Backend also filters again (double safety)
Use for:
student table
filters UI
11. GET Student

GET /students/:id

Errors:

404 → not found
12. UPDATE Student

PATCH /students/:id

Roles: admin

Rules:

Email must be unique
Section must NOT exceed capacity

Errors:

400 → section full
409 → email conflict

Notes:

Moving student between sections respects capacity
13. UPDATE Status

PATCH /students/:id/status

Request:
{
"status": "enum",
"reason": "optional"
}

Rules:

Reversing:
dropped / transferred / graduated → active
REQUIRES reason

Notes:

Important for audit trail
14. BULK IMPORT Students

POST /students/import

File: CSV

Response:

validation_failed OR success

Validation:

Required:
Full Name
Student ID
Email
Level ID
Must be unique:
email
studentId

Notes:

Partial import supported
Returns detailed error report
15. DOWNLOAD TEMPLATE

GET /students/import-template

Notes:

Use for CSV format guide
16. DOWNLOAD CREDENTIALS

GET /students/credentials-csv

Notes:

Passwords NOT included (masked)
Only for admin tracking
17. RESET PASSWORD

POST /students/:id/reset-password

Response:
{
"plainPassword": "new password"
}

Notes:

Admin must resend credentials

=========================
ENROLLMENTS (STUDENT)
=========================
18. GET Enrollments

GET /students/:id/enrollments

19. ADD Enrollment

POST /students/:id/enrollments

Request:
{
"classId": "uuid"
}

Rules:

Student must be ACTIVE
No duplicate subject per semester
Class must have capacity

Response:

success OR
{
"overflow": true
}
20. DELETE Enrollment

DELETE /students/:id/enrollments/:enrollmentId

Rules:

Cannot delete if already removed

STUDENT FLOW
Create student
Assign level + section
Assign classes (enrollment)
Track status lifecycle