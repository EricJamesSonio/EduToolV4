/*
  Warnings:

  - You are about to drop the column `level_id` on the `GradingScale` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[school_year_id,program_id]` on the table `GradingScale` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `program_id` to the `GradingScale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GradingScale" DROP COLUMN "level_id",
ADD COLUMN     "program_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "GradingScale_school_year_id_program_id_key" ON "GradingScale"("school_year_id", "program_id");

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingScale" ADD CONSTRAINT "GradingScale_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
