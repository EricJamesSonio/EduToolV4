# TICK-SUBJECT-002 — Subject session requirements (Phase 2)

Status: ready-for-review
Priority: high
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Branch: development (owner-directed; no feature worktree)
Plan: auto-class/phase-2-subject-session-requirements.md
Depends on: TICK-ORG-002 (active weekdays/breaks)
Commits: 7b4c52e7 (backend), 512667c3 (frontend)

## Problem

The generator needs to know how often and how long each subject meets per week.
Today `Subject` cannot express that, so the only source of truth for a class's
shape is a human ticking the grid.

## Goal

1. `Subject` gains optional `sessions_per_week` and `session_minutes`.
2. A single resolver supplies the effective values, falling back to a per-program
   -type default so the generator and readiness never disagree.
3. `session_minutes` must be a multiple of the org's slot length, so a subject
   can always be placed on the slot grid.
4. Existing subjects stay valid — both fields nullable.

## Relevant Areas

- backend/prisma/schema.prisma (Subject)
- backend/src/modules/subject/{service,repository,dto,mapper,types,module}
- backend/src/modules/org-schedule-config (slot duration, for the alignment rule)
- frontend: SubjectDialog, SubjectColumns, subject types/api

## Acceptance Criteria

- [x] Admin can set "3 x 60 min" on a subject
- [x] Empty subjects report their default (e.g. "5 x 60m")
- [x] A non-multiple of the slot length is rejected with a message naming the slot
- [x] Locked subjects still cannot be edited
- [x] Changing slotDuration later does not break existing subjects (default is
      rounded up at read time; explicit values are never rewritten)
- [x] Pure tests for the resolver, service tests for validation

## Confidence

- Score: 91%
- Measured: backend `tsc --noEmit` 0 errors; backend unit 1017 passing after
  (+18 new); frontend `tsc` unchanged at its 20-error pre-existing baseline;
  frontend unit 270/270; eslint clean on all touched files.

## Tests

- Pure (`subject-session-defaults.spec.ts`, 12 cases): explicit vs default,
  per-field fallback, default rounding up to the slot, explicit NOT rounded,
  unknown program type, null == absent, `roundUpToSlot` and
  `sessionMinutesOptions`
- Service (`subject.service.spec.ts`, +5 cases): rejects 45m at a 30m slot,
  accepts 60m, null reports the elementary default, update rejects misaligned,
  and the locked-subject check runs BEFORE the alignment check

## Blocker

None.

## Activity Log

2026-09-30 — Filed and started, after TICK-ORG-002 landed the weekdays/breaks.

2026-09-30 — Implemented (7b4c52e7 backend, 512667c3 frontend).

2026-09-30 — Self-correction: one of my own resolver tests asserted that a
45m kinder default survived a 30m slot. That contradicted the rounding rule the
same file tests two cases below. The implementation was right; the assertion
was wrong. Fixed to use a 15m slot, which tests the default value itself
without involving rounding.

## Commits

- 7b4c52e7 — feat(subject): per-subject weekly session requirements
- 512667c3 — feat(subject): weekly session fields in the subject dialog and table

## Notes

Design correction vs the plan: the plan has `SubjectService` inject
`OrgScheduleConfigService` directly. Instead it depends on a narrow structural
interface (`schedule-window.provider.ts`) shared with Phase 4, so the subject ->
org-schedule-config edge stays one-directional and both consumers are trivially
unit-testable.

Not done (later phases): per-day session windows, and reporting subjects whose
explicit `session_minutes` stopped matching a changed `slotDuration`. The latter
is a warning surface the plan defers to readiness.

