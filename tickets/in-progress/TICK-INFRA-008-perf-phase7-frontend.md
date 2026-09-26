# TICK-INFRA-008 — Perf Phase 7 frontend cleanup

Status: in-progress
Priority: medium
Created: 2026-09-26
Created by: agent
Assigned to: agent
Started: 2026-09-26
Worktree: ../EduToolV4-worktrees/TICK-INFRA-008-perf-phase7-frontend
Branch: agent/TICK-INFRA-008-perf-phase7-frontend

## Problem

Dead/duplicated overfetch tracking, no request timeout (hung backend hangs UI), unmemoized heavy tables (O(S·C²) per render), over-broad global query defaults (lists silently inherit static 30m stale).

## Goal

1. `detect-overfetch.ts`: wire up (client uses its `trackApiCall`, removing the local duplicate) so `DevDebugPanel` shows real data — not delete (panel depends on it).
2. `api/client.ts`: `timeout: 30000` default (per-request overridable via axios).
3. `DataTable.tsx`, `ExcelTable.tsx`, `CleanGradeTable.tsx` (+`DefaultGradeTable.tsx` same shape): `React.memo` + `useMemo` for derived columns/categories; no new virtualization dep (pages are server-capped ≤100 rows; note as follow-up).
4. `query-client.config.ts`: global default static→list so unmarked hooks get sane list freshness; static consumers opt in explicitly.
5. Separate commits per item; frontend tsc/eslint/jest green.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md
- frontend/src/utils/detect-overfetch.ts, frontend/src/api/client.ts
- frontend/src/components/shared/DataTable.tsx, ExcelTable.tsx
- frontend/src/components/educator/grades/CleanGradeTable.tsx, DefaultGradeTable.tsx
- frontend/src/lib/query-client.config.ts

## Acceptance Criteria

- [ ] DevDebugPanel populates from live tracking (no duplicate logic)
- [ ] Hung requests fail at 30s instead of hanging forever
- [ ] Tables memoize derived data; re-render on identical props is cheap
- [ ] Global default no longer silently 30m-stale for lists

## Confidence

Score: 88/100
- Requirement clarity: 24 (4 explicit items; timeout value + default-preset choice are judgment calls, logged)
- Codebase verification: 22 (all files read during audit + verified in-worktree)
- Architecture fit: 19 (existing factory/preset patterns reused)
- Edge cases: 11 (timeout vs long AI polls; preset change refetch behavior — flagged)
- Blast radius: 12 (frontend-only; no API/data changes)
Proceeding. Assumptions: 30s timeout (AI paths poll, don't hold requests); list default (static users declare preset).

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-09-26 — Claimed, creating worktree from development.
Confidence: 88/100 (Requirement clarity 24, Codebase verification 22, Architecture fit 19, Edge cases 11, Blast radius 12). Assumptions: 30s timeout; list global default.

## Commits

None yet.

## Notes

No backend changes. No API contract changes.
