-- Refactor Guide: replace page_path with slug
-- Refactor GuideStep: rename text to content

-- Drop old unique constraint on (portal, page_path)
DROP INDEX IF EXISTS "Guide_portal_page_path_key";

-- Remove page_path column, add slug column with unique constraint
ALTER TABLE "Guide" DROP COLUMN "page_path";
ALTER TABLE "Guide" ADD COLUMN "slug" TEXT NOT NULL;
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

-- Rename text to content in GuideStep
ALTER TABLE "GuideStep" RENAME COLUMN "text" TO "content";
