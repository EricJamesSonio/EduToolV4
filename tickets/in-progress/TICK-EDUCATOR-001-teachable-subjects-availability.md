# TICK-EDUCATOR-001 — Teachable subjects and availability (Phases 3 & 4)

Status: ready-for-review
Priority: high
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Branch: development (owner-directed; no feature worktree)
Plans: auto-class/phase-3-educator-teachable-subjects.md,
       auto-class/phase-4-educator-availability.md
Depends on: TICK-ORG-002 (active weekdays), TICK-SUBJECT-002 (session reqs)
Commits: 9b829e6b (backend), 4bc2a275 (frontend)

## Problem

The generator cannot pick an educator without knowing two things: which
subjects they can teach, and which days they are available. Neither exists.
Today an educator is only linked to a subject once a class is created — far too
late to plan — and availability is unknowable.

## Goal

1. `EducatorSubject`: which subjects an educator can teach, declared up front.
2. `EducatorScheduleProfile`: which weekdays they are available + load limits.
3. Both loadable in ONE query for the generator's whole faculty scope.
4. Nothing forces an admin to configure either — absent means "everything".

## Relevant Areas

- backend/prisma/schema.prisma (EducatorSubject, EducatorScheduleProfile)
- backend/src/modules/educator/* (new repository/service/module/controller routes)
- backend/src/modules/subject/subject.controller.ts (GET /subjects/:id/educators)
- backend/src/modules/org-schedule-config/schedule-window.provider.ts

## Acceptance Criteria

- [x] GET/PUT /educators/:id/subjects, replace-set semantics
- [x] Cross-org subject ids are rejected (a typo must not shrink a profile)
- [x] GET /subjects/:id/educators
- [x] Carry-over between school years, reporting what it could not match
- [x] GET/PUT /educators/:id/schedule-profile with effective weekdays resolved
- [x] Custom weekdays intersected with the org's school days at read time
- [x] Narrowing availability warns, never blocks, never moves a class
- [x] Batched eligibility loader for the generator (single query per scope)
- [x] Tests for replace-set, intersection, validation, and carry-over matching

## Confidence

- Score: 92%
- Measured, both stacks:
  - backend `tsc --noEmit`: 0 errors; unit 1044 passing (+26 new over the 1017
    baseline for this ticket); failing set unchanged at the same 7 pre-existing
    suites / 24 tests
  - frontend `tsc`: unchanged at its 20-error pre-existing baseline, none in
    touched files; unit 270/270; eslint clean
- Disclosed: the schema diff was verified purely additive (`git diff | grep '^-'`
  is empty), because an earlier edit of mine did silently drop the
  `model SubjectSharing {` line and broke the schema.

## Tests

- `educator-subject.spec.ts` (10): dedupe, org validation, audit, clear-all,
  carry-over same-year refusal, name+type+level match, same-name-different-level
  NOT matching, unmatched reporting, links outside the source year ignored,
  one grouped write per educator
- `educator-schedule-profile.spec.ts` (16): intersection semantics incl. empty
  intersection and unknown org week, default with no row, default with a
  non-opted-in row, validation (empty custom set, out-of-range weekday,
  non-positive limits, perDay > perWeek), stale weekdays cleared on opt-out,
  outside-availability warning count

## Blocker

None.

## Activity Log

2026-09-30 — Filed and implemented (9b829e6b) after TICK-SUBJECT-002.

2026-09-30 — Frontend added (4bc2a275): educator detail page now has a school-year
selector plus a card with both sections; searchable multi-select for teachable
subjects and a weekday/limits editor for availability.

2026-09-30 — Two self-corrections during the work:
- An edit silently deleted `model SubjectSharing {` from schema.prisma. Caught
  by `prisma generate` failing with P1012, then confirmed the fix with a
  purely-additive diff check.
- I initially gave `EducatorSubject` the same repository shape twice (raw row
  in `findOne`, mapped row in `upsert`), which did not typecheck. Unified both
  on the raw Prisma row and mapped in one place, in the service.
- The UI kit here is Base UI, not Radix: `PopoverTrigger` renders its own button
  and accepts neither `asChild` nor children. Cost two iterations; noted in the
  commit so the next person does not repeat it.

## Commits

- 9b829e6b — feat(educator): teachable subjects and availability for the generator
- 4bc2a275 — feat(educator): teachable subjects and availability UI

## Notes

**Corrected from the plan:** it assumed `Subject` is soft-managed and suggested
cascade. `Subject` has NO `deleted_at` — it is hard deleted. So the relation is
`ON DELETE RESTRICT`, which makes deleting a still-taught subject fail loudly
instead of silently orphaning an educator's profile. Cascade is correct on the
educator side.

**Corrected from the plan:** it said to "exclude deleted or suspended"
educators. The rule applied is `status = 'active'`, since AccountStatus also
carries pending/dropped/transferred/graduated, all of which must be excluded.

**Module layout:** both features live in a standalone `EducatorPlanningModule`
rather than inside `EducatorModule`. EducatorModule already imports
ClassModule, which reaches back toward subject; adding the org schedule config
dependency there would risk a circular module graph. `DatabaseModule` is
`@Global`, so the standalone module needs no database import.

**Still open:** the manual class dialog does not yet surface a "suggested"
educator from teachable subjects, even though `useSubjectEducators` now exists
for it. That is the last Phase 3/4 acceptance item and belongs with the
generator UI, since both touch the same dialog.
