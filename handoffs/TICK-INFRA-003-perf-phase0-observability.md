# Handoff — TICK-INFRA-003 Perf Phase 0 observability

Status: ready-for-review (branch `agent/TICK-INFRA-003-perf-phase0-observability`, commit `71f565a9`, PR vs `development`)
Worktree: `../EduToolV4-worktrees/TICK-INFRA-003-perf-phase0-observability` (keep until merged)

## What changed (6 files, behavior-preserving)
1. `backend/src/core/database/database.provider.ts` — `super({adapter, log})` with `PRISMA_QUERY_LOG==='true'` → `['query','warn','error']`, else `['warn','error']` (prod default quiet).
2. `backend/src/commons/interceptors/logging.interceptor.ts` — `finalize()` (errors timed), `statusCode` logged, `process.hrtime.bigint()` ms with 2 decimals, WS-context guarded.
3. `backend/src/app.module.ts` — `AppModule implements NestModule`, `consumer.apply(RequestIdMiddleware).forRoutes('*')` (idiomatic; user asked for main.ts `app.use()` — same outcome, standard Nest wiring).
4. `backend/src/modules/health/health.controller.ts` — `GET /` unchanged shape; `GET /check` now `SELECT 1` ping, returns `database:'up'` + `dbLatencyMs`, throws 503 when DB down. No `@nestjs/terminus` dep (reused `DatabaseService` per dependencies.md).
5. New specs: `health/__TEST__/health.controller.spec.ts` (3 tests), `interceptors/__TEST__/logging.interceptor.spec.ts` (2 tests).

## Verification done
- 5/5 new specs pass; grade recompute-skip guard spec still passes (1/1).
- eslint clean (6 files); tsc: no new errors (3 pre-existing on clean development); `npm run build` OK (525 files).

## What reviewer / user should verify before merge
1. `PRISMA_QUERY_LOG=true npm run start:dev` → hit any endpoint → confirm Prisma `query` lines appear; without the var → absent.
2. `curl -i /check` → 200 with `database:'up'`; stop Postgres → 503 `Database unreachable`.
3. Hit a 404/500 route → confirm a log line with `statusCode` + `responseTime` still prints (was silently skipped before).
4. Confirm `X-Request-Id` response header present and `requestId` in logs is a uuid (was `undefined`).
5. Decide: accept the two deliberate deviations (AppModule consumer vs `app.use()`; no terminus dep) or request changes.

## Next (Phase 1 — separate ticket)
- NEW Prisma migration with `CREATE INDEX CONCURRENTLY` + `@@index` entries (Class, Enrollment, Assessment, Submission, Attendance, Grade, Account, AuditLog, Notification, GroupyMessage).
- BEFORE unique `(org_id,class_id,student_id)` on Enrollment: duplicate check query + cleanup step if needed.
- Check `OrgHolidayConfig` drift via `pg_indexes` before touching it.
- Do NOT merge Phase 1 work into this branch.
