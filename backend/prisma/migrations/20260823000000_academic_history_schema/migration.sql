-- CreateEnum
CREATE TYPE "ProgramEnrollmentStatus" AS ENUM ('active', 'ended');

-- CreateEnum
CREATE TYPE "ProgramEnrollmentEndReason" AS ENUM ('shifted', 'completed', 'withdrawn', 'dropped', 'admin_correction', 'other');

-- CreateEnum
CREATE TYPE "ClassEnrollmentOutcome" AS ENUM ('passed', 'failed', 'dropped', 'withdrawn', 'withdrawn_due_to_shifting', 'transferred_credited', 'completed');

-- AlterTable OrgEnrollmentSetting
ALTER TABLE "OrgEnrollmentSetting" ADD COLUMN "default_shift_outcome" "ClassEnrollmentOutcome" NOT NULL DEFAULT 'dropped';

-- AlterTable StudentProgramEnrollment
ALTER TABLE "StudentProgramEnrollment" ADD COLUMN "section_assigned_at" TIMESTAMP(3);
ALTER TABLE "StudentProgramEnrollment" ADD COLUMN "end_reason" "ProgramEnrollmentEndReason";
ALTER TABLE "StudentProgramEnrollment" ADD COLUMN "ended_at" TIMESTAMP(3);
ALTER TABLE "StudentProgramEnrollment" ADD COLUMN "ended_by" TEXT;

-- Alter status type from EnrollmentStatus to ProgramEnrollmentStatus (safe cast via text)
ALTER TABLE "StudentProgramEnrollment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "StudentProgramEnrollment" ALTER COLUMN "status" TYPE "ProgramEnrollmentStatus" USING ("status"::text::"ProgramEnrollmentStatus");
ALTER TABLE "StudentProgramEnrollment" ALTER COLUMN "status" SET DEFAULT 'active';

-- Drop old full unique constraint/index
DROP INDEX "StudentProgramEnrollment_student_school_year_id_program_id_key";

-- CreateTable ProgramShiftEvent
CREATE TABLE "ProgramShiftEvent" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_school_year_id" TEXT NOT NULL,
    "from_program_enrollment_id" TEXT NOT NULL,
    "to_program_enrollment_id" TEXT NOT NULL,
    "default_outcome_used" "ClassEnrollmentOutcome" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramShiftEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex ProgramShiftEvent unique + org index
CREATE UNIQUE INDEX "ProgramShiftEvent_from_program_enrollment_id_key" ON "ProgramShiftEvent"("from_program_enrollment_id");
CREATE UNIQUE INDEX "ProgramShiftEvent_to_program_enrollment_id_key" ON "ProgramShiftEvent"("to_program_enrollment_id");
CREATE INDEX "ProgramShiftEvent_org_id_student_school_year_id_idx" ON "ProgramShiftEvent"("org_id", "student_school_year_id");

-- AlterTable Enrollment
ALTER TABLE "Enrollment" ADD COLUMN "outcome" "ClassEnrollmentOutcome";
ALTER TABLE "Enrollment" ADD COLUMN "outcome_reason" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN "outcome_set_at" TIMESTAMP(3);
ALTER TABLE "Enrollment" ADD COLUMN "outcome_set_by" TEXT;
ALTER TABLE "Enrollment" ADD COLUMN "shift_event_id" TEXT;

-- AddForeignKey
ALTER TABLE "ProgramShiftEvent" ADD CONSTRAINT "ProgramShiftEvent_from_program_enrollment_id_fkey" FOREIGN KEY ("from_program_enrollment_id") REFERENCES "StudentProgramEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProgramShiftEvent" ADD CONSTRAINT "ProgramShiftEvent_to_program_enrollment_id_fkey" FOREIGN KEY ("to_program_enrollment_id") REFERENCES "StudentProgramEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_shift_event_id_fkey" FOREIGN KEY ("shift_event_id") REFERENCES "ProgramShiftEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Partial unique index: only one active program enrollment per student_school_year + program
CREATE UNIQUE INDEX "StudentProgramEnrollment_active_unique" ON "StudentProgramEnrollment"("student_school_year_id", "program_id") WHERE status = 'active';
