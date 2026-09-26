# TICK-INFRA-007 — Perf Phase 6 caching (memory now; Redis/BullMQ flagged)

Status: in-progress
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

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

Redis/BullMQ (see Goal §2) — flagged, not implemented. Details in handoff.

## Activity Log

2026-09-26 — Infra survey (no Redis/env/compose/hosting manifests, no local docker) → rescoped to memory cache + decision package. Claimed, creating worktree from development.
Confidence: 82/100 (Requirement clarity 24, Codebase verification 20, Architecture fit 18, Edge cases 10, Blast radius 10). Assumption: memory store OK as 6a.

## Commits

None yet.

## Notes

New dependency @nestjs/cache-manager required (documented per dependencies.md in handoff). No APM/queue deps added.
