-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "program_id" TEXT,
ADD COLUMN     "subject_type" TEXT NOT NULL DEFAULT 'major';

-- CreateTable
CREATE TABLE "SubjectSharing" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "course_id" TEXT,
    "strand_id" TEXT,
    "level_id" TEXT,

    CONSTRAINT "SubjectSharing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectSharing_subject_id_course_id_key" ON "SubjectSharing"("subject_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectSharing_subject_id_strand_id_key" ON "SubjectSharing"("subject_id", "strand_id");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectSharing_subject_id_level_id_key" ON "SubjectSharing"("subject_id", "level_id");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSharing" ADD CONSTRAINT "SubjectSharing_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSharing" ADD CONSTRAINT "SubjectSharing_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSharing" ADD CONSTRAINT "SubjectSharing_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectSharing" ADD CONSTRAINT "SubjectSharing_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;
