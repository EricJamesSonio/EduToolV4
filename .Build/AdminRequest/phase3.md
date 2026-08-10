# Phase 3 — Backend: Platform Owner Review Actions

## Goal

Approve (create org + admin account with generated login email), reject, or request-revision (per-field notes) — all from the existing `platform-registration` module.

## Steps

1. **Investigate first.** Read `backend/src/modules/platform-registration/platform-registration.service.ts`, `.controller.ts`, `.repository.ts`, and `dto/approve-request.dto.ts` in full. Also read `AuthRepository.createAccount()` again — it currently sets `email: data.email` directly (the requester's email). Report exactly what the existing approve flow does today before changing it.

2. **Modify approval** to:
   - Generate the login email via `generateAdminLoginEmail()` from Phase 1, using the request's Gmail — **not** `data.email` directly anymore
   - Create the `Organization` (if this doesn't already happen on approval — check Step 1's findings) using `institution_name`, and generate its `slug` the same way the Enrollment Portal generates org slugs (reuse that logic, don't reimplement)
   - Create the `Account` with the generated login email, `role: 'admin'`, and a system-generated password (reuse whatever password-generation utility already exists for student/educator account creation — check `commons/utils/password.util.ts`)
   - Create the `Profile` with `personal_email` set to the request's Gmail (this is the field that makes notifications work — same relationship students already have)
   - Set `RegistrationRequest.status = 'approved'`, `reviewed_by`, `reviewed_at`
   - Return/pass along the generated login email + plaintext password for Phase 4's email step (don't persist the plaintext password anywhere)

3. **Add rejection**: `PATCH /platform-registration/:id/reject` — `{ reason? }` (optional free-text reason for the email). Sets `status: 'rejected'`, `reviewed_by`, `reviewed_at`.

4. **Add request-revision**: `PATCH /platform-registration/:id/request-revision` — `{ fieldNotes: { [fieldName]: string } }`. Validate that every key in `fieldNotes` corresponds to an actual field on `RegistrationRequest` (reject unknown field names rather than silently storing garbage). Sets `revision_notes = fieldNotes`, `status: 'needs_revision'`, `reviewed_by`, `reviewed_at`.

## Acceptance check

- Approving a request creates an `Account` whose email is `{gmailLocalPart}@admin.relief-ed`, not the raw Gmail address
- The new `Profile.personal_email` equals the request's Gmail
- Rejecting and request-revision both work without touching the approval path's logic
- Submitting an unknown field name in `fieldNotes` is rejected, not silently accepted

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). generateAdminLoginEmail() exists
(Phase 1). Session-based public submission exists (Phase 2). The
platform-registration module already handles some form of approval today.

Step 1 — investigate: read platform-registration.service.ts, .controller.ts,
.repository.ts, and dto/approve-request.dto.ts in full. Read
AuthRepository.createAccount() again. Report exactly what the current approval
flow does — does it already create an Organization? Does it already create a
Profile? What does it currently use as the Account's email? Report this before
changing anything.

Step 2: Modify the approval flow so that:
- The Account's email is generateAdminLoginEmail(request's gmail), not the raw
  gmail address
- An Organization gets created (if not already happening) using institution_name,
  with a slug generated the same way the Enrollment Portal generates org slugs
  (find and reuse that exact logic — do not write a second slug generator)
- The Account is created with role: 'admin' and a system-generated password
  (reuse the existing password-generation utility used elsewhere in this
  codebase for student/educator accounts — find it, likely in
  commons/utils/password.util.ts)
- A Profile is created with personal_email set to the request's gmail address
- RegistrationRequest.status becomes 'approved', with reviewed_by/reviewed_at set
- The generated login email and plaintext password are passed forward for use
  in Phase 4's email step, but the plaintext password is never persisted
  anywhere in the database

Step 3: Add PATCH /platform-registration/:id/reject — { reason?: string } —
sets status 'rejected', reviewed_by, reviewed_at.

Step 4: Add PATCH /platform-registration/:id/request-revision —
{ fieldNotes: Record<string, string> }. Validate every key in fieldNotes
matches an actual RegistrationRequest field name — reject the request with a
clear error if any key doesn't. Sets revision_notes = fieldNotes, status
'needs_revision', reviewed_by, reviewed_at.

Show me your Step 1 findings first, then your implementation plan, then diffs.
```
