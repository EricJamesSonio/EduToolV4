/*
  Warnings:

  - A unique constraint covering the columns `[class_id,week_number,sub_index]` on the table `Lesson` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Lesson_class_id_week_number_sub_index_key" ON "Lesson"("class_id", "week_number", "sub_index");
