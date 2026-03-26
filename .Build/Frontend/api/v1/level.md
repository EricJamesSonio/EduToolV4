=========================
LEVEL MODULE
Base: /levels
=========================
10. GET Default Levels

GET /levels/defaults

Response:
[
{
"id": "uuid",
"programId": "uuid",
"name": "string"
}
]

Notes:

These are templates per organization
11. UPDATE Default Levels

PATCH /levels/defaults

Roles: admin

Request:
{
"levels": [
{
"id": "uuid (optional)",
"programId": "uuid",
"name": "string"
}
]
}

Response:
[
{
"id": "uuid",
"name": "string"
}
]

Notes:

Acts as UPSERT (create/update)
Used for system configuration UI
12. GET Levels by School Year

GET /levels?schoolYearId=uuid

Response:
[
{
"id": "uuid",
"name": "string",
"programId": "uuid"
}
]

Errors:

400 if missing schoolYearId

Notes:

Required for grading scale + class setup
13. UPDATE Single Level

PATCH /levels/:id

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

Notes:

Simple rename only