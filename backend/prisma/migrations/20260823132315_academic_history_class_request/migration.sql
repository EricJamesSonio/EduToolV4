-- CreateEnum
CREATE TYPE "ClassAssignmentRequestOrigin" AS ENUM ('student_request', 'admin_flag');

-- CreateEnum
CREATE TYPE "ClassAssignmentRequestStatus" AS ENUM ('pending_review', 'ready');

-- CreateTable
CREATE TABLE "ClassAssignmentRequest" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "student_school_year_id" TEXT NOT NULL,
    "program_enrollment_id" TEXT,
    "origin" "ClassAssignmentRequestOrigin" NOT NULL,
    "status" "ClassAssignmentRequestStatus" NOT NULL DEFAULT 'pending_review',
    "student_requested_subject_ids" TEXT[],
    "admin_finalized_subject_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalized_at" TIMESTAMP(3),
    "finalized_by" TEXT,
    "reopen_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassAssignmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassAssignmentRequest_org_id_student_school_year_id_idx" ON "ClassAssignmentRequest"("org_id", "student_school_year_id");

-- CreateIndex
CREATE INDEX "ClassAssignmentRequest_org_id_student_id_idx" ON "ClassAssignmentRequest"("org_id", "student_id");

-- CreateIndex
CREATE INDEX "ClassAssignmentRequest_status_idx" ON "ClassAssignmentRequest"("status");

-- AddForeignKey
ALTER TABLE "ClassAssignmentRequest" ADD CONSTRAINT "ClassAssignmentRequest_student_school_year_id_fkey" FOREIGN KEY ("student_school_year_id") REFERENCES "StudentSchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAssignmentRequest" ADD CONSTRAINT "ClassAssignmentRequest_program_enrollment_id_fkey" FOREIGN KEY ("program_enrollment_id") REFERENCES "StudentProgramEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
