-- Teachable-subject section assignments: which sections an educator handles
-- per subject, so the generator knows where to place each class.
--
-- Safe default: every existing link starts with no sections assigned, which
-- preserves current generator behavior until an admin assigns sections.
ALTER TABLE "EducatorSubject" ADD COLUMN "section_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
