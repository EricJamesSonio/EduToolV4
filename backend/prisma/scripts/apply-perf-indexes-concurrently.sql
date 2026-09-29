-- Perf Phase 1: zero-downtime variant of
-- migrations/20260925120000_perf_hot_path_indexes/migration.sql
--
-- HOW TO RUN (production with live traffic):
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f apply-perf-indexes-concurrently.sql
-- RULES:
--   - Do NOT wrap this file in BEGIN/COMMIT. psql runs each statement in
--     autocommit by default — keep it that way. CREATE INDEX CONCURRENTLY
--     fails inside a transaction block.
--   - Do NOT run via `prisma migrate deploy` (it transaction-wraps migration.sql).
--   - After applying, mark the Prisma migration resolved if needed:
--       prisma migrate resolve --applied "20260925120000_perf_hot_path_indexes"
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

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Class_org_id_school_year_id_semester_id_idx" ON "Class"("org_id", "school_year_id", "semester_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Class_org_id_educator_id_idx" ON "Class"("org_id", "educator_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Class_org_id_created_at_idx" ON "Class"("org_id", "created_at");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Enrollment_org_id_class_id_status_idx" ON "Enrollment"("org_id", "class_id", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Enrollment_org_id_student_id_status_idx" ON "Enrollment"("org_id", "student_id", "status");
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "Enrollment_org_id_class_id_student_id_key" ON "Enrollment"("org_id", "class_id", "student_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assessment_org_id_class_id_term_id_idx" ON "Assessment"("org_id", "class_id", "term_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Assessment_org_id_class_id_type_idx" ON "Assessment"("org_id", "class_id", "type");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Submission_assessment_id_student_id_idx" ON "Submission"("assessment_id", "student_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Submission_org_id_assessment_id_idx" ON "Submission"("org_id", "assessment_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "AttendanceSession_class_id_week_number_idx" ON "AttendanceSession"("class_id", "week_number");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AttendanceRecord_session_id_student_id_idx" ON "AttendanceRecord"("session_id", "student_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Grade_org_id_class_id_term_id_idx" ON "Grade"("org_id", "class_id", "term_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Grade_org_id_class_id_idx" ON "Grade"("org_id", "class_id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Account_org_id_role_status_idx" ON "Account"("org_id", "role", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Account_org_id_status_created_at_idx" ON "Account"("org_id", "status", "created_at");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_org_id_created_at_idx" ON "AuditLog"("org_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_org_id_log_type_created_at_idx" ON "AuditLog"("org_id", "log_type", "created_at");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_org_id_account_id_created_at_idx" ON "Notification"("org_id", "account_id", "created_at");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Notification_archived_at_created_at_idx" ON "Notification"("archived_at", "created_at");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "GroupyMessage_org_id_class_id_created_at_idx" ON "GroupyMessage"("org_id", "class_id", "created_at");
