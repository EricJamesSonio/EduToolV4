# TICK-ACADEMIC-001 — Register student academic-history on React Query factory (realtime UI)

Status: in-progress
Priority: high
Created: 2026-08-26
Created by: agent
Assigned to: agent
Started: 2026-08-26
Worktree: ../EduToolV4-worktrees/TICK-ACADEMIC-001-register-academic-history-query
Branch: agent/TICK-ACADEMIC-001-register-academic-history-query

## Problem

Student academic-history page (frontend/src/app/student/academic-history/page.tsx → StudentAcademicHistoryPanel) fetches via useMyAcademicHistory / useMyAcademicTimeline (hooks/admin/useAcademicHistory.ts). Those 4 hooks use ad-hoc raw keys ["student","academicHistory",...] and [...queryKeys.admin.students.detail(...),"timeline"] instead of the centralized queryKeys factory (hooks/queryKeys/*.keys.ts). No factory registration → useAppQuery VALID_ROOTS guard bypassed, no invalidate path, UI needs manual reload. Audit found ~25 ad-hoc keys, 10 direct apiClient calls, 5 mutations without invalidation — this ticket is Phase 1.

## Goal

1. Add student.academicHistory to queryKeys factory (student.keys.ts) and optional admin.academicHistory (admin.keys.ts) with typed keys.
2. Migrate hooks/admin/useAcademicHistory.ts 4 hooks to factory keys with meta.preset detail (or realtime if 30s poll desired) — no raw arrays.
3. StudentAcademicHistoryPanel auto-refreshes via invalidateQueries({queryKey: queryKeys.student.academicHistory.all}) without reload; realtime if needed.
4. lint/typecheck/build pass in worktree.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md, skills/frontend/FACTS.md
- frontend/src/hooks/queryKeys/student.keys.ts
- frontend/src/hooks/queryKeys/admin.keys.ts
- frontend/src/hooks/queryKeys.factory.ts
- frontend/src/hooks/admin/useAcademicHistory.ts
- frontend/src/components/student/StudentAcademicHistoryPanel.tsx
- frontend/src/app/student/academic-history/page.tsx
- frontend/src/api/admin/academic-history.api.ts

## Acceptance Criteria

- [ ] hooks/queryKeys/student.keys.ts has academicHistory {all, full, timeline} via [...studentKeys.all, 'academicHistory', ...]
- [ ] hooks/admin/useAcademicHistory.ts uses queryKeys.student.academicHistory.* and queryKeys.admin.students.detail + timeline/fullHistory or new admin.academicHistory keys — zero raw ["student","academicHistory"] literals
- [ ] useMyAcademicHistory/Timeline use meta: {preset: 'detail'} (or realtime) so no useAsyncQuery missing-preset warning
- [ ] StudentAcademicHistoryPanel shows data without manual reload; invalidation via factory all key works
- [ ] npm run lint --silent, tsc --noEmit, npm run build pass; 0 raw academicHistory keys via grep

## Confidence

Score: 96/100
- Requirement clarity: 98 (user request + audit verified 4 hooks, student.keys missing academicHistory)
- Codebase verification: 97 (read StudentAcademicHistoryPanel, useAcademicHistory, student.keys, admin.keys, hook-factory.utils, useAppQuery VALID_ROOTS)
- Architecture fit: 96 (factory is central; add keys = 1 file per domain, no schema/auth/grading)
- Edge cases: 92 (admin piggyback keys vs new admin.academicHistory — both valid, chose explicit admin keys for clarity)
- Blast radius: 95 (student/ admin academic-history only; no other consumers)
No cap (<80 false) — no auth/tenant/migration touched unchecked.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-08-26 — Claimed, creating worktree from development.

## Commits

None yet.

## Notes

Phase 1 of phased React Query factory fix (see plan). Phases 2-5 (admin gradingScales, educator grades/lock, groupy/landing, missing invalidations) will be separate tickets TICK-ACADEMIC-002+, TICK-GRADE-*, etc.
