/*
  Warnings:

  - The values [admin_correction] on the enum `ProgramEnrollmentEndReason` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProgramEnrollmentEndReason_new" AS ENUM ('shifted', 'completed', 'withdrawn', 'dropped', 'admin_correctionorganiz', 'other');
ALTER TABLE "StudentProgramEnrollment" ALTER COLUMN "end_reason" TYPE "ProgramEnrollmentEndReason_new" USING ("end_reason"::text::"ProgramEnrollmentEndReason_new");
ALTER TYPE "ProgramEnrollmentEndReason" RENAME TO "ProgramEnrollmentEndReason_old";
ALTER TYPE "ProgramEnrollmentEndReason_new" RENAME TO "ProgramEnrollmentEndReason";
DROP TYPE "ProgramEnrollmentEndReason_old";
COMMIT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "auto_seed_new_school_years" BOOLEAN NOT NULL DEFAULT false;
