/*
  Warnings:

  - You are about to drop the column `program_id` on the `GradingScale` table. All the data in the column will be lost.
  - You are about to drop the column `school_year_id` on the `GradingScale` table. All the data in the column will be lost.
  - Added the required column `program_type` to the `GradingScale` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GradingScale" DROP CONSTRAINT "GradingScale_program_id_fkey";

-- DropForeignKey
ALTER TABLE "GradingScale" DROP CONSTRAINT "GradingScale_school_year_id_fkey";

-- DropIndex
DROP INDEX "GradingScale_school_year_id_program_id_key";

-- AlterTable
ALTER TABLE "GradingScale" DROP COLUMN "program_id",
DROP COLUMN "school_year_id",
ADD COLUMN     "program_type" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "GradingScaleAssignment" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "grading_scale_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingScaleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GradingScaleAssignment_program_id_school_year_id_key" ON "GradingScaleAssignment"("program_id", "school_year_id");

-- AddForeignKey
ALTER TABLE "GradingScaleAssignment" ADD CONSTRAINT "GradingScaleAssignment_grading_scale_id_fkey" FOREIGN KEY ("grading_scale_id") REFERENCES "GradingScale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingScaleAssignment" ADD CONSTRAINT "GradingScaleAssignment_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingScaleAssignment" ADD CONSTRAINT "GradingScaleAssignment_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
