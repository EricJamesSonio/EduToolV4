/*
  Warnings:

  - The `status` column on the `SchoolYear` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SchoolYearStatus" AS ENUM ('pending', 'active', 'ended');

-- CreateEnum
CREATE TYPE "SchoolYearEnrollmentStatus" AS ENUM ('active', 'pending', 'unenrolled');

-- AlterTable
ALTER TABLE "SchoolYear" ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "SchoolYearStatus" NOT NULL DEFAULT 'pending';

-- CreateTable
CREATE TABLE "OrgEnrollmentSetting" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "require_semester_reenrollment" BOOLEAN NOT NULL DEFAULT false,
    "auto_unenroll_on_year_end" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgEnrollmentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSchoolYear" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_year_id" TEXT NOT NULL,
    "status" "SchoolYearEnrollmentStatus" NOT NULL DEFAULT 'pending',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unenrolled_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "StudentSchoolYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentProgramEnrollment" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "student_school_year_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "level_id" TEXT,
    "course_id" TEXT,
    "strand_id" TEXT,
    "section_id" TEXT,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'active',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentProgramEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgEnrollmentSetting_org_id_key" ON "OrgEnrollmentSetting"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSchoolYear_org_id_student_id_school_year_id_key" ON "StudentSchoolYear"("org_id", "student_id", "school_year_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentProgramEnrollment_student_school_year_id_program_id_key" ON "StudentProgramEnrollment"("student_school_year_id", "program_id");

-- AddForeignKey
ALTER TABLE "StudentSchoolYear" ADD CONSTRAINT "StudentSchoolYear_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramEnrollment" ADD CONSTRAINT "StudentProgramEnrollment_student_school_year_id_fkey" FOREIGN KEY ("student_school_year_id") REFERENCES "StudentSchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramEnrollment" ADD CONSTRAINT "StudentProgramEnrollment_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramEnrollment" ADD CONSTRAINT "StudentProgramEnrollment_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "Level"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramEnrollment" ADD CONSTRAINT "StudentProgramEnrollment_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramEnrollment" ADD CONSTRAINT "StudentProgramEnrollment_strand_id_fkey" FOREIGN KEY ("strand_id") REFERENCES "Strand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentProgramEnrollment" ADD CONSTRAINT "StudentProgramEnrollment_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Semester" ADD CONSTRAINT "Semester_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "SchoolYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
