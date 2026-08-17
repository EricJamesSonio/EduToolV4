# Late-Enrollment Grading Exclusion — Phase 1: Schema

Do not start this phase until Phase 0's investigation report has been
reviewed and explicitly confirmed. If Phase 0 found that the join path
between `Enrollment`/`StudentProgramEnrollment` and grading assumed in this
prompt does not actually exist in the codebase, stop and flag the mismatch
instead of proceeding.

## Goal

Add a table that lets an educator override the default late-enrollment
exclusion rule for a specific `(assessment, student)` pair. Presence of a row
with `include = true` means: count this assessment for this student even
though it predates their enrollment. Absence of a row means: use the default
rule computed in Phase 2 (exclude if late).

## Schema change

Add to `backend/prisma/schema.prisma`:

```prisma
model AssessmentGradingOverride {
  id            String   @id @default(uuid())
  org_id        String
  assessment_id String
  student_id    String
  include       Boolean  @default(true)
  reason        String?
  created_by    String
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  assessment Assessment @relation(fields: [assessment_id], references: [id], onDelete: Cascade)

  @@unique([assessment_id, student_id])
}
```

Add the inverse relation to the existing `Assessment` model:

```prisma
gradingOverrides AssessmentGradingOverride[]
```

Do not rename or restructure any existing field on `Assessment`,
`Submission`, `Enrollment`, or `StudentProgramEnrollment` in this phase.
This phase is additive only.

## Migration

- Generate the migration with the project's existing Prisma workflow (check
  `prisma/commands.md` for the exact command already in use — do not assume
  `prisma migrate dev` flags that aren't confirmed there).
- Name the migration `add_assessment_grading_override`.
- After generating, open the resulting `migration.sql` and confirm it only
  contains a `CREATE TABLE` + the unique index + the foreign key. If it
  contains any `DROP` or `ALTER` on unrelated tables, stop and report before
  applying it.

## Verification (required before reporting done)

1. Run `npx prisma generate` and confirm the client builds without type
   errors.
2. Run `npx prisma migrate deploy` (or the project's equivalent) against a
   test/dev database and confirm the table exists via `\d
"AssessmentGradingOverride"` or Prisma Studio.
3. Confirm `org_id` scoping is present — every query against this table in
   later phases must filter by `org_id`, consistent with every other model
   in this schema. Note this constraint for Phase 2/3 authors.

## Guardrails

- Max 2 retries on a failing migration, each retry using a different
  approach (e.g. check for a stale shadow database vs a naming collision)
  before stopping and reporting the exact error.
- Do not touch any other pending/unapplied migrations.
- End with: **"Phase 1 complete. Migration applied and verified. Ready for
  Phase 2 confirmation."**
