-- Clean up duplicate LessonConcept entries (keep only the latest per lesson_id)
DELETE FROM "LessonConcept" lc1 USING (
  SELECT lesson_id, MAX(created_at) as max_created
  FROM "LessonConcept"
  GROUP BY lesson_id
  HAVING COUNT(*) > 1
) dupes
WHERE lc1.lesson_id = dupes.lesson_id
  AND lc1.created_at < dupes.max_created;

-- Clean up orphaned LessonConcept entries (no matching Lesson)
DELETE FROM "LessonConcept" lc
WHERE NOT EXISTS (SELECT 1 FROM "Lesson" l WHERE l.id = lc.lesson_id);

-- Add unique constraint on lesson_id
ALTER TABLE "LessonConcept" ADD CONSTRAINT "LessonConcept_lesson_id_key" UNIQUE ("lesson_id");

-- Add foreign key constraint
ALTER TABLE "LessonConcept" ADD CONSTRAINT "LessonConcept_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
