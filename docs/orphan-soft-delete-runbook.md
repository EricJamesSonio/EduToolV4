# Orphan health check + soft-delete runbook (Level / Strand / Course)

Context for the change that added `deleted_at` to `Level`, `Strand` and `Course`
(migration `20260928113559_add_deleted_at_to_level_strand_course`).

## Why this exists

`Level.course_id` / `Level.strand_id` / `Section.course_id` / `Section.strand_id`
are **optional** relations. Prisma's default referential action for optional
relations is `SetNull`, so hard-deleting a course or strand used to silently set
`course_id = NULL` on its levels and sections instead of failing. That is how
"orphaned" levels appeared (e.g. a college program with levels but no course).
The migration now pins those four FKs to `ON DELETE RESTRICT`, so the database
can no longer produce that shape.

## What the delete endpoints do now

Rule: **nothing connected → hard delete; has data → soft delete and hide
everywhere.**

| Endpoint | Empty (no data) | Has data |
| --- | --- | --- |
| `DELETE /courses/:id` | rows removed (levels + sections first) → `"deleted"` | course + its levels + its live sections stamped `deleted_at` → `"archived"` |
| `DELETE /strands/:id` | same → `"deleted"` | same → `"archived"` |
| `DELETE /levels/:id` | sections + level removed → `"deleted"` | level + its live sections stamped → `"archived"` |

"Data" = enrollments, enrollment applications, classes (including archived
ones — they still hold FKs), subjects, subject sharings. Subjects are never
wiped, so a level/course/strand with subjects is archived, not deleted.
Re-deleting an already-archived row returns `"archived"` (idempotent, no 404).
Archived rows are filtered out of every org-level list, readiness check, parent
lookup and scope resolver (`deleted_at: null`).

## Run the orphan health check on EVERY environment

**After deploying this migration, and then on a schedule (cron/CI), on every
environment — local, staging and production.**

```bash
cd backend
npm run check:orphans
```

Exit codes: `0` = clean, `1` = inconsistencies found, `2` = the check itself
failed. It **reports only** — it never repairs, because repairing rows is a
deliberate human/data decision.

It detects: live college level without a course, live SHS level without a
strand, live level whose course/strand is archived, live section under an
archived level, live section whose course/strand is archived. Rows already
nulled by past hard deletes are **not** fixed by the migration — this check is
how you find them. To repair a found row, re-attach it to the correct
course/strand (or archive it) after confirming which parent it belonged to.

## Re-seeding an archived row

Seeders upsert by deterministic seed ID, so they always *find* an archived row
instead of creating a duplicate. Re-seeding therefore **un-archives** it
(`deleted_at → NULL`) via `src/commons/utils/seed-restore.ts`: a restored entity
must never stay hidden, and a re-run must never duplicate rows. Counters report
a restored row as `seeded` (it is live again), not `already_exists`.

## Known limitation

`Program.hasLevels/hasCourses/hasStrands` deliberately count archived children
too, because an archived child still holds an FK to the program — a live-only
count would let `program.delete` hit a DB-level FK restrict error. Consequence:
a program that ever had a child archived cannot be hard-deleted until a
purge/restore path exists (follow-up).
