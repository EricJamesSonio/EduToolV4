-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('org_registration', 'enrollment_verification');

-- CreateEnum
CREATE TYPE "EnrollmentApplicationStatus" AS ENUM ('pending', 'locked', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "is_registrar" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "org_id" TEXT,
ADD COLUMN     "purpose" "OtpPurpose" NOT NULL DEFAULT 'org_registration';

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "order_index" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "EnrollmentPeriod" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "lock_date" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentApplication" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "enrollment_period_id" TEXT NOT NULL,
    "application_code" TEXT NOT NULL,
    "personal_email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT NOT NULL,
    "age" INTEGER,
    "address" TEXT,
    "contact_number" TEXT,
    "last_school_graduated" TEXT,
    "program_id" TEXT NOT NULL,
    "course_id" TEXT,
    "strand_id" TEXT,
    "level_id" TEXT NOT NULL,
    "section_id" TEXT,
    "status" "EnrollmentApplicationStatus" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "locked_at" TIMESTAMP(3),
    "unlocked_by" TEXT,
    "unlocked_at" TIMESTAMP(3),
    "resulting_account_id" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentPeriod_token_key" ON "EnrollmentPeriod"("token");

-- CreateIndex
CREATE INDEX "EnrollmentPeriod_org_id_school_year_id_idx" ON "EnrollmentPeriod"("org_id", "school_year_id");

-- CreateIndex
CREATE INDEX "EnrollmentApplication_org_id_school_year_id_enrollment_peri_idx" ON "EnrollmentApplication"("org_id", "school_year_id", "enrollment_period_id");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentApplication_org_id_school_year_id_personal_email_key" ON "EnrollmentApplication"("org_id", "school_year_id", "personal_email");

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentApplication_org_id_school_year_id_application_cod_key" ON "EnrollmentApplication"("org_id", "school_year_id", "application_code");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- AddForeignKey
ALTER TABLE "EnrollmentPeriod" ADD CONSTRAINT "EnrollmentPeriod_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_enrollment_period_id_fkey" FOREIGN KEY ("enrollment_period_id") REFERENCES "EnrollmentPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentApplication" ADD CONSTRAINT "EnrollmentApplication_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill a deterministic, unique slug for every pre-existing organization.
-- Existing org-creation callers do not supply a slug, so the column stays
-- nullable in the schema; the portal assigns one when enabled.
UPDATE "Organization"
SET "slug" = CASE
  WHEN trim(both '-' from regexp_replace(lower("name"), '[^[:alnum:]]+', '-', 'g')) <> ''
    THEN trim(both '-' from regexp_replace(lower("name"), '[^[:alnum:]]+', '-', 'g')) || '-' || left("id", 8)
  ELSE 'org-' || left("id", 8)
END;
