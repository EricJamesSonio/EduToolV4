# TICK-SCHOOLYEAR-001 — Clickable readiness issues on the school year detail page

Status: ready-for-review
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

- [x] `ReadinessIssue.entities[].type` present on every aggregated issue
- [x] `ref.programId` present on `course` and `strand` refs
- [x] `class_no_grading_scheme` chip label is disambiguated (`Subject · Section`)
- [x] Detail page: per-entity issues link to their entity
- [x] Detail page: aggregated issues render clickable entity chips
- [x] `+N more` chip when `count > entities.length`
- [x] `missing_start_date` and unknown codes render as plain text (no broken link)
- [x] Unit test covers every issue code + the null/unknown fallbacks
- [x] lint + typecheck show 0 new errors vs baseline; tests green

## Confidence

- Score: 94/100 (Requirement 20, Codebase verification 20, Architecture 20,
  Edge cases 18, Blast radius 16). Raised from 92 after implementation: every
  route in the table was re-verified against a real page in this worktree, and
  the one assumption that could have produced a Prisma type error
  (`Class.section` relation) was caught and resolved during coding.
- Assumption (disclosed, unchanged): `subject_no_class` routes to the subject
  page `/admin/subjects/{id}` per explicit user request. `/admin/classes?subjectId=`
  would auto-open the Create Class dialog and is arguably the more direct fix —
  a one-line change in `readinessTargets.ts` if the user prefers it.
- Not touched by design (user scope decision): the readiness dialog chips in
  `SchoolYearReadinessDialog.tsx` and the two Enrollment-page issue lists. The
  dialog is the same dead-end from the School Years list page — flagged as
  follow-up work, not this ticket.

## Tests

- Targeted: frontend `readinessTargets.test.ts` 11/11 green. Backend
  `jest src/modules/school-year` 5 passed / 2 failed — **identical to baseline**
  (both failures are pre-existing, in `maybeAutoSeed`/`db.organization`, an area
  this ticket does not touch).
- Full suite: frontend `jest` 20 suites / 210 tests green.
  `tsc --noEmit` error set **byte-identical** to a clean baseline worktree at
  `d47328d0` (20 pre-existing, 0 new — verified by `Compare-Object` on the
  normalized error lists, not just a count). `eslint` identical to baseline
  (1 pre-existing error + 2 warnings, none in touched files).
  Backend `tsc --noEmit` 0 errors. `prisma validate` fails only on a missing
  `DATABASE_URL` env var — pre-existing, no schema change was made.
- Development integration: not run (branch not merged; per branch model the
  reviewer merges then re-runs the full suite on `development`).

## Blocker

None.

## Activity Log

- 2026-09-30 — Ticket claimed. Worktree created off `development` @ `d47328d0`.
  Root cause traced: `pushList` emits untyped `entities`, so the UI cannot route
  aggregated issues. Widen the union to include `section`/`class`.
- 2026-09-30 — Mid-implementation discovery: `Class` has **no `section`
  relation** in `schema.prisma` (only the `section_id` column; the service
  already notes this). A nested `section: { select: ... }` would have been a
  Prisma type error. Resolved by mapping section names from the `sections` list
  already loaded for `section_no_class` — no extra query, no N+1.
- 2026-09-30 — Confidence re-scored 92 → 94 (see above).
- 2026-09-30 — Verified against a real baseline rather than the ticket's
  remembered "17 errors": that number predates this commit. Measured both sides
  at `d47328d0`; the true baseline is 20, and the change adds none. Recorded so
  the reviewer does not re-baseline on 17.

## Commits

- `c757be32` — feat(school-year): make readiness issues on the detail page
  clickable (5 files, +403/-24)

## Notes

`school-years/[id]/page.tsx` shows dirty in the main worktree only as an
LF↔CRLF artifact — content is clean, so branching from `development` is safe.

Route table (all targets verified to exist in this worktree):

| Issue | Route |
|---|---|
| `subject_no_class` | `/admin/subjects/{id}` |
| `section_no_class` | `/admin/sections/{id}?schoolYearId={sy}` |
| `class_no_grading_scheme` | `/admin/classes/{id}` |
| `program_no_calendar` / `_no_grading_scale` / `_no_semester_assignment` / `_semester_dates_incomplete` / `program_no_levels` | `/admin/programs/{id}` |
| `course_no_level` | `/admin/programs/{programId}/courses/{id}` |
| `strand_no_level` | `/admin/programs/{programId}/strands/{id}` |
| `level_no_sections` / `level_no_subjects` | `/admin/school-years/{sy}/levels` (no per-level page exists) |
| `missing_start_date`, `no_programs` | not linkable — plain text |

Suggested follow-up (not this ticket): the same clickable treatment for
`SchoolYearReadinessDialog.tsx` — it renders `issue.entities` as inert chips and
now has the `type` it needs, so the work is a few lines. Plus the two
Enrollment-page issue lists.
