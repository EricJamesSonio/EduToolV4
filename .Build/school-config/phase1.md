# Phase 1 — Schema + Blueprint Infrastructure

## Step 0 — Investigate

Re-confirm exact current `SchoolYear` model fields and every repository method that
lists/queries school years (from Phase 0 findings) before editing.

## Step 1 — Prisma schema additions

### 1a. Blueprint flag

Add to `SchoolYear`:

```prisma
is_config_draft Boolean @default(false)
```

Add a partial-unique-safe constraint ensuring at most one draft per org. Prisma doesn't
support partial unique indexes natively for Postgres in a simple way without raw SQL —
use a raw migration `CREATE UNIQUE INDEX ... WHERE is_config_draft = true` on
`(org_id)` after the Prisma migration, or enforce it purely at the service layer
(get-or-create, never plain create) if the agent judges the raw index unnecessary given
service-layer enforcement. Document the choice either way.

### 1b. SchoolConfig\* tables (year-scoped structure)

Mirror the real models' shape closely enough that promotion/generation mapping is
mechanical, not clever:

```prisma
model SchoolConfigDepartment {
  id       String  @id @default(uuid())
  org_id   String
  name     String
  type     String
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  courses   SchoolConfigCourse[]
  strands   SchoolConfigStrand[]
  levels    SchoolConfigLevel[]
  gradingScaleAssignments    SchoolConfigGradingScaleAssignment[]
  semesterTemplateAssignment SchoolConfigSemesterTemplateAssignment?
}

model SchoolConfigCourse {
  id            String @id @default(uuid())
  org_id        String
  department_id String
  name          String
  code          String?

  department SchoolConfigDepartment @relation(fields: [department_id], references: [id], onDelete: Cascade)
  levels     SchoolConfigLevel[]
}

model SchoolConfigStrand {
  id            String @id @default(uuid())
  org_id        String
  department_id String
  name          String

  department SchoolConfigDepartment @relation(fields: [department_id], references: [id], onDelete: Cascade)
  levels     SchoolConfigLevel[]
}

model SchoolConfigLevel {
  id            String  @id @default(uuid())
  org_id        String
  department_id String
  course_id     String?
  strand_id     String?
  name          String

  department SchoolConfigDepartment @relation(fields: [department_id], references: [id], onDelete: Cascade)
  course     SchoolConfigCourse?    @relation(fields: [course_id], references: [id], onDelete: Cascade)
  strand     SchoolConfigStrand?    @relation(fields: [strand_id], references: [id], onDelete: Cascade)
  sections   SchoolConfigSection[]
  subjects   SchoolConfigSubject[]
}

model SchoolConfigSection {
  id       String @id @default(uuid())
  org_id   String
  level_id String
  name     String
  capacity Int

  level SchoolConfigLevel @relation(fields: [level_id], references: [id], onDelete: Cascade)
}

model SchoolConfigSubject {
  id           String  @id @default(uuid())
  org_id       String
  level_id     String
  name         String
  subject_type String  @default("major")

  level SchoolConfigLevel @relation(fields: [level_id], references: [id], onDelete: Cascade)
}
```

### 1c. Global-entity reference tables (assignment rules only — no cloning)

```prisma
model SchoolConfigGradingScaleAssignment {
  id               String @id @default(uuid())
  org_id           String
  department_id    String
  grading_scale_id String

  department SchoolConfigDepartment @relation(fields: [department_id], references: [id], onDelete: Cascade)

  @@unique([department_id])
}

model SchoolConfigSemesterTemplateAssignment {
  id                    String @id @default(uuid())
  org_id                String
  department_id         String @unique
  semester_template_id  String

  department SchoolConfigDepartment @relation(fields: [department_id], references: [id], onDelete: Cascade)
}
```

Do not add a foreign key to `GradingScale`/`SemesterTemplate` if it complicates cascade
behavior on unrelated deletes — a plain `grading_scale_id`/`semester_template_id` string
reference, validated at write time, is acceptable and matches the "reference, don't
clone" principle. Confirm against Phase 0 findings which is cleaner.

**Adjust all of the above based on Phase 0's actual findings** — this is a starting
shape, not gospel, especially around whether Course and Strand should be one table with
a discriminator instead of two (check how the real `Course`/`Strand` models are treated
in existing shared components before deciding).

## Step 2 — Backend: blueprint get-or-create

- `POST /admin/school-config/blueprint` (or similar) — upserts the single draft
  `SchoolYear` for the calling admin's org. Returns its id.
- `GET /admin/school-config/blueprint` — returns existing draft if present, else null.
- Repository method backing the normal school-year list/dropdown queries updated to
  filter `is_config_draft: false` by default. This must be the _only_ place filtering
  happens (rule 3).

## Step 3 — Frontend: entry point wiring

- On `/admin/school-years/page.tsx`, when the school year list is empty, render a
  "Configure School Structure" entry point that calls the blueprint get-or-create
  endpoint, then redirects into config mode starting at the Department step
  (`/admin/programs`) with the blueprint's id passed so `SchoolYearSelector` can be
  pre-locked to it.
- Confirm (per Phase 0 findings) how `SchoolYearSelector` needs to be extended, if at
  all, to support being force-selected/locked — this should be a prop addition, not a
  fork of the component.

## Verification

- Manually create a blueprint, confirm it does NOT appear in: class creation year
  dropdown, enrollment year selector, semester settings selector, dashboard. Confirm it
  DOES appear when explicitly requested by the config flow.
- Run full backend test suite; confirm no existing school-year tests break.

Stop and report before Phase 2.
