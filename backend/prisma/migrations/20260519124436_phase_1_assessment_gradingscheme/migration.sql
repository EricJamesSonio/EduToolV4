-- CreateEnum
CREATE TYPE "GradingMode" AS ENUM ('system', 'manual', 'hybrid');

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "grading_mode" "GradingMode" NOT NULL DEFAULT 'system',
ADD COLUMN     "manual_max_score" DOUBLE PRECISION,
ADD COLUMN     "show_breakdown" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "is_manual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "section_type" TEXT;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "is_exempted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_missed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "manual_section_score" DOUBLE PRECISION,
ADD COLUMN     "system_section_score" DOUBLE PRECISION;
