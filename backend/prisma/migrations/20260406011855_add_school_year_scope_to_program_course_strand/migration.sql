/*
  Warnings:

  - Added the required column `school_year_id` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Made the column `school_year_id` on table `GradingScale` required. This step will fail if there are existing NULL values in that column.
  - Made the column `school_year_id` on table `Level` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `school_year_id` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_year_id` to the `Strand` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "school_year_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "GradingScale" ALTER COLUMN "school_year_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "Level" ALTER COLUMN "school_year_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "Program" ADD COLUMN     "school_year_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Strand" ADD COLUMN     "school_year_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strand" ADD CONSTRAINT "Strand_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingScale" ADD CONSTRAINT "GradingScale_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
