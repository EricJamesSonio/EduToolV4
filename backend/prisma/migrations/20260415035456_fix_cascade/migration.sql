-- DropForeignKey
ALTER TABLE "SemesterTemplateTerm" DROP CONSTRAINT "SemesterTemplateTerm_semester_id_fkey";

-- AddForeignKey
ALTER TABLE "SemesterTemplateTerm" ADD CONSTRAINT "SemesterTemplateTerm_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "SemesterTemplateItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
