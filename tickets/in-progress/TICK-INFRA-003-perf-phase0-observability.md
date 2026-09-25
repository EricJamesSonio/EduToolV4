# TICK-INFRA-003 — Perf Phase 0 observability (Prisma log, interceptor timing, request-id wiring, DB health ping)

Status: in-progress
Priority: high
Created: 2026-09-25
Created by: agent
Assigned to: agent
Started: 2026-09-25
Worktree: ../EduToolV4-worktrees/TICK-INFRA-003-perf-phase0-observability
Branch: agent/TICK-INFRA-003-perf-phase0-observability

## Problem

No visibility into per-request DB cost: Prisma query logging off (`database.provider.ts:64` `super({adapter})` only), `logging.interceptor.ts:20` uses `tap()` (skips errors), `Date.now()` ms resolution, no `statusCode`, `requestId` always undefined (middleware never wired in `main.ts`), health endpoints return static `{status:'ok'}` with no DB ping. Cannot measure before/after for grade/N+1 fixes.

## Goal

1. Env-gated Prisma query logging in dev/staging only (off in prod by default).
2. Fix `logging.interceptor.ts`: `finalize()` so errors timed, log `statusCode`, `process.hrtime.bigint()` timing, keep `requestId`.
3. Wire `RequestIdMiddleware` in `main.ts` (or AppModule consumer) so `requestId` + `X-Request-Id` actually set.
4. Real health check with DB ping (`SELECT 1` via DatabaseService) on `/check` (keep `/` shape compatible); no full APM/Sentry/OTel yet.
5. Behavior-preserving: no endpoint output changes except added health fields + log lines.

## Relevant Areas

- shared/rules/architecture.md, shared/skills/backend/MUST-HAVES.md
- backend/src/core/database/database.provider.ts
- backend/src/commons/interceptors/logging.interceptor.ts
- backend/src/core/middleware/request-id.middleware.ts
- backend/src/main.ts
- backend/src/modules/health/health.controller.ts + health.module.ts

## Acceptance Criteria

- [ ] `PRISMA_QUERY_LOG=true` enables `log: ['query','warn','error']` locally; unset/off in prod (no query log spam)
- [ ] Errored requests still log with duration + statusCode
- [ ] `X-Request-Id` header present; interceptor logs non-undefined requestId
- [ ] `GET /check` fails if DB unreachable (real ping), `GET /` stays compatible
- [ ] `lint + typecheck + targeted tests` pass

## Confidence

Score: 95/100
- Requirement clarity: 25 (4 explicit steps, no APM scope)
- Codebase verification: 25 (read provider, interceptor, middleware, main, health controller/module, package.json)
- Architecture fit: 20 (interceptor/middleware/health placement matches existing layers)
- Edge cases: 12 (WS context has no HTTP req — guard with optional chaining; prod log gate verified via env)
- Blast radius: 13 (global interceptor + health; low risk, no grading/migration/auth touched)
Proceeding; assumption: implement DB ping via DatabaseService `$queryRaw SELECT 1` without adding `@nestjs/terminus` dep (reuse over new dep per shared/rules/dependencies.md; same observable outcome, zero dep risk). Flagging for review.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-09-25 — Claimed, creating worktree from development.
Confidence: 95/100 (Requirement clarity 25, Codebase verification 25, Architecture fit 20, Edge cases 12, Blast radius 13). Gaps: WS-context req shape; prod-gate env verified at runtime. Assumption: reuse DatabaseService for health ping instead of new terminus dep.

## Commits

None yet.

## Notes

Phase 0 of perf audit fixes. Phases 1-7 follow as separate tickets/commits. No APM/Sentry/OTel in this phase by design.
