# TICK-INFRA-007 — Perf Phase 6 caching (memory now; Redis/BullMQ flagged)

Status: ready-for-review
Priority: high
Created: 2026-09-26
Created by: agent
Assigned to: agent
Started: 2026-09-26
Worktree: ../EduToolV4-worktrees/TICK-INFRA-007-perf-phase6-caching
Branch: agent/TICK-INFRA-007-perf-phase6-caching

## Problem

Read-heavy, rarely-changing endpoints (grading scales, levels, subjects, org settings, academic calendar) hit Postgres on every request; mail/AI/Giphy calls block request paths synchronously.

## Findings (pre-claim infra survey)

- No Redis anywhere: no REDIS_URL in backend/.env, no redis service in docker-compose.yml, no hosting manifests in repo. No docker daemon locally.
- Therefore Redis-backed cache-manager store and BullMQ CANNOT be built or verified in this environment.

## Goal (rescoped, no guessing)

1. `@nestjs/cache-manager` with in-memory store (no new infra): CacheModule + TTLs (5-30 min) on the listed read endpoints, invalidation on writes. Verifiable locally.
2. Document the exact Redis swap (package + store factory + REDIS_URL) and the full BullMQ design (queues, job names, proposed retry/backoff) as flagged decisions in the handoff — NOT implemented without Redis + topology/policy approval.
3. No changes to mail/AI/Giphy paths (fire-and-forget without a queue would swallow errors — a behavior change).

## Relevant Areas

- shared/rules/dependencies.md (new dep @nestjs/cache-manager)
- backend/src/modules/grading-scale/, level/, subject/, organization/, school-profile/, org-enrollment-setting/, org-schedule-config/, academic-calendar/, semester-template/, grading-scheme-template/

## Acceptance Criteria

- [ ] CacheModule registered (memory store, bounded max/size); read endpoints cached with documented TTLs; writes invalidate
- [ ] Targeted specs prove cache-hit (no repo call) + invalidation on write
- [ ] Redis/BullMQ decision package in handoff (blockers, options, proposal)
- [ ] No mail/AI/Giphy behavior change

## Confidence

Score: 82/100
- Requirement clarity: 24 (rescope documented here; Redis/queue half is flag-only)
- Codebase verification: 20 (endpoint list from audit; exact service shapes verified in-worktree)
- Architecture fit: 18 (CacheModule global; per-module TTLs; invalidation next to writes)
- Edge cases: 10 (tenant key scoping org_id in keys; TTL staleness windows; memory bound)
- Blast radius: 10 (read-path only; stale-read risk bounded by short TTLs + write invalidation)
Proceeding. Assumption: in-memory store acceptable as Phase 6a; multi-instance staleness accepted until Redis (documented).

## Tests

- New specs 12/12 (cache service 4, org 2 new, schedule-config 2, enrollment-setting 2, scale 2, calendar 2 new); existing suites for touched modules all green — 89/89 total in scope
- Fixed a pre-existing env gap along the way: Prisma client was never generated in this checkout (`prisma generate` run; gitignored output, affects all worktrees)
- eslint clean; tsc pre-existing set only; build OK (529 files)
- Full suite: not run (deferred to development integration after merge)
- Development integration: not run (await merge)

## Blocker

Redis/BullMQ (see Goal §2) — flagged, not implemented. Details in handoff.

## Activity Log

2026-09-26 — Infra survey (no Redis/env/compose/hosting manifests, no local docker) → rescoped to memory cache + decision package. Claimed, creating worktree from development.
Confidence: 82/100 (Requirement clarity 24, Codebase verification 20, Architecture fit 18, Edge cases 10, Blast radius 10). Assumption: memory store OK as 6a.
2026-09-26 — Implemented 5 commits (cache infra+dep, organization, org-config x2, grading-scale, academic-calendar). Verified: 89/89 tests, lint/tsc/build clean. Redis/BullMQ left as flagged decisions (handoff).
2026-09-26 — REVIEW SPLIT CONFIRMATION: branch verified caching-only via `git grep -i bullmq|nestjs/bull|redis` (hits = upgrade-path comments + pre-existing concern-module TODO text only) and package diff (only the 2 cache-manager deps). Zero queue/Redis code. No BullMQ/Redis work exists to split out — the queue track was never implemented, only proposed in the handoff. Queue work stays PARKED pending Redis provisioning + topology/policy approval; no new ticket until then. This branch merges as the caching-only piece.
2026-09-26 — Ready for review.

## Commits

- 81f37005 perf(cache): shared AppCacheService on cache-manager memory store (+@nestjs/cache-manager@2.3.0/cache-manager@5.7.6 dep)
- f592b7fa perf(organization): cache getOwn 5m with invalidation on update
- c656c260 perf(org-config): cache schedule + enrollment settings 30m with invalidation
- 5257dc82 perf(grading-scale): cache class-scale resolution 5m with invalidation on writes
- f7ef8123 perf(academic-calendar): cache calendar reads 30m with invalidation on writes (branch agent/TICK-INFRA-007-perf-phase6-caching, PR vs development)

## Notes

New dependency @nestjs/cache-manager required (documented per dependencies.md in handoff). No APM/queue deps added.
