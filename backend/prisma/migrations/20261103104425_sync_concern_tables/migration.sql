/*
  Warnings:

  - You are about to drop the column `admin_approved_class_ids` on the `ClassAssignmentRequest` table. All the data in the column will be lost.
  - You are about to drop the column `student_requested_class_ids` on the `ClassAssignmentRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClassAssignmentRequest" DROP COLUMN "admin_approved_class_ids",
DROP COLUMN "student_requested_class_ids";
