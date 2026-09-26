# TICK-INFRA-006 — Perf Phase 4 pagination + SQL aggregation

Status: ready-for-review
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

- Backend: audit-log pagination spec 3/3, analytics specs 11/11 (service + aggregation) pass
- Frontend: tsc clean, eslint clean on 8 touched files
- Backend tsc: only pre-existing errors (identical set on clean development); build OK (525 files)
- Full suite: not run (deferred to development integration after merge)
- Development integration: not run (await merge)

## Blocker

None.

## Activity Log

2026-09-25 — Claimed, creating worktree from development.
Confidence: 83/100 (Requirement clarity 24, Codebase verification 21, Architecture fit 19, Edge cases 9, Blast radius 10). Assumption: offset pagination unless cursor infra exists.
2026-09-25 — Decision: offset page/limit + {data,meta} (matches getEnrollmentBreakdown precedent + existing PaginationBar/Pagination UI; no cursor infra exists). Implemented 3 commits (backend pagination, frontend pagination, analytics aggregation). Found + fixed-as-necessity one pre-existing bug (educator activity client unwrapping). Verified: backend 14/14, frontend tsc/eslint clean, build OK.
2026-09-25 — Ready for review.

## Commits

- 292af770 perf(logs): server-side pagination for audit/activity logs and notification inbox
- d6485ba7 perf(frontend): server-side log pagination, drop 15s full-log polling
- 9c5c39ec perf(analytics): SQL groupBy/aggregate for grade stats and educator load (branch agent/TICK-INFRA-006-perf-phase4-pagination-agg, PR vs development)

## Notes

Response-shape change ({data,meta}) is additive and consumers are updated in-ticket; no endpoint removed. Genuine bugs flagged separately.
