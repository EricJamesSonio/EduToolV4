# Handoff — TICK-INFRA-008 Perf Phase 7 frontend cleanup

Status: ready-for-review (branch `agent/TICK-INFRA-008-perf-phase7-frontend`, 4 commits, PR vs `development`)
Worktree: `../EduToolV4-worktrees/TICK-INFRA-008-perf-phase7-frontend` (keep until merged)

## What changed (frontend-only, no API contracts touched)
1. `46ab6441` — `api/client.ts` uses `detect-overfetch.ts:trackApiCall` (local duplicate removed, behavior identical — same thresholds/gating, proven by the 12 existing client tests). `DevDebugPanel` now populates from live traffic.
2. `06738d08` — axios `timeout: 30000` default; per-request override still available (`{ timeout }`). AI paths poll rather than hold requests, so 30s is safe.
3. `0003d037` — `DataTable`/`ExcelTable` wrapped in `memo()` (same export names); `CleanGradeTable`/`DefaultGradeTable` memoize categories/columns and index per-student breakdown/scores in Maps (cell render O(1), was O(C) `.find` → O(S·C²) per render). Also fixed hooks-after-early-return order in both grade tables (hooks now unconditional — previously a latent rules-of-hooks violation masked by stable call order).
4. `61c15b41` — global query default static (30m/60m) → list (60s/10m). Static owners must declare `preset: 'static'` (enforced/warned in dev already).

## Self-verification (done)
- 102/102 frontend jest (11 suites); tsc clean except 3 pre-existing semester errors (identical on clean development); eslint clean on touched files.

## ⚠️ Flags
1. **Preset-default behavior change**: hooks without an explicit preset now refetch after 60s stale instead of 30m. This is the intended fix for silent inheritance, but if any rarely-changing view (e.g. school-profile draft, static lookups) shows extra loading spinners, the fix is `meta: { preset: 'static' }` on that hook — not a revert. Worth a click-through of admin settings pages after merge.
2. **No virtualization added**: tables render ≤100 server-capped rows; memoization is sufficient at this size. If any table goes unbounded later, add `@tanstack/react-virtual` then.
3. **Timeout vs uploads**: 30s also applies to file uploads (`UploadModule`) — large uploads on slow links could hit it. If upload complaints appear, set per-request `timeout` on the upload call.

## All phases complete
Phase 0 (TICK-INFRA-003) → Phase 1 (TICK-INFRA-004) → Phase 2 (TICK-GRADE-003) → Phase 3 (TICK-INFRA-005) → Phase 4 (TICK-INFRA-006) → Phase 5 (TICK-CLASS-001) → Phase 6 (TICK-INFRA-007) → Phase 7 (this ticket). Suggested merge order: 003, 004, GRADE-003, 005, 006, CLASS-001, 007, 008. Note: Phase 6 and later branches were cut from development at different tips — merge sequentially and re-run the full suite on development after each.
