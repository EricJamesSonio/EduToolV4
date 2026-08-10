# Phase 2 — Backend: Public Submit / Gmail-Lookup / View-Edit + Session

## Goal

An applicant enters their Gmail → OTP → if a request already exists for that Gmail, land in edit mode (with any `revision_notes` flags visible); if not, land in a fresh submission form. A 2-hour session covers the whole visit, reusing the Enrollment Portal's existing session mechanism.

## Steps

1. **Investigate first.** Read `backend/src/modules/enrollment-portal/enrollment-session.guard.ts` and `enrollment-session.decorator.ts` in full — this is the exact session mechanism to reuse (issued after OTP verify, scoped to a short-lived token, checked by a guard on subsequent requests). Also re-read `auth.service.ts`'s `register()`/`verifyOtp()`/`resendOtp()` and `auth.repository.ts`'s OTP methods — this phase extends that existing OTP flow, not the Enrollment Portal's OTP flow (they're separate `Otp.purpose` values). Report findings before writing code.

2. **`POST /auth/admin-request/otp`** — `{ email }` (validated with `@IsGmailAddress()`). Sends an OTP via the existing `createOtp`/`sendOtpEmail` mechanism, using whatever `purpose` value already distinguishes org-registration OTPs (or add one if the purpose enum from earlier work doesn't already cover this case — check first).

3. **`POST /auth/admin-request/verify`** — `{ email, code }`. Verifies via existing OTP logic. On success: check if a `RegistrationRequest` already exists for this email.
   - If yes → issue the session token (mirroring the Enrollment Portal's issuance pattern from Step 1) and return the existing request's data, including any `revision_notes`.
   - If no → issue the session token, return an empty/fresh state signal so the frontend renders the submission form.

4. **`GET /auth/admin-request/me`** — session-guarded (using the reused guard), returns the current request's full data + `revision_notes` if one exists.

5. **`POST /auth/admin-request/submit`** — session-guarded. Body: the form fields (full name, institution name, role, student count, programs/departments — match whatever `RegistrationRequest` already has, per Phase 1's investigation). If no request exists yet for this session's email, create one (`status: pending`). If one exists, update it in place — and **clear `revision_notes` entirely and set `status` back to `pending`**, regardless of which specific fields changed (same auto-reopen convention as the Concern Center feature — full re-review on any resubmission, not partial).

## Acceptance check

- Verifying OTP for a Gmail with no existing request → fresh form state
- Verifying OTP for a Gmail with an existing `needs_revision` request → returns the request data with `revision_notes` populated, frontend can render "!" markers
- Session expires at 2 hours; a request after expiry requires re-verifying OTP
- Submitting clears any prior `revision_notes` and resets status to `pending`

---

## AI Prompt

```
Context: EduTool backend (NestJS). RegistrationRequest schema (with
revision_notes) and the shared @IsGmailAddress() validator exist (Phase 1).

Step 1 — investigate: read backend/src/modules/enrollment-portal/
enrollment-session.guard.ts and enrollment-session.decorator.ts in full —
report exactly how a session token is issued after OTP verify and how it's
checked on later requests. This phase must reuse this same mechanism, not
build a new one. Also read auth.service.ts's register()/verifyOtp()/resendOtp()
and auth.repository.ts's OTP methods, and report whether the existing Otp
purpose value already distinguishes admin-registration OTPs from other kinds,
or whether one needs to be added.

Step 2: Add POST /auth/admin-request/otp — { email } validated with
@IsGmailAddress() — sends OTP via the existing createOtp/sendOtpEmail path.

Step 3: Add POST /auth/admin-request/verify — { email, code }. On successful
OTP verify, check for an existing RegistrationRequest matching this email.
Issue a session token using the mechanism found in Step 1 either way. Return
the existing request (including revision_notes) if found, or an empty-state
signal if not.

Step 4: Add GET /auth/admin-request/me — guarded by the reused session guard,
returns current request data + revision_notes.

Step 5: Add POST /auth/admin-request/submit — session-guarded. Accepts the
request form fields (match RegistrationRequest's actual fields per Phase 1's
findings). Create if none exists for this session's email; if one exists,
update in place AND clear revision_notes to null/empty AND set status back to
'pending' regardless of which fields were edited — full re-review on any
resubmission.

Show me your Step 1 findings first, then diffs.
```
