=========================
PROGRAM MODULE
Base: /programs
=========================
ENUM: ProgramType
elementary
high_school
senior_high
college
custom
1. CREATE Program

POST /programs

Roles: admin

Request:
{
"name": "string (2–100 chars)",
"type": "elementary | high_school | senior_high | college | custom"
}

Response:
{
"id": "uuid",
"name": "string",
"type": "string",
"orgId": "uuid"
}

Errors:

409 → name already exists in org

Notes:

Name must be UNIQUE per organization
Used as parent for levels
Should be part of setup flow
2. GET Programs

GET /programs

Roles: admin

Response:
[
{
"id": "uuid",
"name": "string",
"type": "string"
}
]

Notes:

Use for dropdown (program selection)
Cache in frontend (rarely changes)
3. GET Single Program

GET /programs/:id

Response:
{
"id": "uuid",
"name": "string",
"type": "string"
}

Errors:

404 → not found
4. UPDATE Program

PATCH /programs/:id

Roles: admin

Request:
{
"name": "string (optional)",
"type": "enum (optional)"
}

Response:
{
"id": "uuid",
"name": "string",
"type": "string"
}

Errors:

404 → not found
409 → duplicate name

Notes:

Must still maintain unique name
Safe to partially update
5. DELETE Program

DELETE /programs/:id

Roles: admin

Response:
204 No Content

Errors:

404 → not found
409 → has levels assigned

Notes:

Cannot delete if linked to levels
Frontend should:
warn before delete
show dependency error clearly

PROGRAM FLOW
Program → Levels → Classes
Cannot delete program if levels exist

Frontend must:

Show dependency warnings
Load programs early (global state)