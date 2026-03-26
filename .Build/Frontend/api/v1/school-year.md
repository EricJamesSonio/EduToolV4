=========================
SCHOOL YEAR MODULE
Base: /school-years
=========================
STATUS VALUES
pending
active
ended
11. CREATE School Year

POST /school-years

Roles: admin

Request:
{
"name": "string (e.g. 2025-2026)"
}

Response:
{
"id": "uuid",
"name": "string",
"status": "pending"
}

Notes:

Automatically seeds:
levels (from defaults)
First step in academic setup
12. GET School Years

GET /school-years

Response:
[
{
"id": "uuid",
"name": "string",
"status": "pending | active | ended"
}
]

Notes:

Use for school year selector
Highlight ACTIVE one in UI
13. ACTIVATE School Year

PATCH /school-years/:id/activate

Roles: admin

Response:
{
"id": "uuid",
"status": "active"
}

Errors:

409 → another active exists
400 → already active OR already ended

Effects:

Unlocks subjects
Unlocks grading scales from previous active year

Notes:

ONLY ONE active school year allowed
Important system-wide state change
Frontend should:
confirm action
refresh global data
14. END School Year

PATCH /school-years/:id/end

Roles: admin

Response:
{
"id": "uuid",
"status": "ended"
}

Errors:

409 → already ended
400 → cannot end pending

Notes:

Marks year as archived
Cannot be modified after
15. UPDATE School Year

PATCH /school-years/:id

Roles: admin

Request:
{
"name": "string"
}

Response:
{
"id": "uuid",
"name": "string"
}

Errors:

404 → not found
400 → cannot update ended

Notes:

Only name can be changed
Disable edit if status = ended

SCHOOL YEAR FLOW
Create → pending
Activate → becomes active (ONLY ONE)
End → archived

Frontend must:

Always track ACTIVE school year
Prevent invalid transitions
Reflect global system changes after activation