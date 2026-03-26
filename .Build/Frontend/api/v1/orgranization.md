=========================
ORGANIZATION MODULE
Base: /organization
=========================
3. CREATE Organization

POST /organization

Roles: admin

Request:
{
"name": "string (2–100 chars)",
"description": "string (optional, max 500)"
}

Response:
{
"id": "uuid",
"name": "string",
"description": "string",
"createdAt": "date"
}

Errors:

409 → admin already has organization

Notes:

One admin = ONE organization only
Typically done during onboarding
After creation, org is linked to admin account
4. GET Own Organization

GET /organization

Roles: admin

Response:
{
"id": "uuid",
"name": "string",
"description": "string"
}

Errors:

404 → not found

Notes:

Use for settings page
Should be cached globally (org context)
5. UPDATE Organization

PATCH /organization

Roles: admin

Request:
{
"name": "string (optional)",
"description": "string (optional)"
}

Response:
{
"id": "uuid",
"name": "string",
"description": "string"
}

Errors:

404 → not found

Notes:

Partial update allowed
Reflect changes immediately in UI (e.g. header/org name)