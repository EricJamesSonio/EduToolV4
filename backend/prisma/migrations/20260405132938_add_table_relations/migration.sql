/*
  Warnings:

  - Added the required column `updated_at` to the `GradingScale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GradingScale" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
