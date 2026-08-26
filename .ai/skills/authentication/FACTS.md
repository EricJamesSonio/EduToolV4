# Authentication Skill — Facts

Last verified: 2026-08-26, commit 1f5fe24

## Mechanism

Auth method: JWT Bearer via Passport JWT (see backend/src/modules/auth/jwt.strategy.ts, auth.service.ts, auth.controller.ts, admin-request-session.guard.ts). Token sent as Authorization: Bearer via frontend api/client.ts interceptor reading Zustand auth.store accessToken. Helmet enabled (backend package.json helmet).
Token lifetime & refresh strategy: Access token with refresh via interceptor retry (see frontend/src/api/client.ts pendingRequests/dedup + 401 retry with _retry flag). Exact expiry values in backend/src/configs — verify via env validation (joi). UNKNOWN — needs human input for precise lifetimes if not in code comment.

## Roles

- platform_owner: manages organizations/tenants, platform admins (see backend/src/modules/platform, platform-registration)
- admin: org-scoped admin, manages students/educators/programs/sections/grading (admin routes)
- educator: teaches classes, manages assessments/grades/attendance/meetings/presentations
- student: enrolled student, views academic history/transcript/grades/assessments, enrolls, requests class assignments

Roles enforced server-side via guards/decorators — client-sent role never trusted (see backend/src/commons guards, auth module).

## Project-specific flows

- Password reset / email verification: via OTP (OtpPurpose enum org_registration|enrollment_verification|personal_email_change in schema.prisma) — token expiry single-use, rate-limited.
- Admin registration request session: admin-request-session.decorator/guard — session-scoped.
- Session/token invalidation on logout, password change, role change: clearAuth in frontend/store/auth.store.ts; backend revokes via token strategy.

## Common pitfalls specific to this project

- Tenant ID comes from JWT org_id (not body/params) — every tenant-scoped query must filter on it, including through relation chains.
