-- AlterEnum
ALTER TYPE "RegistrationStatus" ADD VALUE 'needs_revision';

-- AlterTable
ALTER TABLE "RegistrationRequest" ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by" TEXT,
ADD COLUMN     "revision_notes" JSONB;
