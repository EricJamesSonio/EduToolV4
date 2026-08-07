# Phase 2 — Public Enrollment API

## Goal

Give anonymous applicants: resolve portal by slug/token → OTP verify → create/edit application → look up by code. Built on Phase 1's models.

## Step 1 — Audit before writing new logic

- `modules/auth/auth.service.ts`, `auth.repository.ts`, and wherever the existing `Otp` model is currently written to (likely `platform-registration` or `auth`) — find the _existing_ OTP generate/send/verify logic. Reuse that service/method, extended with `purpose: enrollment_verification` and `org_id`, rather than writing a second OTP implementation.
- `modules/mail/mail.service.ts` — reuse existing send methods/templates for the OTP email and "application submitted / code" email. Only add a new template method if no comparable one exists.
- `commons/utils/token.util.ts` — check for an existing random-code generator (used anywhere for invite codes, temp passwords, etc.) before writing a new 4-char code generator. If one exists, parameterize it (charset, length) rather than duplicating.
- `commons/pipes/validation.pipe.ts` and an existing DTO like `auth/dto/register.dto.ts` — match the existing validation style exactly.
- `modules/organization` — confirm there's no existing public-lookup-by-slug endpoint before adding one.

## Step 2 — Build only what's missing

New module: `modules/enrollment-portal/public/`

- `enrollment-portal-public.controller.ts` — **no** `AuthGuard`, this is public.
- `enrollment-portal-public.service.ts`
- `dto/` — request/response DTOs with class-validator decorators matching repo style.

### Endpoints (adjust paths to match existing route-naming conventions in the repo)

- `GET /enroll/:orgSlug/:periodToken` — resolve org + period, return whether it's open (between start/end), and the school year's available programs/courses/strands/levels (reuse whatever service already returns this tree for the _internal_ enrollment flow — check `modules/program`, `modules/course`, `modules/strand`, `modules/level` for an existing "get options for a school year" query before writing a new one).
- `POST /enroll/:orgSlug/:periodToken/otp` — send OTP to personal email (delegates to the reused OTP service).
- `POST /enroll/:orgSlug/:periodToken/otp/verify` — verify OTP; on success, check `(org_id, school_year_id, personal_email)` for an existing application and return `mode: 'edit' | 'create'` plus a short-lived session/access token scoped to that application.
- `POST /enroll/:orgSlug/:periodToken/application` — create (requires verified session from previous step).
- `PATCH /enroll/:orgSlug/:periodToken/application` — edit own application (requires verified session; reject if `status` is `locked`/`approved`).
- `GET /enroll/lookup/:applicationCode` — public code lookup (status only, no PII beyond name/code).

## Step 3 — Validation rules

- Reject create if an application already exists for `(org_id, school_year_id, personal_email)` — point to edit mode instead (this is enforced by the Phase 1 unique constraint at the DB layer too; the service should give a clean error, not rely on the DB constraint to surface it).
- Reject create/edit if `now() > period.end_date`.
- Reject edit if `status` is `locked` or `approved`.
- Program → Course/Strand conditional logic should call the same mapping logic the admin/internal enrollment flow already uses (check `programType.mapper.ts` on the frontend and its backend counterpart) rather than re-encoding the rule.

## Acceptance

- Exactly one OTP send/verify implementation exists in the codebase (extended, not duplicated).
- All applicant-facing emails go through the single `mail.service.ts`.
- No PII beyond name + status + code is ever returned from the public lookup endpoint.
