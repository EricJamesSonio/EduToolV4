# Phase 5 — Frontend: Public Request Form

## Goal

Gmail entry → OTP → fresh form or edit mode with "!" flags, session-aware for 2 hours.

## Steps

1. **Investigate first.** Read whatever frontend component currently handles the existing `register`/OTP flow (likely under `frontend/src/app/register/page.tsx` and its API calls in `api/auth/register.api.ts`) and the Enrollment Portal's public form component (`app/enroll/[orgSlug]/[periodToken]/_components/EnrollmentPortal.tsx`) for the closest existing pattern of "Gmail → OTP → session → form" to mirror. Report which parts are reusable versus need new code.

2. **API layer**: extend or add to `api/auth/register.api.ts` — calls for the four Phase 2 endpoints (send OTP, verify, get current, submit).

3. **Session handling**: mirror however the Enrollment Portal's frontend currently stores/attaches its session token (check `useEnrollmentDraft.ts` / `enrollmentPortalDraft.ts` for the pattern) — same approach here, don't invent a new token-storage mechanism.

4. **Component**: `frontend/src/app/register/page.tsx` (updating the existing page, per "evolve in place"):
   - Step 1: Gmail input + "Send code" (client-side format check for `@gmail.com` in addition to the backend's validation, so the person gets instant feedback rather than a round trip)
   - Step 2: OTP input + verify
   - Step 3 (after verify): if the response indicates an existing request, render the form pre-filled with its data, with a red "!" indicator + the specific note next to any field listed in `revision_notes`; if fresh, render an empty form
   - Submit button, calls Phase 2's submit endpoint
   - Session countdown/expiry handling: if the 2-hour session lapses mid-fill, prompt to re-verify rather than silently failing on submit

## Acceptance check

- A Gmail with an existing `needs_revision` request shows the flagged fields with visible "!" markers and their specific notes
- A fresh Gmail goes straight to an empty form after OTP verify
- Submitting clears the flags (matches Phase 2's backend behavior) and shows a confirmation state

---

## AI Prompt

```
Context: EduTool frontend (Next.js). Backend from Phases 1-4 exists: gmail-only
validation, session-based OTP verify/lookup, submit-with-auto-clear-revision-flags.

Step 1 — investigate: read the existing register page/flow (check
frontend/src/app/register/page.tsx and frontend/src/api/auth/register.api.ts)
and the Enrollment Portal's public form
(frontend/src/app/enroll/[orgSlug]/[periodToken]/_components/EnrollmentPortal.tsx)
plus its session-handling pattern (check useEnrollmentDraft.ts and
enrollmentPortalDraft.ts). Report which of these are reusable as-is versus
need new code for this feature.

Step 2: Update frontend/src/api/auth/register.api.ts with calls for: send OTP
(admin-request/otp), verify (admin-request/verify), get current
(admin-request/me), submit (admin-request/submit).

Step 3: Implement session token handling using the same storage/attachment
pattern the Enrollment Portal's frontend already uses — do not invent a new
mechanism.

Step 4: Update frontend/src/app/register/page.tsx to a three-step flow:
(1) Gmail input with client-side @gmail.com format check + "Send code",
(2) OTP input + verify,
(3) after verify — if the response has existing request data, render the form
pre-filled with a visible "!" marker and the specific note next to any field
present in revision_notes; if no existing request, render an empty form.
Submit calls the submit endpoint. Handle the 2-hour session expiring mid-fill
by prompting re-verification rather than letting submit silently fail.

Show me your Step 1 findings first, then the file structure/plan, then diffs.
```
