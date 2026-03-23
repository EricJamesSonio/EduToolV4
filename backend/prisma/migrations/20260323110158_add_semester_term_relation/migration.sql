-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_semester_id_fkey" FOREIGN KEY ("semester_id") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
