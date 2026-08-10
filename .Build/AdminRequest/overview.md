# Admin Account Request — Project Overview

## What this is

An **upgrade of the existing registration-request flow**, not a new parallel system. `Otp`, `RegistrationRequest`, the `platform-registration` module, `AuthService.register()`/`verifyOtp()`, and `AuthRepository.createAccount()`/`MailService.sendCredentialsEmail()` already exist and already do most of this — this feature brings that flow up to the same UX standard as the Enrollment Portal: personal-Gmail lookup for view/edit access, a time-limited session instead of one-shot submission, and per-field revision flagging.

**Every phase in this feature starts with investigating the specific existing files named below before writing new code.** This is not optional scaffolding advice — most of the real logic already exists and duplicating it is the failure mode to avoid here.

## Key decisions locked in

- **No application code.** Personal Gmail is the sole lookup key (unlike the Enrollment Portal, which uses a 4-char code).
- **Gmail-only, strictly.** The personal email field must match `@gmail.com` exactly — no other providers. This applies to the shared submission and view/edit endpoints in this feature, **and is retrofitted onto the existing Enrollment Portal's `personal_email` field** (Phase 1 covers both).
- **Format validation at submit, deliverability proven by the existing OTP send/verify step.** No third-party email-verification API — the OTP flow already proves the address is real and reachable, for free, as a side effect.
- **Login email is system-generated, decoupled from the personal Gmail**: `{gmailLocalPart}@admin.relief-ed` (e.g. `ericjamessonio7@gmail.com` → `ericjamessonio7@admin.relief-ed`). No collision-disambiguator needed — Gmail guarantees local-part uniqueness globally, and since only `@gmail.com` is accepted, that guarantee transfers directly to this generated address.
- **Personal Gmail is notification-only** — same relationship `Profile.personal_email` already has for students. Never the login email.
- **2-hour session**, ends manually or on expiry — reuse the Enrollment Portal's existing session mechanism (`enrollment-session.guard.ts` / `enrollment-session.decorator.ts`), don't rebuild it.
- **Per-field revision flagging**: platform owner can flag individual fields (e.g. `institution_name: "Please provide the full legal name"`), each with its own short note. On resubmission, all flags clear and status returns to `pending` for full re-review — same auto-reopen convention used in the Concern Center feature.
- **Three outcomes on review**: approve (creates account, emails credentials), reject (emails a rejection notice), request-revision (emails a notice + flags specific fields, applicant sees "!" markers next time they access the form via Gmail lookup).

## Data model changes

**`RegistrationStatus` enum** — add `needs_revision` alongside existing `pending | approved | rejected`.

**`RegistrationRequest`** — add:

- `revision_notes Json?` — `{ [fieldName: string]: string }`, cleared entirely on resubmission
- `reviewed_by String?`, `reviewed_at DateTime?` (if not already present)
- Confirm whether `full_name`, `institution_name`, etc. are already editable in place, or whether an edit creates a new row — **investigate first**, this affects Phase 2's design directly.

**Shared Gmail validator** — a reusable `class-validator` custom decorator (e.g. `@IsGmailAddress()`), added once, used in both this feature's DTO and retrofitted onto the Enrollment Portal's `personal_email` field. Do not duplicate the regex/logic in two places.

**Login email generation** — a small utility function, `generateAdminLoginEmail(personalGmail: string): string`, extracting the local part and appending `@admin.relief-ed` (treat the domain as a named constant, not a magic string scattered across files).

## Phase map

| Phase | Layer    | Delivers                                                                                     |
| ----- | -------- | -------------------------------------------------------------------------------------------- |
| 1     | Backend  | Schema changes + shared Gmail validator (applied here AND retrofitted to Enrollment Portal)  |
| 2     | Backend  | Public submit / Gmail-lookup / view-edit endpoints + 2hr session reuse                       |
| 3     | Backend  | Platform owner review actions (approve / reject / request-revision) + login email generation |
| 4     | Backend  | Notification emails (credentials, rejection, revision-needed)                                |
| 5     | Frontend | Public request form (submit / lookup / edit, session-aware, shows "!" flags)                 |
| 6     | Frontend | Platform owner review UI (approve / reject / per-field flagging)                             |

Each phase file has an investigate-first step naming the specific existing files to read, a step list, and a ready-to-paste AI prompt.
