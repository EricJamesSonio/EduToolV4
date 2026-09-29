-- Phase 3 (perf): hot-path index gaps left by 20260925120000_perf_hot_path_indexes.
--
-- *** FOR REVIEW ONLY — DO NOT APPLY to a shared/staging DB until told. ***
-- No statement here was executed; `prisma migrate dev/deploy` has NOT been run.
--
-- TRANSACTION-SAFE variant: plain CREATE INDEX, which is what `prisma migrate
-- deploy` / `migrate dev` can run (Prisma wraps migration.sql in a transaction,
-- and CREATE INDEX CONCURRENTLY is rejected inside a transaction block).
--
-- For zero-downtime application on a populated production database, use
-- prisma/scripts/apply-perf-indexes-2-concurrently.sql instead (same index set,
-- CONCURRENTLY, autocommit — run with psql, NOT inside BEGIN/COMMIT).
-- Non-partial index names match Prisma's @@index naming convention so the
-- schema and the database stay in drift-free sync. The two PARTIAL indexes
-- (Notification inbox, Submission reopened_until) cannot be expressed in the
-- Prisma schema — they are intentionally migration-only and documented here.

-- ManualScore: class-wide manual-score sweeps filter (org, class, term); the
-- unique (org, class, student, term, category) only prefixes (org, class).
CREATE INDEX IF NOT EXISTS "ManualScore_org_id_class_id_term_id_idx" ON "ManualScore"("org_id", "class_id", "term_id");

-- Submission: student-transcript prereq lookups filter (org, student); the
-- Phase-1 unique prefixes (assessment_id) and can't serve them.
CREATE INDEX IF NOT EXISTS "Submission_org_id_student_id_idx" ON "Submission"("org_id", "student_id");
-- Submission: draft-sweep + educator submission lists filter (assessment, status).
CREATE INDEX IF NOT EXISTS "Submission_assessment_id_status_idx" ON "Submission"("assessment_id", "status");

-- Grade: prereq lookups filter (org, student, is_locked).
CREATE INDEX IF NOT EXISTS "Grade_org_id_student_id_is_locked_idx" ON "Grade"("org_id", "student_id", "is_locked");

-- Question: every findQuestions call filters by assessment (was seq-scan).
CREATE INDEX IF NOT EXISTS "Question_assessment_id_idx" ON "Question"("assessment_id");

-- SubmissionAnswer: every findAnswers call filters by submission (was seq-scan).
CREATE INDEX IF NOT EXISTS "SubmissionAnswer_submission_id_idx" ON "SubmissionAnswer"("submission_id");

-- AttendanceSession: markPresentFromSubmission ranges on (class, date).
CREATE INDEX IF NOT EXISTS "AttendanceSession_class_id_date_idx" ON "AttendanceSession"("class_id", "date");

-- AuditLog: admin-log explorer filters by entity + actor.
CREATE INDEX IF NOT EXISTS "AuditLog_org_id_entity_type_entity_id_idx" ON "AuditLog"("org_id", "entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "AuditLog_org_id_actor_id_idx" ON "AuditLog"("org_id", "actor_id");

-- Meeting: ephemeral-meeting lookup filters (class, ephemeral, status).
CREATE INDEX IF NOT EXISTS "Meeting_class_id_is_ephemeral_status_idx" ON "Meeting"("class_id", "is_ephemeral", "status");

-- Notification: active-inbox queries filter archived_at IS NULL — partial index
-- keeps it small (migration-only; Prisma cannot express partial indexes).
CREATE INDEX IF NOT EXISTS "Notification_org_id_account_id_created_at_active_idx" ON "Notification"("org_id", "account_id", "created_at") WHERE archived_at IS NULL;

-- Submission: reopened_until sweep touches only non-NULL rows (migration-only).
CREATE INDEX IF NOT EXISTS "Submission_reopened_until_active_idx" ON "Submission"("reopened_until") WHERE reopened_until IS NOT NULL;
