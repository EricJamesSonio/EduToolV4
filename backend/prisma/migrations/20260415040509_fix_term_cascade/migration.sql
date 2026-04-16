-- DropForeignKey
ALTER TABLE "ProgramSemesterTermDate" DROP CONSTRAINT "ProgramSemesterTermDate_term_id_fkey";

-- AddForeignKey
ALTER TABLE "ProgramSemesterTermDate" ADD CONSTRAINT "ProgramSemesterTermDate_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "SemesterTemplateTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;
