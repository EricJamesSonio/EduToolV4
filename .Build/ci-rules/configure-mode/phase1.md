# Phase 1 — Schema: School Profile Structural Tables

## Step 0 — Investigate

Confirm Phase 0's findings on predefined-data shape before finalizing field
names below — this is a starting shape, adjust to match reality.

## Step 1 — Prisma models (Category A only — Category B needs no new tables)

```prisma
model SchoolProfileDepartment {
  id         String   @id @default(uuid())
  org_id     String
  type       String   // matches Program.type — daycare/kinder/elementary/jhs/shs/college
  is_selected Boolean @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  courses  SchoolProfileCourse[]
  strands  SchoolProfileStrand[]
  levels   SchoolProfileLevel[]

  @@unique([org_id, type])
}

model SchoolProfileCourse {
  id            String @id @default(uuid())
  org_id        String
  department_id String
  code          String?
  name          String

  department SchoolProfileDepartment @relation(fields: [department_id], references: [id], onDelete: Cascade)
  levels     SchoolProfileLevel[]
}

model SchoolProfileStrand {
  id            String @id @default(uuid())
  org_id        String
  department_id String
  name          String

  department SchoolProfileDepartment @relation(fields: [department_id], references: [id], onDelete: Cascade)
  levels     SchoolProfileLevel[]
}

model SchoolProfileLevel {
  id            String  @id @default(uuid())
  org_id        String
  department_id String
  course_id     String?
  strand_id     String?
  name          String
  order_index   Int

  department SchoolProfileDepartment @relation(fields: [department_id], references: [id], onDelete: Cascade)
  course     SchoolProfileCourse?    @relation(fields: [course_id], references: [id], onDelete: Cascade)
  strand     SchoolProfileStrand?    @relation(fields: [strand_id], references: [id], onDelete: Cascade)
  sections   SchoolProfileSection[]
  subjects   SchoolProfileSubject[]
}

model SchoolProfileSection {
  id       String @id @default(uuid())
  org_id   String
  level_id String
  name     String
  capacity Int

  level SchoolProfileLevel @relation(fields: [level_id], references: [id], onDelete: Cascade)
}

model SchoolProfileSubject {
  id           String  @id @default(uuid())
  org_id       String
  level_id     String
  name         String
  subject_type String  @default("major")

  level SchoolProfileLevel @relation(fields: [level_id], references: [id], onDelete: Cascade)
}
```

Notes:

- `onDelete: Cascade` used deliberately here (unlike the real
  Program/Course/Level models, which intentionally avoid cascade) because
  this is genuinely ownership-scoped profile data with no cross-year
  integrity concerns — deleting a profile department should cleanly remove
  everything under it.
- `SchoolProfileDepartment.is_selected` may be redundant if a row's mere
  existence implies selection (deleting = deselecting). Decide in this
  phase whether "select" creates/deletes the row outright versus toggling a
  flag — simpler is to delete on deselect and recreate (re-seeding fresh
  from predefined data) on reselect, since Category A edits are meant to be
  freely re-derivable from the predefined library at selection time. If
  that's the chosen model, drop `is_selected` entirely and treat row
  existence as the source of truth.
- Adjust field names/types once Phase 0 confirms the actual predefined-data
  shape (e.g. if `Section` predefined data has fields beyond
  name/capacity).

## Step 2 — Migration

Generate and run the Prisma migration. Confirm `npx prisma migrate dev`
output directly — no assumption that it succeeded.

## Verification

- Confirm all six new models appear correctly in the generated Prisma
  client types.
- Confirm cascade deletes behave as expected with a manual test insert/delete
  before building any service logic on top.

Stop and report before Phase 2.
