# Phase 3 — Backend: "Already Have an Account" Blocking at OTP-Verify

## Goal

In both the Admin Account Request flow and the Enrollment Portal flow, verifying OTP for a Gmail that already belongs to an approved account returns a clear block — before any session issues, before any old application data is returned.

## Steps

1. **Admin Account Request** — in the `POST /auth/admin-request/verify` handler (built earlier): before the existing "check for existing `RegistrationRequest`" logic runs, call `PersonalEmailRegistryService.isPersonalEmailInUse(email)`. If `true`, return a response the frontend can render as a blocking message (e.g. `{ blocked: true, message: 'This Gmail is already linked to an account in EduTool.' }`) — do **not** issue a session token, do **not** return any `RegistrationRequest` data, even if one happens to also exist.

2. **Enrollment Portal** — find the equivalent OTP-verify handler in the `enrollment-portal` module. Apply the exact same check, same early-exit behavior, same response shape (keep the blocking response shape consistent across both flows so the frontend can share one handling path).

3. Both checks use the **same** `PersonalEmailRegistryService` from Phase 1 — do not write a second version of this check inline in either module.

## Acceptance check

- A Gmail with an approved admin account, tried again in the Admin Account Request flow → blocked, no session, no data
- The same Gmail, tried in the Enrollment Portal flow → also blocked (this is the cross-flow case that was the actual bug) — confirms the check is genuinely global, not scoped per-feature
- A Gmail with only a _pending_ (not yet approved) request in either flow is **not** blocked from being used in the other flow — pending applications don't count as "in use"

---

## AI Prompt

```
Context: EduTool backend (NestJS). PersonalEmailRegistryService.isPersonalEmailInUse()
exists (Phase 1). Two separate OTP-verify endpoints need the same guard added:
Admin Account Request's POST /auth/admin-request/verify, and the Enrollment
Portal's equivalent OTP-verify endpoint (find it in the enrollment-portal
module).

Task: In both handlers, before any existing "look up existing
request/application" logic runs, call isPersonalEmailInUse(email). If it
returns true, return a blocking response immediately — do not issue a session
token, do not query or return any existing pending request/application data
for that email, even if one exists. Use a consistent response shape across
both endpoints, e.g. { blocked: true, message: 'This Gmail is already linked
to an account in EduTool.' } — match exact wording across both so the
frontend can handle both the same way.

Do not write the uniqueness check inline in either handler — both must call
the same PersonalEmailRegistryService from Phase 1.

Show me the diff for both handlers.
```
