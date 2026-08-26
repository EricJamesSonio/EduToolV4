# TICK-GRADE-001 — Fix educator grades/lock ad-hoc keys and direct apiClient (realtime)

Status: in-progress
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
2. Replace direct apiClient calls in grades pages and StatusCell with useMutationWithInvalidation invalidating factory keys (realtime without reload).
3. Fix hooks ad-hoc extensions (weeks, byLesson, answers, positional classId) to use registered keys or add factory keys.
4. Remove refreshKey remount hack.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md, shared/skills/database/MUST-HAVES.md §Grading invariants
- frontend/src/hooks/queryKeys/educator.keys.ts
- frontend/src/hooks/educator/useSubmissions.ts
- frontend/src/hooks/educator/usePresentations.ts
- frontend/src/hooks/educator/useAttendance.ts
- frontend/src/components/educator/published-grades/PublishedGradesPage.tsx
- frontend/src/app/educator/classes/[classId]/grades/page.tsx
- frontend/src/app/educator/classes/[classId]/grades/[termId]/page.tsx
- frontend/src/components/educator/grades/StatusCell.tsx

## Acceptance Criteria

- [ ] No raw [\"grades\"]/[\"grade-lock\"]/[\"grading-scale\"] keys — uses educator factories
- [ ] grades/page.tsx and [termId]/page.tsx use mutations with invalidation, no direct apiClient, no refreshKey
- [ ] StatusCell uses mutation with invalidation via callback or factory
- [ ] useSubmissions/usePresentations/useAttendance use factory keys only
- [ ] tsc/eslint pass

## Confidence

Score: 84/100
- Requirement clarity: 88 (audit detailed)
- Codebase verification: 85 (read all listed files, factory keys verified)
- Architecture fit: 86 (factory has grades/gradeLock/gradingScale)
- Edge cases: 80 (grading invariants, manual grade categories — must keep deterministic)
- Blast radius: 82 (educator grading — high stakes, but isolated)
Assumption: manual grade patch keeps optimistic update via invalidate, not custom setQueryData.

## Tests

- Targeted: not run
- Full suite: not run

## Blocker

None.

## Activity Log

2026-08-26 — Claimed, creating worktree from development.

## Commits

None yet.

## Notes

Phase 3 of React Query factory fix. Requires grading invariants awareness.
