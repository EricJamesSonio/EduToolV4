-- CreateEnum
CREATE TYPE "SectionOverflowAction" AS ENUM ('auto_create', 'no_section', 'expand_capacity');

-- AlterTable
ALTER TABLE "EnrollmentPeriod" ADD COLUMN     "section_overflow_action" "SectionOverflowAction" NOT NULL DEFAULT 'no_section';
