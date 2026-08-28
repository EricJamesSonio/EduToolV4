-- AlterTable SubjectPrerequisite: add created_at, fix unique to include org_id, add index
ALTER TABLE "SubjectPrerequisite" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Drop old unique without org_id
DROP INDEX IF EXISTS "SubjectPrerequisite_subject_id_prerequisite_id_key";

-- Create new unique with org_id
CREATE UNIQUE INDEX "SubjectPrerequisite_org_id_subject_id_prerequisite_id_key" ON "SubjectPrerequisite"("org_id", "subject_id", "prerequisite_id");

-- Index for frequent lookup by org + subject
CREATE INDEX "SubjectPrerequisite_org_id_subject_id_idx" ON "SubjectPrerequisite"("org_id", "subject_id");

-- AlterTable ClassAssignmentRequest: add frozen warning fields
ALTER TABLE "ClassAssignmentRequest" ADD COLUMN "has_prerequisite_warning" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ClassAssignmentRequest" ADD COLUMN "prerequisite_warnings" JSONB NOT NULL DEFAULT '[]';

-- Index for admin queue filter by warning flag (composite with org_id for tenant scoping)
CREATE INDEX "ClassAssignmentRequest_org_id_has_prerequisite_warning_idx" ON "ClassAssignmentRequest"("org_id", "has_prerequisite_warning");
