-- Global teachable subjects: "subject X can be taught by educator E" applies to
-- every school year automatically. Identity is the normalized subject key
-- (see backend subject-key.util.ts), not a subject id, because subjects are
-- recreated per year.
--
-- New table EducatorTeachableSubject holds one row per (org, educator, key).
-- EducatorSubject stays as the per-year section/slot picks table, created
-- when picks are saved. ON DELETE CASCADE on educator: removing an account
-- removes its global links (they are configuration, not history).
--
-- Backfill: one global row per distinct key referenced by existing
-- EducatorSubject rows. The key expression mirrors JS `norm`
-- (trim + lowercase) via LOWER(REGEXP_REPLACE(x, '^\s+|\s+$', '', 'g')),
-- and program-type resolution mirrors subjectsInYear (direct program, else
-- the level/course/strand parent's program). Subjects with no program
-- lineage are skipped exactly like the read side skips them. Ids are
-- deterministic md5(org + educator + key) so the backfill is rerunnable;
-- ON CONFLICT keeps it idempotent regardless.

CREATE TABLE "EducatorTeachableSubject" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "educator_id" TEXT NOT NULL,
    "subject_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "program_type" TEXT NOT NULL DEFAULT '',
    "level_name" TEXT NOT NULL DEFAULT '',
    "course_name" TEXT NOT NULL DEFAULT '',
    "strand_name" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EducatorTeachableSubject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EducatorTeachableSubject_org_id_educator_id_subject_key_key"
  ON "EducatorTeachableSubject"("org_id", "educator_id", "subject_key");
CREATE INDEX "EducatorTeachableSubject_org_id_educator_id_idx"
  ON "EducatorTeachableSubject"("org_id", "educator_id");

ALTER TABLE "EducatorTeachableSubject" ADD CONSTRAINT "EducatorTeachableSubject_educator_id_fkey"
  FOREIGN KEY ("educator_id") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

WITH subject_ctx AS (
  SELECT
    s."id" AS subject_id,
    s."org_id" AS org_id,
    s."name" AS subject_name,
    COALESCE(pd."type", pl."type", pc."type", ps."type") AS ptype,
    COALESCE(l."name", '') AS lname,
    COALESCE(c."name", '') AS cname,
    COALESCE(st."name", '') AS stname
  FROM "Subject" s
  LEFT JOIN "Program" pd ON pd."id" = s."program_id"
  LEFT JOIN "Level" l ON l."id" = s."level_id"
  LEFT JOIN "Course" c ON c."id" = s."course_id"
  LEFT JOIN "Strand" st ON st."id" = s."strand_id"
  LEFT JOIN "Program" pl ON pl."id" = l."program_id"
  LEFT JOIN "Program" pc ON pc."id" = c."program_id"
  LEFT JOIN "Program" ps ON ps."id" = st."program_id"
  WHERE s."deleted_at" IS NULL
),
keyed AS (
  SELECT
    es."org_id" AS org_id,
    es."educator_id" AS educator_id,
    (
      LOWER(REGEXP_REPLACE(COALESCE(sc."subject_name", ''), '^\s+|\s+$', '', 'g')) || '|' ||
      LOWER(REGEXP_REPLACE(COALESCE(sc."ptype", ''), '^\s+|\s+$', '', 'g')) || '|' ||
      LOWER(REGEXP_REPLACE(COALESCE(sc."lname", ''), '^\s+|\s+$', '', 'g')) || '|' ||
      LOWER(REGEXP_REPLACE(COALESCE(sc."cname", ''), '^\s+|\s+$', '', 'g')) || '|' ||
      LOWER(REGEXP_REPLACE(COALESCE(sc."stname", ''), '^\s+|\s+$', '', 'g'))
    ) AS subject_key,
    sc."subject_name" AS display_name,
    COALESCE(sc."ptype", '') AS program_type,
    sc."lname" AS level_name,
    sc."cname" AS course_name,
    sc."stname" AS strand_name
  FROM "EducatorSubject" es
  JOIN subject_ctx sc
    ON sc."subject_id" = es."subject_id"
    AND sc."org_id" = es."org_id"
  WHERE sc."ptype" IS NOT NULL
)
INSERT INTO "EducatorTeachableSubject"
  ("id", "org_id", "educator_id", "subject_key", "display_name",
   "program_type", "level_name", "course_name", "strand_name", "created_at")
SELECT DISTINCT
  md5("org_id" || '|' || "educator_id" || '|' || "subject_key"),
  "org_id",
  "educator_id",
  "subject_key",
  "display_name",
  "program_type",
  "level_name",
  "course_name",
  "strand_name",
  CURRENT_TIMESTAMP
FROM keyed
ON CONFLICT ("org_id", "educator_id", "subject_key") DO NOTHING;
