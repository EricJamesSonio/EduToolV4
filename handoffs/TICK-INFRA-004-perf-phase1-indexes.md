# Handoff — TICK-INFRA-004 Perf Phase 1 indexes

Status: ready-for-review (branch `agent/TICK-INFRA-004-perf-phase1-indexes`, commit `43877439`, PR vs `development`)
Worktree: `../EduToolV4-worktrees/TICK-INFRA-004-perf-phase1-indexes` (keep until merged)

## What changed (3 files, additive DDL only, no behavior change)
1. `backend/prisma/schema.prisma` — `@@index`/`@@unique` on 11 models: Class x3, Enrollment x2+unique, Assessment x2, Submission x2, AttendanceSession x1, AttendanceRecord x1, Grade x2 (class-first, fixes unique prefix trap), Account x2, AuditLog x2, Notification x2, GroupyMessage x1.
2. `backend/prisma/migrations/20260925120000_perf_hot_path_indexes/migration.sql` — plain `CREATE [UNIQUE] INDEX IF NOT EXISTS` (transaction-safe; this is Prisma's supported approach — `migrate deploy` wraps migration.sql in a transaction and CONCURRENTLY is rejected inside one).
3. `backend/prisma/scripts/apply-perf-indexes-concurrently.sql` — same 21 indexes with CONCURRENTLY for zero-downtime prod (run via psql autocommit, never in BEGIN/COMMIT, never via `migrate deploy`; header documents the `migrate resolve --applied` ledger step).

## Self-verification (done, no manual check needed)
- Snapshot (read-only, shared dev Aiven DB): Enrollment=0, Grade=0, Submission=0, AttendanceRecord=0.
- Duplicate check `(org_id, class_id, student_id)`: 0 groups / 0 extra rows → unique applied with NO cleanup. No blocker.
- `prisma validate`: valid. `prisma migrate deploy`: all applied successfully.
- pg_indexes: 21/21 FOUND, 0 missing; `NOT indisvalid`: 0 rows (no failed concurrent leftovers).
- tsc: no new errors (3 pre-existing, same as clean development).
- DESC note: `(org_id, created_at DESC)`-style sorts are served by plain composite btrees via backward scan — no `sort: Desc` needed in schema.
- OrgHolidayConfig drift: SKIPPED per user instruction.

## Reusable pattern for future index batches
Two-file template, index names = Prisma `@@index` convention (`{Model}_{cols}_idx` / `{Model}_{cols}_key`) so schema and DB stay drift-free; migration.sql = IF NOT EXISTS plain (migrate-safe), scripts/ = CONCURRENTLY (prod-safe). Next batch copies this shape.

## Watch-outs for reviewer
- Migration already applied to the shared dev DB (empty tables, instant). Merging only adds the files; no re-apply needed there.
- Prod with real volume should use the CONCURRENTLY script + `migrate resolve --applied` (documented in script header).
