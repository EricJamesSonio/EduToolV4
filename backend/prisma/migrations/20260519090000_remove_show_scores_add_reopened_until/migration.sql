-- Drop show_scores_immediately column
ALTER TABLE "Assessment" DROP COLUMN "show_scores_immediately";

-- Add reopened_until to Submission
ALTER TABLE "Submission" ADD COLUMN "reopened_until" TIMESTAMP(3);
