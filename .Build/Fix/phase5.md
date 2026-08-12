# Phase 5 — Frontend: Org-Creation Trigger + Blocking Messaging

## Goal

Wire up whatever Phase 2's investigation found was missing for the org-setup trigger (if anything), and update both OTP-verify flows' frontend to handle the new blocking response cleanly.

## Steps

1. **Org-creation trigger** — based on Phase 2's investigation report: if the existing `OrganizationGuardContext.tsx` mechanism already handles `org_id: null` generically, this step may need **no changes at all** — confirm this by testing the actual login flow for a freshly-approved admin rather than assuming. If the investigation found a real gap, fix only that specific gap — don't rebuild the org-setup flow.

2. **Admin Account Request frontend** (`app/register/page.tsx`, from earlier work): handle the new `{ blocked: true, message }` response from OTP-verify — show the message clearly, do not proceed to step 2/3 of the form, do not attempt to render any application data.

3. **Enrollment Portal frontend** (`app/enroll/[orgSlug]/[periodToken]/_components/EnrollmentPortal.tsx`): same handling for its OTP-verify response — same blocking behavior, consistent messaging style with the Admin Account Request flow (reuse a shared component for rendering this blocked state if one doesn't already exist, rather than writing the same UI twice).

## Acceptance check

- A freshly-approved admin logging in for the first time sees the org-setup flow without any special-casing beyond what already existed (or with only the specific fix Phase 2 identified)
- Both OTP-verify flows show a clear, consistent "already have an account" message and do not proceed further

---

## AI Prompt

```
Context: EduTool frontend (Next.js). Backend blocking behavior exists (Phase
3). Phase 2 investigated whether OrganizationGuardContext.tsx already
generically handles org_id: null — refer to that investigation's findings
before starting this phase (ask if you don't have them).

Task:
1. If Phase 2 found a real gap in the org-setup trigger, fix specifically
   that gap. If it found the mechanism already works generically, verify this
   by tracing the actual code path for a freshly-approved admin (org_id: null,
   first login) rather than assuming — confirm and move on without changes if
   confirmed working.

2. Update frontend/src/app/register/page.tsx (Admin Account Request) to
   handle a { blocked: true, message } response from the OTP-verify call —
   display the message clearly and do not proceed to later form steps.

3. Update frontend/src/app/enroll/[orgSlug]/[periodToken]/_components/EnrollmentPortal.tsx
   with the same handling for its OTP-verify response. If a shared component
   for rendering this "blocked" state doesn't already exist, create one small
   shared component both flows use, rather than duplicating the same UI in
   both places.

Show me what you found for step 1 and your diffs for steps 2-3.
```
