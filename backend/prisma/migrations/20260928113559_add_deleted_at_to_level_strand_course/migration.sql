-- DropForeignKey
ALTER TABLE "Level" DROP CONSTRAINT "Level_course_id_fkey";

-- DropForeignKey
ALTER TABLE "Level" DROP CONSTRAINT "Level_strand_id_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_course_id_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_strand_id_fkey";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Level" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Strand" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Course_org_id_school_year_id_deleted_at_idx" ON "Course"("org_id", "school_year_id", "deleted_at");

-- CreateIndex
CREATE INDEX "Level_org_id_school_year_id_deleted_at_idx" ON "Level"("org_id", "school_year_id", "deleted_at");

-- CreateIndex
CREATE INDEX "Strand_org_id_school_year_id_deleted_at_idx" ON "Strand"("org_id", "school_year_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "Strand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "Strand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
