-- AlterTable
ALTER TABLE "ClassAssignmentRequest" ADD COLUMN "student_requested_class_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "admin_approved_class_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];