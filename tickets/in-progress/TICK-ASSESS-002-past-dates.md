# TICK-ASSESS-002 — Block past dates in assessment creation (frontend + backend)

Status: ready-for-review
Priority: high
Created: 2026-09-28
Created by: agent
Assigned to: agent
Started: 2026-09-28
Worktree: ../EduToolV4-worktrees/TICK-ASSESS-002-past-dates
Branch: agent/TICK-ASSESS-002-past-dates

## Problem

`Step6.tsx:61-79` + `ManualStep2.tsx:154-172` use raw `<input type="datetime-local">` with no `min` and validation only `end > release` — past dates pass. Same in `ReopenDialog.tsx:102-106`. Backend `assessment-creation.helper.ts` has no past-date rejection. Shared `DatePicker` is capable but builder bypasses it.

## Goal

1. Shared util next to `frontend/src/lib/school-year-dates.ts`: `minDateTimeLocal()` + `isPastDateTime(value)`.
2. `min={minDateTimeLocal()}` on all 4 builder inputs + ReopenDialog input.
3. JS guard `isPastDateTime` alongside existing end>release validation (native min is bypassable).
4. Backend: reject past `releaseDate` on create in `assessment-creation.helper.ts` (not per-controller).
5. Tests: direct API call with past releaseDate must be rejected; util unit tests; UI blocked + paste-in-past fails validation.

## Relevant Areas

- shared/skills/database/MUST-HAVES.md §Grading invariants (assessment publish data)
- shared/skills/frontend/MUST-HAVES.md, shared/skills/backend/MUST-HAVES.md
- shared/skills/testing/MUST-HAVES.md
- frontend/src/lib/school-year-dates.ts, assessment-builder/Step6.tsx, ManualStep2.tsx, assessment/ReopenDialog.tsx
- backend/src/modules/assessment/educator/helpers/assessment-creation.helper.ts

## Acceptance Criteria

- [ ] Shared datetime-local util exists, reused at all 5 inputs (no per-file date math)
- [ ] Past releaseDate rejected server-side on create (and update path if applicable)
- [ ] Targeted tests pass (backend helper spec + util behavior verified); lint/typecheck pass
- [ ] No unrelated changes; merge order note: lands after TICK-ASSESS-001

## Confidence

- Score: 88/100 (Requirement 25, Codebase verification 22, Architecture 20, Edge cases 10, Blast radius 11).
- Gaps: "past" boundary semantics (grace seconds? timezone of datetime-local vs server) not fully pinned — proceeding with assumption: reject when releaseDate < now at validation time (server clock, no grace), consistent with existing strict `end > release` checks; exact-now edge is millisecond-rare and fails closed (rejected) which is the safe direction. Timezone: datetime-local carries no offset; parse as local on frontend guard, server compares instants — documented in code comment.
- Blast radius: helper is called by create + generatePreview paths — both covered by new spec cases.

## Tests

- Targeted: PASS — backend assessment 4 suites/41 tests (new assessment-date.validation.spec: 7 tests incl. service-level create/update bypass rejection + close-early untouched); grading-scheme+grade regression 13 suites/99 tests PASS. Frontend: new datetime-local.test 8/8; FULL frontend suite 12 suites/110 tests PASS. tsc: 0 errors in touched files. ESLint exit 0 on all touched files.
- Full suite: not run (pre-existing baseline failures per FOLLOW_UPS.md; scoped suites green)
- Development integration: not run (awaiting reviewer merge; merge after TICK-ASSESS-001)

## Blocker

None.

## Activity Log

- 2026-09-28: Claimed, counter ASSESS=2. Confidence 88/100 as above.
- 2026-09-28: Implemented. Shared `frontend/src/lib/datetime-local.ts` (minDateTimeLocal/isPastDateTime/parse+format); wired min+guard+messages into Step6, ManualStep2, ReopenDialog (Input forwards min — verified). Backend `assertReleaseDateNotPast` in creation helper, called from create + update (AI publish path); reopen past-check in submission helper. Fixed 2 self-made test bugs (min truncation semantics, Date-overflow fail-closed now in parser). Commit 53b162a5. Ready for review.

## Commits

- 53b162a5 feat(assess): block past dates in assessment creation (shared util + server guard) (branch agent/TICK-ASSESS-002-past-dates)

## Notes

- Phase B of 3-phase plan. Merge after TICK-ASSESS-001 (file overlap: none expected).
