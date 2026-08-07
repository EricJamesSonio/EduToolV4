# Phase 4 — Approval → Account Creation

## Goal

On approve, produce a real `Account` + `Profile` + `StudentSchoolYear` + `StudentProgramEnrollment` by calling the _existing_ enrollment logic — this phase should add almost no new business logic of its own.

## Step 1 — Audit before writing anything

- `modules/student-enrollment/student-enrollment.service.ts` + `.repository.ts` and `modules/enrollment/enrollment.service.ts` — read both. Determine which one actually owns "create Account + Profile + StudentSchoolYear + StudentProgramEnrollment" for a registrar manually adding a student today, and its exact method signature, required inputs, and transaction boundaries.
- `modules/student/student.service.ts` + `student.utils.ts` — find the existing username/password generation used for bulk student creation (`BulkCreateStudentDialog` on the frontend implies a backend counterpart). Reuse it — do not write a second credential generator.
- `mail.service.ts` — find the existing "here are your login credentials" email (already used for educator/admin/student account creation elsewhere) and reuse that template/method for the applicant's approval email, rather than writing a new one.
- `modules/section/` — check for any existing capacity-check helper before writing new fill logic.

## Step 2 — Build only the genuinely new piece

The only new logic in this phase is **section auto-assignment**, since nothing today auto-fills a section by order:

- Given `program_id`/`level_id` (and `course_id`/`strand_id` if applicable) from the application, list eligible sections ordered by `order_index`.
- Pick the first section where `enrolled_count < capacity`.
- If none have room: leave `section_id` null, and fire the existing notification (Phase 3) to org admins/registrars — do not block the approval on this; confirm with existing enrollment logic whether a null section is an acceptable state (check if `StudentProgramEnrollment.section_id` is nullable — if it isn't, this needs a Phase 1 follow-up before proceeding, don't force a null into a non-null column).

## Step 3 — Wire the approval flow

In `enrollment-portal/registrar` approve handler:

1. Auto-assign section (Step 2).
2. Call the existing enrollment-creation service directly — same call a registrar would trigger manually today — passing the application's program/course/strand/level/section and personal info (mapped into whatever DTO that service already expects; do not bypass its validation).
3. In the same DB transaction (or the same logical unit the existing service already uses): set `EnrollmentApplication.status = approved`, `resulting_account_id`, `reviewed_by`, `reviewed_at`.
4. Copy `personal_email` into the new `Profile.personal_email` (field already exists per Phase 1 audit).
5. Send credentials email via the reused mail method to `personal_email`.

## Acceptance

- No duplicate "create a student account" code path exists — grep for the existing service's usages after this phase to confirm the new call site is the only addition, not a parallel implementation.
- If approval fails partway, no orphaned `Account` without a matching `EnrollmentApplication.status = approved` (and vice versa) — whatever transaction/rollback guarantee the existing service already provides should be preserved, not weakened by wrapping it.
