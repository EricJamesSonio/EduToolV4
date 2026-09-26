# Handoff — TICK-INFRA-007 Perf Phase 6 caching (memory now; Redis/BullMQ decisions flagged)

Status: ready-for-review (branch `agent/TICK-INFRA-007-perf-phase6-caching`, 5 commits, PR vs `development`)
Worktree: `../EduToolV4-worktrees/TICK-INFRA-007-perf-phase6-caching` (keep until merged)

## Delivered: in-memory read cache (no new infra, verifiable here)
1. `81f37005` — `@nestjs/cache-manager@2.3.0` + `cache-manager@5.7.6` dep (lockfile updated; reason logged per dependencies.md: framework-standard cache abstraction, memory store needs no infra) + `core/cache/` `AppCacheService` (org-scoped keys, get-or-set, del/delByPrefix, nulls never cached, 2000-entry bound) registered global via `CoreModule`. `prisma generate` run (pre-existing env gap: client was never generated in this checkout).
2. `f592b7fa` — `organization.getOwn` 5m TTL (hot: every email build + guards), invalidated on `update`.
3. `c656c260` — org schedule + enrollment settings 30m TTL, invalidated on upsert. Note: `getByOrg` for enrollment settings is itself an upsert-defaults write — cache spares that write on hits; same observable result.
4. `5257dc82` — grading-scale class→scale resolution 5m TTL at the repository seam (covers controller + both eligibility paths); invalidated on create/update/lock/unlock/delete/assign/removeAssignment. Composes with Phase 5's per-request memo map when merged (request map above, cross-request cache below).
5. `f7ef8123` — academic-calendar `findAll` + `getSessionBlockingEvents` 30m TTL per org(+year), invalidated on create/update/remove.

Skipped deliberately: `school-profile.getProfile` (500-line service, many writers — stale-read UX risk; needs per-write audit first), subject/level/semester-template lists (more write paths; follow-up).

## Self-verification (done)
- 89/89 tests in scope (12 new cache specs + all existing touched-module suites); eslint/tsc/build clean (tsc: 4 pre-existing errors, identical on clean development).

## 🚫 BLOCKERS — Redis + BullMQ (flagged, not implemented)
1. **No Redis anywhere**: no `REDIS_URL`, no compose service, no hosting manifests, no local docker. Needed: provision Redis (Aiven/Render/local compose service) + `REDIS_URL` secret + decision: `cache-manager-redis-yet` (+ `redis` client) as the `AppCacheModule` store — the service API is already store-agnostic, so this is a ~10-line swap + env wiring. I did not install redis deps against nothing.
2. **BullMQ queues**: needs Redis (above) + topology decision (same-process workers vs separate Render worker service) + retry/backoff policy approval. Proposed (not implemented): queues `mail` (3 retries, exponential 5s→5m, DLQ after), `ai-generation` (2 retries, 60s timeout, concurrency 2 — LLM-bound), `giphy-proxy` (no retry, 5s timeout, 30s result cache); workers in-process for dev, separate `worker` service in prod; BullBoard for observability. Confirm topology + policy and I'll implement as Phase 6b.
3. **Multi-instance note**: memory store means per-instance caches until Redis lands; TTLs (5–30m) bound staleness; writes invalidate local instance only. Acceptable single-instance; must land Redis before horizontal scaling.

## Next: Phase 7 frontend cleanup (separate ticket/branch).
