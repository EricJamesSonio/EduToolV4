-- Phase 2 (auto-class): per-subject weekly session requirement.
--
-- Both columns are NULLABLE and default to NULL, which means "use the
-- program-type default". Existing subjects are therefore untouched by this
-- migration: no backfill, nothing to invalidate.
ALTER TABLE "Subject"
    ADD COLUMN "sessions_per_week" INTEGER,
    ADD COLUMN "session_minutes" INTEGER;
