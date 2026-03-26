=========================
SECTION MODULE
Base: /sections
=========================
Section Structure

{
"id": "uuid",
"levelId": "uuid",
"name": "string",
"capacity": number
}

1. CREATE Section

POST /sections

Roles: admin

Request:
{
"levelId": "uuid",
"name": "string (1–100 chars)",
"capacity": number (min 1)
}

Response:
{
"id": "uuid",
"levelId": "uuid",
"name": "string",
"capacity": number
}

Notes:

Linked to a LEVEL (required)
Capacity controls student assignment
No duplicate name validation (backend currently allows)
2. GET Sections

GET /sections?levelId=uuid (optional)

Response:
[
{
"id": "uuid",
"levelId": "uuid",
"name": "string",
"capacity": number
}
]

Notes:

Can filter by levelId
Use for:
section dropdown
student assignment UI
3. UPDATE Section

PATCH /sections/:id

Roles: admin

Request:
{
"name": "string (optional)",
"capacity": number (optional)
}

Response:
{
"id": "uuid",
"name": "string",
"capacity": number
}

Errors:

404 → not found

Notes:

Be careful when lowering capacity:
existing students are NOT auto-removed
Frontend should warn if new capacity < current count
4. DELETE Section

DELETE /sections/:id

Roles: admin

Response:
204 No Content

Errors:

404 → not found
409 → has students assigned

Notes:

Soft delete is used
Cannot delete if students exist
UI should:
show student count
confirm before delete
INTERNAL BEHAVIOR
Section tracks student count
Capacity enforced during:
student creation
student update
enrollment