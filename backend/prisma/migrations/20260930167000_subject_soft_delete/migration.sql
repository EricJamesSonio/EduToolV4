-- Soft delete (archive) for Subject.
--
-- A subject with ANY class referencing it (including soft-deleted classes,
-- which still hold the Subject FK) is archived (`deleted_at = now()`) instead
-- of hard-deleted, so transcripts, grades and class history keep resolving.
-- Class-free subjects are still hard-deleted by the service.
--
-- NULLABLE with no backfill on purpose: every existing row stays NULL (active),
-- and name-uniqueness checks ignore archived rows at the application level.
ALTER TABLE "Subject"
    ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "Subject_org_id_deleted_at_idx" ON "Subject"("org_id", "deleted_at");
