-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "end_date" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
