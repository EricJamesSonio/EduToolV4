/*
  Warnings:

  - Added the required column `school_year_id` to the `GradingScheme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_year_id` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GradingScheme" ADD COLUMN     "school_year_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "school_year_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingScheme" ADD CONSTRAINT "GradingScheme_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
