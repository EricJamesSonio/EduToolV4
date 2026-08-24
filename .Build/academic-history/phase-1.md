# Phase 1 — Schema Migration

**Mode:** Start in Plan Mode (`01-rules-planmode.md`). Build Mode only after Eric approves the plan summary (`02-rules-buildmode.md`).

**Depends on:** Phase 0 signed off, including the open decision resolved.

## Goal

Add the new enums, columns, tables, and the partial unique index. No service or controller logic in this phase — schema only.

## Files to read before planning

- `backend/prisma/schema.prisma` (re-read fresh — do not reuse what Phase 0 read if any time has passed)
- The most recent 2–3 migration folders under `backend/prisma/migrations/` to confirm current migration-naming and raw-SQL-append conventions used in this repo (e.g. how `20260807210646_add_enrollment_portal` mixes generated DDL with hand-written backfill SQL)

## Planned schema changes

1. New enums:
   - `ProgramEnrollmentStatus` (`active`, `ended`)
   - `ProgramEnrollmentEndReason` (`shifted`, `completed`, `withdrawn`, `dropped`, `admin_correction`, `other`)
   - `ClassEnrollmentOutcome` (`passed`, `failed`, `dropped`, `withdrawn`, `withdrawn_due_to_shifting`, `transferred_credited`, `completed`)
2. `StudentProgramEnrollment`: change `status` type from `EnrollmentStatus` to `ProgramEnrollmentStatus`; add `end_reason ProgramEnrollmentEndReason?`, `ended_at DateTime?`, `ended_by String?`. Remove `@@unique([student_school_year_id, program_id])`.
3. `Enrollment`: add `outcome ClassEnrollmentOutcome?`, `outcome_reason String?`, `outcome_set_at DateTime?`, `outcome_set_by String?`, `shift_event_id String?` + relation to `ProgramShiftEvent`.
4. New model `ProgramShiftEvent`: `id`, `org_id`, `student_school_year_id`, `from_program_enrollment_id` (unique FK), `to_program_enrollment_id` (unique FK), `default_outcome_used ClassEnrollmentOutcome`, `actor_id`, `created_at`; back-relation to affected `Enrollment[]`.
5. `OrgEnrollmentSetting`: add `default_shift_outcome ClassEnrollmentOutcome @default(dropped)`.
6. Raw SQL appended to the generated migration: drop the old full unique index on `StudentProgramEnrollment`, create a partial unique index `WHERE status = 'active'` on `(student_school_year_id, program_id)`.

## Before applying — required check

Run `SELECT DISTINCT status FROM "StudentProgramEnrollment";` against a dev/staging DB copy before changing the column's enum type. Confirm only `active` (and possibly `pending`/`removed` if ever used, though prior investigation suggests only `active` occurs in practice) values exist. Report actual output.

If Prisma's generated diff for the `status` type change looks like a destructive drop-and-recreate rather than a clean `ALTER TYPE ... USING` cast, stop and report the exact generated SQL before running it — this column has real student data, don't apply speculatively.

## Build Mode steps

1. Edit `schema.prisma` per the plan above.
2. `npx prisma migrate dev --name academic_history_schema` (or whatever name Eric prefers — ask if unspecified, this is a naming/scope question worth a quick confirm, not necessarily a full stop).
3. Manually append the partial-unique-index raw SQL into the generated migration.sql. Do not rely on schema.prisma syntax to express the partial condition (this project doesn't have Prisma's extended-indexes preview feature enabled — confirm this is still true in `generator client { previewFeatures = [...] }` before assuming).
4. `npx prisma generate`.
5. `npx tsc --noEmit` — expect new errors in downstream files (that's expected and fine, Phase 2 fixes those; just confirm the errors are all in files Phase 2 will touch, not something unrelated breaking).

## Stop conditions

- Destructive-looking DDL on `StudentProgramEnrollment.status` (see above).
- `previewFeatures` already includes something that changes how partial indexes should be expressed — re-verify before hand-writing raw SQL.
- Any existing migration in the folder already touches these same tables in a way not accounted for here (re-check migration history for drift since this plan was written).

## Exit criteria

- Migration applies clean on a dev DB.
- Generated migration.sql inspected manually and confirmed to contain the correct partial index syntax before commit.
- `npx tsc --noEmit` run and errors triaged (expected downstream breakage listed, nothing unexpected).
- Gates from `02-rules-buildmode.md` run where applicable (lint on the schema/migration files themselves is N/A, but don't skip the check).
- Eric reviews and approves before Phase 2 begins.
