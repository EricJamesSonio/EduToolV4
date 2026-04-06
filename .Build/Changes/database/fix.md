1. Section → ADD school_year_id

Problem:
- Only tied via Level
- Causes cross-year data leakage

Fix:
model Section {
  id              String    @id @default(uuid())
  org_id          String
  level_id        String
  school_year_id  String
  name            String
  capacity        Int
  deleted_at      DateTime?

  level       Level       @relation(fields: [level_id], references: [id])
  schoolYear  SchoolYear  @relation(fields: [school_year_id], references: [id])
}


2. Class → MAKE school_year_id REQUIRED

Current:
school_year_id String?

Problem:
- Allows null values
- Can create classes not tied to any school year

Fix:
school_year_id String


3. GradingScheme → ADD school_year_id (recommended)

Reason:
- Grading rules can change per school year
- Prevents reuse across different years

Fix:
model GradingScheme {
  id              String    @id @default(uuid())
  org_id          String
  educator_id     String?
  class_id        String?
  school_year_id  String
  name            String
  is_default      Boolean   @default(false)
  is_locked       Boolean   @default(false)
  locked_at       DateTime?
  created_at      DateTime  @default(now())

  schoolYear      SchoolYear @relation(fields: [school_year_id], references: [id])
  class           Class?     @relation(fields: [class_id], references: [id])
  components      GradingSchemeComponent[]
}


4. Subject → KEEP AS-IS

Reason:
- Already scoped via Level → SchoolYear
- No need to duplicate school_year_id