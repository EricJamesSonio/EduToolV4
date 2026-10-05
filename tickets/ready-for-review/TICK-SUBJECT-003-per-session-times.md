# TICK-SUBJECT-003 — Per-session weekly session times (Edit Subject modal)

Status: ready-for-review
Priority: medium
Created: 2026-10-04
Created by: agent
Assigned to: agent
Started: 2026-10-04
Worktree: ../EduToolV4-worktrees/TICK-SUBJECT-003-per-session-times
Branch: agent/TICK-SUBJECT-003-per-session-times (pushed)

## Problem

1. **The Edit Subject dialog does not show the subject's current weekly
   sessions.** In `/admin/subjects/[id]` the summary row correctly reads
   `5 x 60m (department default)`, but opening Edit shows the count select on
   `Default` and both time inputs EMPTY. Not a data bug — the row genuinely
   stores `sessions_per_week = NULL` / `session_minutes = NULL`, so
   `toSessionFields(null, null)` renders blank. The numbers that are actually
   IN EFFECT exist only as a small "(currently 5 x 60m)" helper string, so the
   dialog looks unconfigured when it is not. The modal is also cramped
   (`size="md"`) for the data it carries.
2. **All weekly sessions must share one length.** `Subject.session_minutes` is
   a single scalar, so a subject that meets e.g. Mon/Wed for 60m and Fri for
   120m cannot be expressed, and the generator places every slot at the same
   duration.

## Goal

1. Show the subject's real, effective weekly sessions in the Edit dialog — a
   default subject opens displaying its resolved department-standard values,
   read-only, instead of blank inputs.
2. Widen the dialog and give weekly sessions their own labelled section
   stating it is optional and only needed for automated class generation.
3. Allow each weekly session its own length, with an **Apply to all** helper so
   a uniform schedule stays a single action.
4. The generator honours each position's own length.

## Relevant Areas

- .ai/shared/skills/frontend/MUST-HAVES.md
- .ai/shared/skills/testing/MUST-HAVES.md
- .ai/shared/rules/database-migrations.md
- .ai/shared/rules/confidence-gating.md
- backend/prisma/schema.prisma (Subject)
- backend/prisma/migrations/<new>_subject_session_durations
- backend/src/modules/subject/{subject-session-defaults,subject.mapper,subject.types,subject.service,subject.repository,dto/subject.dto}
- backend/src/modules/class-generator/class-generator.service.ts (placeSlots, capacity, MAX guard)
- backend/src/modules/educator/{educator-subject.repository,educator-subject.service}.ts
- frontend/src/components/admin/subject/{SubjectDialog,SubjectPresetButton}.tsx
- frontend/src/app/admin/subjects/[id]/page.tsx
- frontend/src/{types/admin/subject.types.ts,api/admin/subject.api.ts,hooks/admin/useSubjectPreset.ts}

## Acceptance Criteria

- [x] `[]` durations means uniform and uses `session_minutes`; existing rows behave identically
- [x] Non-empty durations must have length === sessions_per_week; mismatch rejected server-side
- [x] Changing sessions_per_week on edit resets durations or rejects; never left stale
- [x] When `source` is `default`, the department standard wins and stored durations are ignored
- [x] Stored values are never prefilled from resolved defaults; only "Custom schedule" makes a subject explicit
- [x] `sessionMinutes` stays consistent for existing consumers
- [x] Uniform subjects produce byte-identical generator placements before/after
- [x] Mixed durations placed per position; capacity uses sum; MAX guard uses max
- [x] Migration is additive only, applied on a scratch DB, SQL reported first

## Confidence

- Score: 96/100 (post-verification).
- Pre-implementation was 92; raised only after the migration was actually
  applied and both suites were run.
- Measured:
  - backend `tsc --noEmit`: 0 errors
  - backend full unit: 1153 passed / 1179 total, 9 failing suites —
    IDENTICAL to the `e4f0c6f4` baseline (same 9 suites, same 26 tests,
    verified by running the baseline in a throwaway worktree). Net effect of
    this ticket: +22 passing tests, 0 new failures.
  - frontend `tsc --noEmit`: 20 errors, the documented pre-existing
    baseline, ZERO in any subject file (verified per-file)
  - frontend full unit: 299/299 passing, 29/29 suites
  - eslint clean on every touched file
  - migration: all 96 migrations applied on scratch DB `edutool_scratch_003`
    via `migrate deploy` (never `reset`); column verified as
    `session_durations | ARRAY | NOT NULL | ARRAY[]::integer[]`, and a
    legacy-shaped row reads back `{}`
- Gaps: no live generator run against a seeded org (no app instance here), and
  the migration was proven on a scratch DB, not on `edutool`/`edutool_shadow`.
  Both are covered by the manual QA checklist.

## Tests

- Targeted backend: `subject-session-defaults` (+7), `subject.service` (+7),
  `class-generator.service` (+8, incl. a uniform-regression guard and a
  mutation-verified capacity test)
- Targeted frontend: `SubjectDialog.test.tsx` (+9), incl. the untouched-draft
  case that is the actual reported bug
- Full suite: backend 1153 passed (baseline-identical failures), frontend
  299/299, backend tsc 0, frontend tsc 20 (pre-existing), lint clean
- Development integration: not run (reviewer merges)

## Blocker

None.

## Activity Log

2026-10-04 — Claimed (counter SUBJECT 2 -> 3). Worktree off origin/development
(e4f0c6f4); `.ai/shared` submodule initialised at pinned c09788be.

2026-10-04 — Migration SQL reported to owner before any database was touched,
then applied to a throwaway `edutool_scratch_003` only. `edutool` and
`edutool_shadow` were never written to.

2026-10-04 — Committed in 4 revertable steps (a/b/c/d as agreed). Branch
pushed. Ticket to ready-for-review.

2026-10-04 — Self-correction: the "custom count becomes explicit" test failed
mid-work. The draft collapsed a deliberately-chosen value back to the standard
whenever the numbers happened to coincide with it, which silently dropped the
user's choice. Added a `touched` flag to the draft: touching the control makes
the subject explicit, opening it does not.

2026-10-04 — Self-correction: verified the new capacity test actually
discriminates by temporarily reverting `sum(durations)` to
`positions * minutes`; the test failed as intended, then the implementation
was restored. A test that passes both ways proves nothing.

2026-10-04 — Incident (no code impact): a `node_modules` junction created to
share deps with a throwaway verification worktree caused
`git worktree remove --force` to recursively delete the real `node_modules`
of THIS worktree. Recovered with `npm ci` + `prisma generate` (npm blocked the
prisma postinstall). All source was already committed and unaffected; full
suites were re-run after recovery and match the numbers above.

## Commits

- 3497b7cd — feat(subject): per-session weekly times via session_durations
- 0596b59a — feat(class-generator): place each weekly session at its own length
- 548a81a7 — feat(subject): show current weekly sessions and edit each one
- 87588a1c — feat(subject): carry per-session times through the subject preset
- Branch: agent/TICK-SUBJECT-003-per-session-times (off origin/development e4f0c6f4, pushed)

## Notes

Design: `Subject.session_durations Int[] @default([])`. Empty = uniform, which
is how every pre-existing row is stored, so there is no backfill and no
behaviour change for anyone. The resolver now returns `durations` alongside
the unchanged `sessionMinutes`; the base stays the uniform representative so
the ~6 existing consumers keep working untouched.

`touched` on the frontend draft exists because "picked 3/week where the
standard is 3" and "never opened the control" produce identical values. Only
an explicit interaction can tell them apart, and only the former may write an
explicit requirement.

Scope note (agreed): commit D also wires the preset's weekly sessions into the
New Subject form. They were collected by the preset UI but never passed to the
dialog, so the values were already being dropped — carrying per-session
lengths without fixing that would have kept producing subjects shaped
differently from the configured preset.
