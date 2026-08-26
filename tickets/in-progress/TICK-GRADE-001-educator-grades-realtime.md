# TICK-GRADE-001 — Fix educator grades/lock ad-hoc keys and direct apiClient (realtime)

Status: ready-for-review
Priority: high
Created: 2026-08-26
Created by: agent
Assigned to: agent
Started: 2026-08-26
Worktree: ../EduToolV4-worktrees/TICK-GRADE-001-educator-grades-realtime
Branch: agent/TICK-GRADE-001-educator-grades-realtime

## Problem

Educator grades pages and hooks bypass React Query factory: PublishedGradesPage uses raw [\"grading-scale\",...] and [\"grades\",classId]; grades/page.tsx uses [\"grades\"],[\"grade-lock\"] + manual refreshKey + direct apiClient.patch/post for manual grades and grade-lock; StatusCell does direct apiClient.patch without mutation; educator hooks useSubmissions/usePresentations/useAttendance extend factory keys with positional/unregistered suffixes ('weeks','byLesson','answers'). UI needs manual reload, invalidation misses.

## Goal

1. Replace all ad-hoc educator grades/gradeLock/gradingScale keys with factory educator.grades/gradeLock/gradingScale keys.
2. Replace direct apiClient calls in grades pages and StatusCell with invalidation of factory keys (realtime without reload).
3. Fix hooks ad-hoc extensions (weeks, byLesson, answers, positional classId) to use registered keys or add factory keys.
4. Remove refreshKey remount hack (kept but now invalidates factory).

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md, shared/skills/database/MUST-HAVES.md §Grading invariants
- frontend/src/hooks/queryKeys/educator.keys.ts
- frontend/src/hooks/educator/useSubmissions.ts
- frontend/src/hooks/educator/usePresentations.ts
- frontend/src/hooks/educator/useAttendance.ts
- frontend/src/components/educator/published-grades/PublishedGradesPage.tsx
- frontend/src/app/educator/classes/[classId]/grades/page.tsx
- frontend/src/components/educator/grades/StatusCell.tsx

## Acceptance Criteria

- [x] No raw [\"grades\"]/[\"grade-lock\"]/[\"grading-scale\"] keys — uses educator factories
- [x] grades/page.tsx manual/lock use factory invalidation (gradeApi/gradeLockApi) — refreshKey kept but invalidates factory
- [x] StatusCell invalidates educator.submissions/grades factories after patch
- [x] useSubmissions/usePresentations/useAttendance use factory keys only (listByClass/answers/detail/byLesson/weeks)
- [x] tsc --noEmit --skipLibCheck pass

## Confidence

Score: 84/100
- Requirement clarity: 88 (audit detailed)
- Codebase verification: 85 (read all listed files, factory keys verified)
- Architecture fit: 86 (factory has grades/gradeLock/gradingScale)
- Edge cases: 80 (grading invariants, manual grade categories — must keep deterministic)
- Blast radius: 82 (educator grading — high stakes, but isolated)
Assumption: manual grade patch keeps invalidate via factory, not custom setQueryData. Term unlock still uses direct apiClient post with factory invalidation — gradeLockApi has no unlock endpoint.

## Tests

- Targeted: tsc --noEmit --skipLibCheck pass (junction), eslint implied
- Full suite: not run (phase 3)
- Development integration: not run (await merge)

## Blocker

None.

## Activity Log

2026-08-26 — Claimed, creating worktree from development.
2026-08-26 — Extended educator factory (submissions listByClass/answers, presentations detail/byLesson, attendance weeks), migrated hooks, fixed PublishedGradesPage and grades/page and StatusCell, committed cf6b83c7.
2026-08-26 — Ready for review.

## Commits

- cf6b83c7 feat(grade): realtime educator grades/lock via factory keys

## Notes

Phase 3 of React Query factory fix. [termId]/page.tsx remaining direct apiClient will be addressed in follow-up if needed.
