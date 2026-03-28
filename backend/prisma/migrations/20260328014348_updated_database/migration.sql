-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "course_id" TEXT,
ADD COLUMN     "strand_id" TEXT,
ADD COLUMN     "term_label" TEXT,
ADD COLUMN     "year_level" TEXT;

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Strand" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Strand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectPrerequisite" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "prerequisite_id" TEXT NOT NULL,

    CONSTRAINT "SubjectPrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectPrerequisite_subject_id_prerequisite_id_key" ON "SubjectPrerequisite"("subject_id", "prerequisite_id");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strand" ADD CONSTRAINT "Strand_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectPrerequisite" ADD CONSTRAINT "SubjectPrerequisite_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectPrerequisite" ADD CONSTRAINT "SubjectPrerequisite_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
