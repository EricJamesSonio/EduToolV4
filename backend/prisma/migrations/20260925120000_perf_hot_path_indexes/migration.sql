-- Perf Phase 1: hot-path indexes (TICK-INFRA-004)
--
-- TRANSACTION-SAFE variant: plain CREATE INDEX, which is what `prisma migrate
-- deploy` / `migrate dev` can run (Prisma wraps migration.sql in a transaction,
-- and CREATE INDEX CONCURRENTLY is rejected inside a transaction block).
--
-- For zero-downtime application on a populated production database, use
-- prisma/scripts/apply-perf-indexes-concurrently.sql instead (same index set,
-- CONCURRENTLY, autocommit — run with psql, NOT inside BEGIN/COMMIT).
-- Index names below match Prisma's @@index/@@unique naming convention so the
-- schema and the database stay in drift-free sync.

-- Class: org-scoped list filters + educator load + recency sort
CREATE INDEX IF NOT EXISTS "Class_org_id_school_year_id_semester_id_idx" ON "Class"("org_id", "school_year_id", "semester_id");
CREATE INDEX IF NOT EXISTS "Class_org_id_educator_id_idx" ON "Class"("org_id", "educator_id");
CREATE INDEX IF NOT EXISTS "Class_org_id_created_at_idx" ON "Class"("org_id", "created_at");

-- Enrollment: class roster / student schedule lookups + dedupe guard (verified
-- dup-free on 2026-09-25: 0 groups over (org_id, class_id, student_id))
CREATE INDEX IF NOT EXISTS "Enrollment_org_id_class_id_status_idx" ON "Enrollment"("org_id", "class_id", "status");
CREATE INDEX IF NOT EXISTS "Enrollment_org_id_student_id_status_idx" ON "Enrollment"("org_id", "student_id", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_org_id_class_id_student_id_key" ON "Enrollment"("org_id", "class_id", "student_id");

-- Assessment: class+term and class+type filters
CREATE INDEX IF NOT EXISTS "Assessment_org_id_class_id_term_id_idx" ON "Assessment"("org_id", "class_id", "term_id");
CREATE INDEX IF NOT EXISTS "Assessment_org_id_class_id_type_idx" ON "Assessment"("org_id", "class_id", "type");

-- Submission: per-student-per-assessment key + org+assessment sweeps
CREATE INDEX IF NOT EXISTS "Submission_assessment_id_student_id_idx" ON "Submission"("assessment_id", "student_id");
CREATE INDEX IF NOT EXISTS "Submission_org_id_assessment_id_idx" ON "Submission"("org_id", "assessment_id");

-- Attendance
CREATE INDEX IF NOT EXISTS "AttendanceSession_class_id_week_number_idx" ON "AttendanceSession"("class_id", "week_number");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_session_id_student_id_idx" ON "AttendanceRecord"("session_id", "student_id");

-- Grade: class-first lookups that cannot use the (org_id, student_id, ...)-first unique
CREATE INDEX IF NOT EXISTS "Grade_org_id_class_id_term_id_idx" ON "Grade"("org_id", "class_id", "term_id");
CREATE INDEX IF NOT EXISTS "Grade_org_id_class_id_idx" ON "Grade"("org_id", "class_id");

-- Account: org role/status lists + recency sort
CREATE INDEX IF NOT EXISTS "Account_org_id_role_status_idx" ON "Account"("org_id", "role", "status");
CREATE INDEX IF NOT EXISTS "Account_org_id_status_created_at_idx" ON "Account"("org_id", "status", "created_at");

-- AuditLog: org timeline + log_type filter (ORDER BY created_at DESC uses backward scan)
CREATE INDEX IF NOT EXISTS "AuditLog_org_id_created_at_idx" ON "AuditLog"("org_id", "created_at");
CREATE INDEX IF NOT EXISTS "AuditLog_org_id_log_type_created_at_idx" ON "AuditLog"("org_id", "log_type", "created_at");

-- Notification: per-user inbox + 90-day archive sweep
CREATE INDEX IF NOT EXISTS "Notification_org_id_account_id_created_at_idx" ON "Notification"("org_id", "account_id", "created_at");
CREATE INDEX IF NOT EXISTS "Notification_archived_at_created_at_idx" ON "Notification"("archived_at", "created_at");

-- GroupyMessage: per-class chat pagination (created_at < cursor ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS "GroupyMessage_org_id_class_id_created_at_idx" ON "GroupyMessage"("org_id", "class_id", "created_at");
