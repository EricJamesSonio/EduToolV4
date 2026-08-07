# Feature Overview — Public Enrollment Portal

Read this in full before touching Phase 1. It's the "why" and "what" behind every phase file. If anything in a phase file seems to conflict with this overview, this overview wins — the phase files are execution detail, this is intent.

## 1. What this feature is

A public, unauthenticated intake portal that lets a prospective student apply to an organization's school without an account, and lets a registrar review and approve those applications into real student accounts — using the enrollment machinery that already exists in this system.

It is **not** a new enrollment system. It's a new front door that, on approval, produces exactly the same `Account` + `Profile` + `StudentSchoolYear` + `StudentProgramEnrollment` records that a registrar creates manually today. If any phase finds itself duplicating that creation logic, it has gone off-track.

## 2. Actors

- **Applicant** — anonymous visitor, no account. Identified only by a personal email they verify via OTP each visit. Never logs in with a password until approved.
- **Registrar** — an `Account` with `role = admin` and `is_registrar = true`. Reviews, approves, rejects, and manually unlocks applications. Same person who does manual enrollment today, just with a new queue to work from.
- **System (scheduler)** — auto-locks applications at a configured date so registrars can start reviewing a stable batch.

## 3. Why it exists

Today, enrolling a student requires a registrar to manually enter everything through the admin panel. This feature lets the _applicant_ do the data entry (personal info, program/course/level selection) through a link the org shares publicly, and the registrar's job becomes review-and-approve instead of review-and-transcribe. Approval still goes through the same enrollment logic — this feature only changes _who_ fills the form and _when_ the account gets created (after human approval, not on submission).

## 4. End-to-end lifecycle (the story, in order)

1. A registrar opens an **enrollment period** for a specific school year: sets a name, a start date, an end date, and a lock date. This generates a shareable link (`/enroll/{org-slug}/{period-token}`). An org can have multiple periods (e.g. "Regular Batch," "Late Enrollees") and multiple periods can be open at once — the dates are entirely at the admin's discretion, including a period that only lasts one day.
2. An applicant opens the link. The portal shows what's available _for that school year specifically_ — programs, courses/strands, levels — because each school year can define a different set of programs (this is existing behavior in the system; the portal must respect it, not assume a fixed catalog).
3. Applicant enters their **personal email** and receives an OTP. This is the entire identity mechanism for the applicant side — there's no password, no account, just "prove you own this inbox."
4. On OTP verify, the system checks: has this email already applied for this org + school year? If yes → they're dropped into **edit mode** on their existing application. If no → they get a blank application form.
5. Applicant fills: personal details (name, age, address, contact, last school graduated), then Program → Course/Strand (conditional on program type, same rule the internal enrollment UI already uses) → Level. Confirms.
6. On confirm: an application record is created with status `pending` and a random 4-character code (letters + digits, scoped unique per org + school year — not globally unique, and not meant to be cryptographically strong, just a friendly lookup token).
7. Applicant can return anytime before the application locks: verify email again → edit the same application, or just look up their status by code without verifying.
8. As the period's **lock date** arrives, a scheduled sweep flips all still-`pending` applications for that period to `locked`. This doesn't close the period — new applicants can still apply right up to the **end date**, they just won't be able to edit after lock. The gap between lock date and end date is intentional: it gives the registrar a stable batch to start reviewing while the window is technically still open for latecomers.
9. If an applicant needs to edit after locking (typos, changed their mind on a program), they contact the registrar out-of-band and give their personal email or application code. The registrar looks it up and manually unlocks it (`locked → pending`).
10. The registrar works through applications (searchable by email, name, or code): approves or rejects.
    - **Approve**: triggers the existing enrollment-creation logic to produce `Account` + `Profile` + `StudentSchoolYear` + `StudentProgramEnrollment`. Section is _not_ chosen by the applicant — it's auto-assigned by walking sections in a defined fill order (e.g. Section A fills before Section B) and stopping at the first one with remaining capacity. If every section is full, the enrollment still needs a resolution path (see open item below) and the registrar gets notified to add capacity or create a new section. Credentials (username/password) are emailed to the applicant's personal email — this is the _only_ way they learn their new login, since there's no in-app notification target before an account exists. Status becomes `approved`, which is terminal — no more edits.
    - **Reject**: status becomes `rejected` with a required reason. The applicant can see this (by code lookup or next OTP login) and is free to edit and resubmit — rejection is not terminal, unlike approval.
11. Once approved, the applicant's personal email is carried into their new `Profile.personal_email`, so the system retains the link between "who they were as an applicant" and "who they are as a student" — useful for support/lookup later.

## 5. Core entities (conceptual — see Phase 1 for exact schema)

- **EnrollmentPeriod** — the "window" concept: which org, which school year, when it's open, when it locks, and the shareable token.
- **EnrollmentApplication** — the applicant's submission: identity (personal email), the data they entered, their program/course/level selection, and a status lifecycle (`pending → locked → approved`, or `pending/locked → rejected → pending` again on resubmit).
- Everything downstream of approval (`Account`, `Profile`, `StudentSchoolYear`, `StudentProgramEnrollment`) is **not new** — it's the existing enrollment data model, just populated from a different entry point.

## 6. Business rules locked in (with the reasoning, so they don't get reinterpreted mid-build)

- **One application per email per org per school year.** The personal email is the applicant's entire identity — this is why it's a unique constraint, and why OTP-verify is also the "do you already have an application" check.
- **Locking is time-based and automatic, but reversible by a human.** Nobody has to manually close each application; the scheduler handles the common case, and the registrar handles exceptions.
- **Approval is terminal, rejection is not.** Once someone's enrolled, editing an application makes no sense (the account already reflects a point-in-time decision). Rejection is meant to be correctable, not punitive.
- **Section assignment is never the applicant's choice.** Capacity management is a registrar/system concern, not something exposed publicly — otherwise applicants could see and reason about section fill state, and capacity races become a UX problem instead of a backend one.
- **No in-app notifications to the applicant, ever, before approval.** They have no account, so "notification" always means "email to personal_email" until the moment an `Account` exists.
- **Reuse, not reimplementation, for account creation.** This is the single most important constraint across all six phases — see phase files for the audit-first instruction this produces.

## 7. Explicitly out of scope for v1

- File/document uploads (report cards, IDs, etc.) — text fields only.
- Applicant-chosen section.
- Any in-app (non-email) communication with an applicant pre-approval.
- Cross-org application (one applicant, one org, one school year, one active application at a time — no "apply to multiple schools" concept here).

## 8. Open items that later phases may need to resolve, not guess at

- Whether `StudentProgramEnrollment.section_id` can be null (needed if every section is full at approval time) — if the existing schema doesn't allow it, this needs a decision before Phase 4 can be finished, not a silent workaround.
- Whether an application that passes `end_date` while still `locked` (never approved or rejected) needs its own terminal/expired state, or just stays `locked` indefinitely for manual registrar handling.

## 9. How to use this alongside the phase files

Read this overview once, fully, before Phase 1. Each phase file's "audit first" section tells you _where_ to verify system behavior mentioned here — this document tells you _why_ that behavior matters, so a shortcut that technically satisfies a phase's checklist but breaks something described here (e.g. exposing section fill state to applicants) should still be treated as wrong.
