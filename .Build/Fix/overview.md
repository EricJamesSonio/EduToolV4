# Personal Email Integrity Fix + Change-Email Feature — Overview

## What this is

A bug fix, not a new feature: the Admin Account Request and Enrollment Portal flows each only check _their own_ table for "has this Gmail applied before" — neither checks whether that Gmail already belongs to an **approved account anywhere else in the system**. This let the same Gmail end up as `Profile.personal_email` on both an admin `Account` and a student `Account` simultaneously. Alongside the fix, this adds a genuine missing capability: changing your personal email later (e.g. if you lose access to the original Gmail).

Also folds in a scope-reduction fix to the Admin Account Request feature: approval currently auto-creates an `Organization`, which shouldn't happen — the admin should create their org themselves, by choice, after logging in for the first time.

## The core fix

**One shared check, called from three places** — not duplicated logic in each flow:

```ts
isPersonalEmailInUse(email: string, excludeAccountId?: string): Promise<boolean>
```

Checks `Profile.personal_email` against **actual accounts only** — pending `RegistrationRequest`/`EnrollmentApplication` rows don't count as "in use" (two different real people can have simultaneous pending applications; the bug was two _approved_ accounts sharing an email, not two pending ones). `excludeAccountId` lets the email-change flow check the new value without falsely flagging it against the account making the change.

Called from:

1. Admin Account Request — OTP-verify step
2. Enrollment Portal — OTP-verify step
3. New — Change Personal Email flow, right before committing

**DB-level backstop**: `Profile.personal_email` becomes `@unique` (nullable-unique — multiple `null`s allowed, only real duplicate values get blocked). This requires manually resolving the existing duplicate in your database first — **do not let an AI agent auto-decide which of the two currently-duplicate accounts keeps the email**, that's a judgment call for a human, not a technical one. The migration will fail if run before this cleanup.

## Behavior changes

- **Admin approval no longer creates an `Organization`.** Approval creates `Account` (`org_id: null`, `role: admin`) + `Profile` only. On first login, the existing org-setup flow (`OrganizationSetupForm.tsx`/`OrganizationRequiredDialog.tsx`) triggers naturally off the `org_id: null` state — this already exists, reuse it, don't build a new modal.
- **Re-verifying with a Gmail that already has an account** (in either flow) returns a clear, generic message — _"This Gmail is already linked to an account in EduTool"_ — before any session issues and before any old application data is shown. Deliberately generic, not role-specific (doesn't confirm whether the existing account is admin/educator/student — avoids leaking that information to an anonymous form).
- **Changing your personal email** (any role, from account settings): enter new Gmail → OTP sent to it → verify → uniqueness re-checked right before commit (closes the race-condition window between check and write) → `Profile.personal_email` updated.

## Phase map

| Phase | Layer    | Delivers                                                                              |
| ----- | -------- | ------------------------------------------------------------------------------------- |
| 1     | Backend  | Shared uniqueness service + DB constraint (manual cleanup step called out explicitly) |
| 2     | Backend  | Admin approval: remove org auto-creation                                              |
| 3     | Backend  | "Already have an account" blocking at OTP-verify, both flows                          |
| 4     | Backend  | Change Personal Email (OTP send/verify/commit)                                        |
| 5     | Frontend | Org-creation trigger wiring + updated blocking messaging                              |
| 6     | Frontend | Change Personal Email UI in account settings                                          |
