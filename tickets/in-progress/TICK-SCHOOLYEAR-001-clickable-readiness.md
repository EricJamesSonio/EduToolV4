# TICK-SCHOOLYEAR-001 — Clickable readiness issues on the school year detail page

Status: in-progress
Priority: medium
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Worktree: ../EduToolV4-worktrees/TICK-SCHOOLYEAR-001-clickable-readiness
Branch: agent/TICK-SCHOOLYEAR-001-clickable-readiness

## Problem

The school year readiness banner on `/admin/school-years/[id]` renders every
issue as a dead `<span>`, so an admin told "1 subject(s) in this school year have
no class created" has no way to act on it from where the problem is reported.

Aggregated issues (the `subject_no_class` line in the report) are the blocker to
fixing this: they come from `pushList` as `entities: [{ id, name }]` with **no
type**, so the frontend cannot tell a subject ID from a section or class ID and
cannot build a route. Per-entity issues already carry `ref.type` but are equally
unlinked in the UI.

## Goal

1. Backend: aggregated readiness entities carry a `type`, so the frontend gets an
   explicit typed contract instead of guessing from the issue code.
2. Backend: course/strand refs carry `programId` (their detail pages are nested
   under the program and are unusable without it).
3. Frontend: every readiness issue on the school year detail page navigates to the
   entity it names; issues that cannot be linked degrade to plain text.
4. Aggregated issues list their affected entities as clickable chips, with a
   "+N more" overflow when the backend cap (10) truncates the list.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md (component + styling)
- shared/skills/backend/MUST-HAVES.md (response shape, no new query)
- shared/skills/testing/MUST-HAVES.md
- backend/src/modules/school-year/school-year-readiness.service.ts
- frontend/src/types/admin/school-year.types.ts
- frontend/src/app/admin/school-years/[id]/page.tsx

## Acceptance Criteria

- [ ] `ReadinessIssue.entities[].type` present on every aggregated issue
- [ ] `ref.programId` present on `course` and `strand` refs
- [ ] `class_no_grading_scheme` chip label is disambiguated (`Subject · Section`)
- [ ] Detail page: per-entity issues link to their entity
- [ ] Detail page: aggregated issues render clickable entity chips
- [ ] `+N more` chip when `count > entities.length`
- [ ] `missing_start_date` and unknown codes render as plain text (no broken link)
- [ ] Unit test covers every issue code + the null/unknown fallbacks
- [ ] lint + typecheck show 0 new errors vs the 17-error baseline; tests green

## Confidence

- Score: 92/100 (Requirement 20, Codebase verification 20, Architecture 20,
  Edge cases 16, Blast radius 16).
- Assumption (80–94 band, disclosed): `subject_no_class` routes to the subject
  page `/admin/subjects/{id}` per explicit user request. `/admin/classes?subjectId=`
  would auto-open the Create Class dialog and is arguably the more direct fix —
  a one-line change in the route helper if the user prefers it.
- Not touched by design (user scope decision): the readiness dialog chips in
  `SchoolYearReadinessDialog.tsx` and the two Enrollment-page issue lists. The
  dialog is the same dead-end from the School Years list page — flagged as
  follow-up work, not this ticket.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

- 2026-09-30 — Ticket claimed. Worktree created off `development` @ `d47328d0`.
  Root cause traced: `pushList` emits untyped `entities`, so the UI cannot route
  aggregated issues. Widen the union to include `section`/`class`.

## Commits

(none yet)

## Notes

`school-years/[id]/page.tsx` shows dirty in the main worktree only as an
LF↔CRLF artifact — content is clean, so branching from `development` is safe.
