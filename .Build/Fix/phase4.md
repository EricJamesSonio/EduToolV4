# Phase 4 — Backend: Change Personal Email

## Goal

Any authenticated account (admin, educator, or student) can change their `Profile.personal_email` from account settings, gated behind OTP-verification of the new address.

## Steps

1. **Investigate first.** Read `profile.controller.ts`, `profile.service.ts`, `profile.repository.ts` to find the right home for this (extending the existing profile module, not a new one). Also re-read `AuthRepository`'s OTP methods (`createOtp`, `findValidOtp`, `markOtpUsed`) — this reuses that same mechanism, with a new `purpose` value (if the purpose enum from earlier work exists — check) or a way to distinguish this OTP use case from others.

2. **`POST /profile/personal-email/change-request`** — authenticated, body `{ newEmail }` validated with `@IsGmailAddress()` (from the earlier Groupy/Enrollment Portal work). Before sending anything: call `isPersonalEmailInUse(newEmail, excludeAccountId: req.user.id)`. If already in use, reject immediately with a clear error — don't waste an OTP send on a request that can't succeed. Otherwise send OTP to `newEmail`.

3. **`POST /profile/personal-email/change-verify`** — authenticated, body `{ newEmail, code }`. Verify the OTP via existing OTP logic. **Re-check `isPersonalEmailInUse(newEmail, excludeAccountId: req.user.id)` again right before committing** — this closes the race-condition window between the first check and now (someone else could have claimed it in between). If still clear, update `Profile.personal_email = newEmail` for `req.user`'s account. If the re-check now fails, return a clear "this email was just claimed by another account, please try a different one" error rather than a raw DB constraint violation.

4. Wrap the final update in a try/catch for the DB-level unique constraint from Phase 1 as a last-resort safety net (in case of a genuine race condition even after the re-check) — catch the constraint violation specifically and return the same friendly "already claimed" message, not a raw 500.

## Acceptance check

- Requesting a change to an already-in-use Gmail is rejected before any OTP is sent
- Verifying with the correct code updates `Profile.personal_email`
- A simulated race (email gets claimed by someone else between request and verify) is caught gracefully, not as a raw server error

---

## AI Prompt

```
Context: EduTool backend (NestJS). PersonalEmailRegistryService and
@IsGmailAddress() exist (Phase 1 and earlier work). This adds a self-service
"change my personal email" flow to the existing profile module.

Step 1 — investigate: read profile.controller.ts, profile.service.ts,
profile.repository.ts. Also re-read AuthRepository's OTP methods (createOtp,
findValidOtp, markOtpUsed) and check whether an Otp purpose enum already
exists from earlier work — report how to add a distinguishable purpose value
for this use case (e.g. 'personal_email_change') if one exists, or how OTP
purpose is currently differentiated if there's no enum.

Step 2: Add POST /profile/personal-email/change-request (authenticated) —
{ newEmail } validated with @IsGmailAddress(). Call
PersonalEmailRegistryService.isPersonalEmailInUse(newEmail, req.user.id) —
if true, reject immediately with a clear error, do not send an OTP. If
false, send an OTP to newEmail via the existing OTP mechanism.

Step 3: Add POST /profile/personal-email/change-verify (authenticated) —
{ newEmail, code }. Verify via existing OTP logic. Re-run
isPersonalEmailInUse(newEmail, req.user.id) again right before the update —
if it now returns true (race condition — someone else claimed it in the
interim), return a friendly "this email was just claimed, try a different
one" error rather than proceeding. Otherwise update Profile.personal_email
for req.user's account.

Step 4: Wrap the final Prisma update in a try/catch specifically for the
unique constraint violation as a last-resort safety net, returning the same
friendly message rather than a raw 500 if it somehow still triggers after
the Step 3 re-check.

Show me your Step 1 findings first, then diffs.
```
