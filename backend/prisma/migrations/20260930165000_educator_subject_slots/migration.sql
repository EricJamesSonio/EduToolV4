-- Slot-count assignments: which weekly positions (slot 1..N of the subject's
-- sessions-per-week) an educator handles per section.
--
-- Rows predating this column keep section_ids only and read as whole-pair
-- claims (all positions), so nothing silently unassigns. New writes always
-- maintain section_ids as the set of sections with at least one slot pick.
ALTER TABLE "EducatorSubject" ADD COLUMN "section_slots" JSONB NOT NULL DEFAULT '[]';
