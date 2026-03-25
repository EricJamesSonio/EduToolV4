-- AddForeignKey
ALTER TABLE "GradeLock" ADD CONSTRAINT "GradeLock_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
