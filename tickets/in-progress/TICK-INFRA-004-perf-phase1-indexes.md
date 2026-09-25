# TICK-INFRA-004 — Perf Phase 1 indexes (new migration + @@index, CONCURRENTLY-safe)

Status: ready-for-review
Priority: high
Created: 2026-09-25
Created by: agent
Assigned to: agent
Started: 2026-09-25
Worktree: ../EduToolV4-worktrees/TICK-INFRA-004-perf-phase1-indexes
Branch: agent/TICK-INFRA-004-perf-phase1-indexes

## Problem

Hot-path FK/filtered columns have no indexes (audit Phase 3): Class, Enrollment, Assessment, Submission, AttendanceSession/Record, Grade (prefix trap), Account, AuditLog, Notification, GroupyMessage all seq-scan on org-scoped filters and ORDER BY created_at sorts.

## Goal

1. Snapshot row counts (Enrollment/Grade/Submission/AttendanceRecord) — done pre-claim, all zero on shared dev DB.
2. Enrollment duplicate check on (org_id, class_id, student_id) — done pre-claim: 0 dup groups, 0 extra rows → unique index safe, no cleanup needed.
3. NEW migration (no edits to old ones) + matching @@index/@@unique in schema.prisma. CONCURRENTLY must not run inside Prisma's implicit transaction — handled via dual artifact (see Notes).
4. Verify via pg_indexes + invalid-index check. OrgHolidayConfig drift check SKIPPED per user instruction.

## Relevant Areas

- shared/rules/database-migrations.md
- backend/prisma/schema.prisma
- backend/prisma/migrations/

## Acceptance Criteria

- [ ] New migration dir exists, applies cleanly (`prisma migrate diff`/`deploy` or dev migrate validates)
- [ ] schema.prisma has matching @@index/@@unique entries; `prisma validate` passes
- [ ] pg_indexes shows all new indexes; no INVALID concurrent leftovers
- [ ] No behavior change (indexes only)

## Confidence

Score: 92/100
- Requirement clarity: 25 (explicit index list + no-autodelete rule)
- Codebase verification: 23 (read schema models + recent migration format; counts/dups measured live, not assumed)
- Architecture fit: 20 (migration + schema, matches database-migrations.md)
- Edge cases: 12 (empty dev DB — production-volume plan check deferred to Phase 5 EXPLAIN; CONCURRENTLY/transaction handled via dual artifact)
- Blast radius: 12 (index-only, additive; unique on Enrollment verified dup-free)
Proceeding. Assumption: index/migration naming follows `perf_indexes` convention.

## Tests

- `prisma validate`: schema valid
- `prisma migrate deploy` vs shared dev DB: all migrations applied successfully (incl. new `20260925120000_perf_hot_path_indexes`)
- pg_indexes verification: 21/21 new indexes FOUND, 0 MISSING, 0 INVALID (`NOT indisvalid` empty)
- Row counts at apply time: Enrollment=0, Grade=0, Submission=0, AttendanceRecord=0 (no data touched)
- tsc: no new errors (same 3 pre-existing as clean development)
- Full suite: not run (index-only change; deferred to development integration after merge)
- Development integration: not run (await merge)

## Blocker

None.

## Activity Log

2026-09-25 — Pre-claim live DB snapshot (read-only SELECTs vs shared dev Aiven DB): Enrollment=0, Grade=0, Submission=0, AttendanceRecord=0. Duplicate check (org_id,class_id,student_id): 0 groups, 0 extra rows → unique safe, no cleanup. Claimed, creating worktree from development.
Confidence: 92/100 (Requirement clarity 25, Codebase verification 23, Architecture fit 20, Edge cases 12, Blast radius 12). Assumption: `perf_indexes` naming.
2026-09-25 — Implemented (43877439): 11 models +@@index/@@unique, migration.sql (plain CREATE INDEX IF NOT EXISTS, transaction-safe) + scripts/apply-perf-indexes-concurrently.sql (CONCURRENTLY, psql autocommit). Applied via migrate deploy to shared dev DB; verified 21/21 in pg_indexes, 0 invalid. No duplicates existed so unique applied with no cleanup. OrgHolidayConfig skipped per instruction.
2026-09-25 — Ready for review.

## Commits

- 43877439 perf(db): hot-path indexes for class/enrollment/assessment/grade/attendance/log tables (branch agent/TICK-INFRA-004-perf-phase1-indexes, PR vs development)

## Notes

OrgHolidayConfig drift check skipped per user instruction 2026-09-25. CONCURRENTLY handling: migration.sql uses transaction-safe plain CREATE INDEX IF NOT EXISTS (what `prisma migrate deploy` can actually run) + `scripts/apply-perf-indexes-concurrently.sql` with CONCURRENTLY variants for zero-downtime prod application outside a transaction. Both documented in handoff.
