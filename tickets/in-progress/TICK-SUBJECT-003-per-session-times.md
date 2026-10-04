# TICK-SUBJECT-003 — Per-session weekly session times (Edit Subject modal)

Status: in-progress
Priority: medium
Created: 2026-10-04
Created by: agent
Assigned to: agent
Started: 2026-10-04
Worktree: ../EduToolV4-worktrees/TICK-SUBJECT-003-per-session-times
Branch: agent/TICK-SUBJECT-003-per-session-times

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

- [ ] `[]` durations means uniform and uses `session_minutes`; existing rows behave identically
- [ ] Non-empty durations must have length === sessions_per_week; mismatch rejected server-side
- [ ] Changing sessions_per_week on edit resets durations or rejects; never left stale
- [ ] When `source` is `default`, the department standard wins and stored durations are ignored
- [ ] Stored values are never prefilled from resolved defaults; only "Custom schedule" makes a subject explicit
- [ ] `sessionMinutes` stays consistent for existing consumers
- [ ] Uniform subjects produce byte-identical generator placements before/after
- [ ] Mixed durations placed per position; capacity uses sum; MAX guard uses max
- [ ] Migration is additive only, applied on a scratch DB, SQL reported first

## Confidence

- Score: 92/100.
- Gaps: cannot verify the migration or a live generator run from the authoring
  session; per confidence-gating a schema migration caps the score below 95
  until it has actually been applied and the suites pass. Re-scored at the end.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-10-04 — Claimed (counter SUBJECT 2 -> 3). Worktree off origin/development
(e4f0c6f4); `.ai/shared` submodule initialised at pinned c09788be.

## Commits

(none yet)

## Notes

Plan agreed with owner: full-stack. Commit split a) migration+schema+resolver,
b) generator placement+capacity, c) UI, d) preset (explicitly scope-widening).
