/*
  Warnings:

  - A unique constraint covering the columns `[org_id,school_year_id,program_id,template_semester_id]` on the table `Semester` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `program_id` to the `Semester` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Semester" ADD COLUMN     "program_id" TEXT NOT NULL,
ADD COLUMN     "template_semester_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Semester_org_id_school_year_id_program_id_template_semester_key" ON "Semester"("org_id", "school_year_id", "program_id", "template_semester_id");

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_template_semester_id_fkey" FOREIGN KEY ("template_semester_id") REFERENCES "SemesterTemplateItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
