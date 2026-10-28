-- SubjectCompletionOverride: provenance of the completion row.
-- Existing rows were all admin-created, so DEFAULT 'manual' backfills them correctly.
ALTER TABLE "SubjectCompletionOverride" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'manual';

-- StudentProgramEnrollment: "mark as regular" bookkeeping.
ALTER TABLE "StudentProgramEnrollment" ADD COLUMN "is_regular" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StudentProgramEnrollment" ADD COLUMN "regular_marked_at" TIMESTAMP(3);
ALTER TABLE "StudentProgramEnrollment" ADD COLUMN "regular_marked_by" TEXT;
