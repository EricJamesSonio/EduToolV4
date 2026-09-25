# TICK-INFRA-006 — Perf Phase 4 pagination + SQL aggregation

Status: in-progress
Priority: high
Created: 2026-09-25
Created by: agent
Assigned to: agent
Started: 2026-09-25
Worktree: ../EduToolV4-worktrees/TICK-INFRA-006-perf-phase4-pagination-agg
Branch: agent/TICK-INFRA-006-perf-phase4-pagination-agg

## Problem

Unbounded growing-table reads: audit-log + notification repos fetch full history per page open (frontend slices client-side); audit-log hook polls the full log every 15s; analytics computes counts/averages by pulling all locked-grade rows into Node instead of SQL groupBy/aggregate.

## Goal

1. Backend: `skip`/`take` (+ total) on audit-log findAdminLogs/findActivityLogs and notification inbox, matching Phase 1 `(org_id, created_at)` indexes. Cursor (`created_at < cursor`) if the existing query shape favors it — decision logged here.
2. Frontend: remove/reduce 15s `refetchInterval` in `useAuditLog.ts`, raise `staleTime`; move client `.filter()`/`.slice()` in AuditLogTab/ActivityLogTab to server query params; keep rendered output identical for the same data.
3. Analytics: `groupBy`/`aggregate` in `analytics.repository.ts` for grade stats + educator load (reference: `assessment-educator.service.ts` groupBy usage). Same numbers, no full-row transfer.
4. Separate commits: backend pagination, frontend polling/pagination, analytics aggregation.

## Relevant Areas

- backend/src/modules/audit-log/, backend/src/modules/notification/
- backend/src/modules/analytics/
- frontend/src/hooks/*useAuditLog*, frontend/src/api/audit-log.api.ts
- frontend/app/admin/audit-log/_components/, frontend/app/educator/activity-log/

## Acceptance Criteria

- [ ] Paginated endpoints return `{data, meta/total}` or cursor page; unbounded path removed
- [ ] No 15s full-log polling; client slices replaced by server params
- [ ] Analytics numbers identical (spec pins values on mocked groupBy/aggregate)
- [ ] Existing specs updated where they assert old shapes; all green

## Confidence

Score: 83/100
- Requirement clarity: 24 (cursor-vs-offset decision open → logged in handoff)
- Codebase verification: 21 (audit-read; exact controller/service/repo shapes verified in-worktree before editing)
- Architecture fit: 19 (repo pagination + DTO params; matches existing paginated endpoints)
- Edge cases: 9 (empty pages, cursor stability with equal timestamps, filter combos)
- Blast radius: 10 (read paths; response-shape change is additive `{data,meta}` — consumers updated in same ticket)
Proceeding. Assumption: offset `page/limit` + total (matches existing repo pagination style) unless the code shows cursor infra already.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-09-25 — Claimed, creating worktree from development.
Confidence: 83/100 (Requirement clarity 24, Codebase verification 21, Architecture fit 19, Edge cases 9, Blast radius 10). Assumption: offset pagination unless cursor infra exists.

## Commits

None yet.

## Notes

Response-shape change ({data,meta}) is additive and consumers are updated in-ticket; no endpoint removed. Genuine bugs flagged separately.
