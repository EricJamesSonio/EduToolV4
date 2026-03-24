/*
  Warnings:

  - A unique constraint covering the columns `[org_id,student_id,class_id,term_id]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Grade_org_id_student_id_class_id_term_id_key" ON "Grade"("org_id", "student_id", "class_id", "term_id");
