-- AlterTable: add `order` column to `Question`
ALTER TABLE "Question" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Backfill: set order based on creation order (id as fallback)
UPDATE "Question" SET "order" = subquery.seq FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS seq FROM "Question"
) AS subquery WHERE "Question".id = subquery.id;
