=========================
SUBJECT MODULE
Base: /subjects
=========================
Subject Structure
{
  "id": "uuid",
  "orgId": "uuid",
  "name": "string",
  "levelId": "uuid",
  "educatorId": "uuid | null",
  "is_locked": boolean
}
1. CREATE Subject

POST /subjects

Roles: admin

Request:

{
  "name": "string (2–150 chars)",
  "levelId": "uuid",
  "educatorId": "uuid (optional)"
}

Response:

{
  "id": "uuid",
  "name": "string"
}

Notes:

Must be linked to a LEVEL
Educator is optional (can assign later)
No duplicate name validation enforced
2. GET Subjects

GET /subjects

Query:

levelId (optional)
educatorId (optional)
search (optional)

Response:

[
  {
    "id": "uuid",
    "name": "string",
    "levelId": "uuid",
    "educatorId": "uuid",
    "is_locked": boolean
  }
]

Notes:

Supports filtering + search
Use for:
subject dropdown
class creation
3. UPDATE Subject

PATCH /subjects/:id

Roles: admin

Request:

{
  "name": "optional",
  "levelId": "optional",
  "educatorId": "optional"
}

Errors:

404 → not found
400 → subject is locked

Notes:

❗ Cannot update if LOCKED
Always check is_locked before editing UI
Frontend should disable edit if locked
4. LOCK Subject

PATCH /subjects/:id/lock

Roles: admin

Response:

{ "success": true }

Errors:

404 → not found
400 → already locked
5. UNLOCK Subject

PATCH /subjects/:id/unlock

Roles: admin

Response:

{ "success": true }

Errors:

404 → not found
400 → already unlocked
IMPORTANT BEHAVIOR
🔒 LOCK = IMMUTABLE SUBJECT
Used to:
freeze curriculum
prevent accidental edits

Frontend must:

show lock status clearly
confirm before locking

SUBJECT FLOW
Subject → assigned to Level
Optional Educator
Can be LOCKED to freeze edits