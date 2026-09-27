-- Perf Phase 3: zero-downtime variant of
-- migrations/20260928000001_perf_hot_path_indexes_2/migration.sql
--
-- HOW TO RUN (production with live traffic):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apply-perf-indexes-2-concurrently.sql
-- RULES (same as apply-perf-indexes-concurrently.sql):
--   - Do NOT wrap this file in BEGIN/COMMIT. psql runs each statement in
--     autocommit by default — keep it that way. CREATE INDEX CONCURRENTLY
--     fails inside a transaction block.
--   - Do NOT run via `prisma migrate deploy` (it transaction-wraps migration.sql).
--   - After applying, mark the Prisma migration resolved if needed:
--       prisma migrate resolve --applied "20260928000001_perf_hot_path_indexes_2"
--     (only when the migration.sql statements were applied through this file
--     instead of `migrate deploy`, so the _prisma_migrations ledger matches).
--   - Verify afterwards:
--       SELECT indexname FROM pg_indexes
--       WHERE schemaname = 'public' AND indexname LIKE '%_idx' ORDER BY 1;
--       SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
--     The second query must return zero rows (no INVALID leftovers from a
--     failed concurrent build — drop + retry any INVALID index).
--
-- Same index set and names as migration.sql; safe to run after a plain
-- `migrate deploy` too (IF NOT EXISTS makes it a no-op where already built).

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ManualScore_org_id_class_id_term_id_idx" ON "ManualScore"("org_id", "class_id", "term_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Submission_org_id_student_id_idx" ON "Submission"("org_id", "student_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Submission_assessment_id_status_idx" ON "Submission"("assessment_id", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Grade_org_id_student_id_is_locked_idx" ON "Grade"("org_id", "student_id", "is_locked");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Question_assessment_id_idx" ON "Question"("assessment_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "SubmissionAnswer_submission_id_idx" ON "SubmissionAnswer"("submission_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AttendanceSession_class_id_date_idx" ON "AttendanceSession"("class_id", "date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_org_id_entity_type_entity_id_idx" ON "AuditLog"("org_id", "entity_type", "entity_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_org_id_actor_id_idx" ON "AuditLog"("org_id", "actor_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Meeting_class_id_is_ephemeral_status_idx" ON "Meeting"("class_id", "is_ephemeral", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_org_id_account_id_created_at_active_idx" ON "Notification"("org_id", "account_id", "created_at") WHERE archived_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Submission_reopened_until_active_idx" ON "Submission"("reopened_until") WHERE reopened_until IS NOT NULL;
