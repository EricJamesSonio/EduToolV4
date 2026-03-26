=========================
PLATFORM MODULE (SUPER ADMIN)
Base: /platform
=========================
6. PLATFORM Login

POST /platform/login

Request:
{
"password": "string"
}

Response:
{
"access_token": "jwt"
}

Errors:

401 → invalid password

Notes:

Uses ENV secret (PLATFORM_SECRET_PASSWORD)
No email/username → password-only login
Store token securely (admin-only environment)
7. CREATE Admin

POST /platform/admins

Roles: platform_owner

Request:
{
"email": "string"
}

Response:
{
"id": "uuid",
"email": "string",
"role": "admin",
"status": "active",
"created_at": "date",
"password": "string" // ⚠ one-time only
}

Errors:

409 → email already exists

Notes:

Password is shown ONLY ONCE → must display + copy in UI
Not stored in plain text
Trigger "copy to clipboard" UX
8. GET Admins (Paginated)

GET /platform/admins?search=&page=&limit=

Roles: platform_owner

Query:
{
"search": "string (optional)",
"page": number (default 1),
"limit": number (default 20)
}

Response:
{
"data": [
{
"id": "uuid",
"email": "string",
"role": "admin",
"status": "active | suspended",
"created_at": "date"
}
],
"meta": {
"total": number,
"page": number,
"limit": number,
"totalPages": number
}
}

Notes:

Supports search by email
Use for admin management table
Implement pagination UI
9. GET Single Admin

GET /platform/admins/:id

Response:
{
"id": "uuid",
"email": "string",
"role": "admin",
"status": "string",
"created_at": "date"
}

Errors:

404 → not found
10. BLOCK Admin

PATCH /platform/admins/:id/block

Response:
{
"id": "uuid",
"status": "suspended"
}

Notes:

Prevents login/access
Update UI status immediately
11. UNBLOCK Admin

PATCH /platform/admins/:id/unblock

Response:
{
"id": "uuid",
"status": "active"
}

12. RESET Admin Password

POST /platform/admins/:id/reset-password

Response:
{
"id": "uuid",
"email": "string",
"status": "string",
"password": "string" // ⚠ one-time only
}

Notes:

Same as create → password visible ONCE
Must show + allow copy immediately
Old password becomes invalid

PLATFORM (SUPER ADMIN)
Separate from normal auth system
Highly restricted UI
Includes:
admin creation
admin control (block/unblock)
password resets

Frontend must:

Secure routes (platform-only)
Handle one-time password display
Implement pagination + search