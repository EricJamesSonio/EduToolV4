# Handoff — TICK-INFRA-006 Perf Phase 4 pagination + SQL aggregation

Status: ready-for-review (branch `agent/TICK-INFRA-006-perf-phase4-pagination-agg`, 3 commits, PR vs `development`)
Worktree: `../EduToolV4-worktrees/TICK-INFRA-006-perf-phase4-pagination-agg` (keep until merged)

## Decision (cursor vs offset, logged per ticket)
Offset `page/limit` + `{data, meta}` — matches the `getEnrollmentBreakdown` precedent and the existing `PaginationBar`/`Pagination` components; no cursor infra exists anywhere. `limit` capped at 100 (`@Max(100)`); defaults 1/20.

## What changed
1. `292af770` backend — `findAdminLogs`/`findActivityLogs`/`findByUser` return `{data, meta}` (`skip`/`take` + parallel `count`, existing filter semantics kept); DTOs gain validated `page/limit`; activity DTO gains `action` (exact) + `actionContains` (insensitive contains); `QueryNotificationDto` gains `page/limit`. Only consumers are the two controllers (verified by grep). Uses Phase 1 `(org_id, created_at)` indexes.
2. `d6485ba7` frontend — admin api/hook/tab trio + educator api/hook/page switched to server pages (`meta.total`, no client slice/filter); `useAuditLogs` drops the 15s full-log poll → `list` preset (60s stale); `notification.api` aligned to `{data, meta}` (zero callers today).
3. `9c5c39ec` analytics — `getGradeStats` (groupBy `final_grade` + total/avg aggregates + `>=75` pass-count aggregate) and grouped `getEducatorLoad` (lean class list + `enrollment.groupBy`); service output shape identical; dead `getLockedGrades` removed; specs updated to new repo methods.

## Query counts
- audit/activity log page open: full-table transfer → 2 bounded queries (page + count). 15s poll eliminated.
- notifications: unbounded inbox → bounded page + count.
- grade analytics: N-row transfer + JS reduce → 3 indexed aggregates. educator load: 1 query + N-row enrollment hydration → lean list + grouped count.

## Self-verification (done)
- Backend 14/14 (pagination 3, analytics 11); frontend `tsc` clean + eslint clean (8 files); backend tsc only pre-existing errors (identical on clean development); build OK.

## ⚠️ Flags (not silent)
1. **Pre-existing bug fixed as a drive-by necessity** (`frontend/src/api/educator/activity-log.api.ts`): it called `res.data.map(...)` but the backend wraps all responses as `{success, data}`, so `.map` threw and the educator activity page always rendered empty. Rewrote to correct paged unwrapping. If you prefer a strict no-bugfix policy, say so — but pagination could not ship without touching this file.
2. **CSV export now covers the loaded page**, not the full filtered history (both admin tabs). If full-history export is a requirement, follow-up: dedicated `GET /audit-log/export` streaming endpoint.
3. **Educator event-type filter semantics**: `includes()` substring preserved exactly via server `actionContains` (insensitive). Admin tab uses exact `action` (was exact client equality — identical).

## Next: Phase 5 (separate ticket/branch).
