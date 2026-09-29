-- Phase 1 (perf/correctness): native-upsert unique keys for Submission + AttendanceRecord.
--
-- *** FOR REVIEW ONLY — DO NOT APPLY to a shared/staging DB until told. ***
-- The application code gates native `upsert` behind NATIVE_UPSERT_ENABLED
-- (default off), so this migration must land BEFORE flipping that flag.
--
-- PRE-FLIGHT (run these first; both must return 0 rows or the UNIQUE add fails):
--   SELECT assessment_id, student_id, COUNT(*) FROM "Submission"
--     GROUP BY 1, 2 HAVING COUNT(*) > 1;
--   SELECT session_id, student_id, COUNT(*) FROM "AttendanceRecord"
--     GROUP BY 1, 2 HAVING COUNT(*) > 1;
-- If duplicates exist, dedupe (keep latest row per key) before applying.
--
-- Transaction-safe variant: plain ALTER TABLE ... ADD CONSTRAINT, which is what
-- `prisma migrate deploy` / `migrate dev` can run (migration.sql runs inside a
-- transaction block, so CREATE UNIQUE INDEX CONCURRENTLY is rejected here).
-- For zero-downtime application on a populated production database, apply the
-- equivalent CONCURRENTLY statements with psql (autocommit, NOT in a txn).
-- Constraint names match Prisma's @@unique naming convention so schema and DB
-- stay in drift-free sync.

-- Submission: replace plain (assessment_id, student_id) index with UNIQUE
DROP INDEX IF EXISTS "Submission_assessment_id_student_id_idx";
ALTER TABLE "Submission"
  ADD CONSTRAINT "Submission_assessment_id_student_id_key"
  UNIQUE ("assessment_id", "student_id");

-- AttendanceRecord: replace plain (session_id, student_id) index with UNIQUE
DROP INDEX IF EXISTS "AttendanceRecord_session_id_student_id_idx";
ALTER TABLE "AttendanceRecord"
  ADD CONSTRAINT "AttendanceRecord_session_id_student_id_key"
  UNIQUE ("session_id", "student_id");
