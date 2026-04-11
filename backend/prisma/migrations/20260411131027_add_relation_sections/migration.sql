-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "strand_id" TEXT;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
