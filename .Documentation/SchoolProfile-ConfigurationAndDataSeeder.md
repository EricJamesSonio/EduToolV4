# School Profile, Configuration Mode & Data Seeder — How They Connect

One page, two modes, one flow. **School Profile** is the persistent blueprint, **Configuration Mode** is the editor, **Data Seeder** is the executor that materializes that blueprint into a **School Year**.

**Where:** `frontend/src/app/admin/data-seeder/page.tsx:14` — toggle `Seed a School Year` | `Configure School Profile`. Backend: `backend/src/modules/school-profile/*` + `backend/src/modules/org-seeder/*`.

---

## 1. Concepts

| Concept | Scope | Stored in | Creates |
|---------|-------|-----------|---------|
| **School Profile** | Per **org** (reused across years) | `SchoolProfileDepartment / Course / Strand / Level / Section / Subject / SubjectSharing` (`backend/prisma/schema.prisma:165`) | Blueprint only — no real academic records |
| **Data Seeder** | Per **School Year** | `Program / Course / Strand / Level / Section / Subject / SubjectSharing / GradingScale / GradingSchemeTemplate / SemesterTemplate / ProgramCalendar` | Real records used by classes, enrollment, grading |

If no profile exists, the seeder falls back to hardcoded defaults (`backend/src/modules/org-seeder/data/*.data.ts` + `frontend/src/components/admin/data-seeder/constants/seed-data.ts`).

## 2. Data Model Difference

- **Profile tables** have `org_id + type` (`type` = `daycare | kinder | elementary | jhs | shs | college`, matches `Program.type`). They are **not** tied to a school year — one row per org per type (`@@unique([org_id,type])`).
- **Seeded tables** are all `org_id + school_year_id` — a fresh copy per year. IDs are deterministic via `seedId()` (e.g. `seedId('level', progKey, courseCode, levelName, syId, orgId)`) so re-seeding is idempotent.

Minor/subject sharing mirrors real structure: a college GE subject is one `SchoolProfileSubject` + N `SchoolProfileSubjectSharing` rows (one per course), same as `Subject` + `SubjectSharing`.

## 3. End-to-End Flow

```
[Configuration Mode] --POST /school-profile/save--> [SchoolProfile* tables]
        |
        v  GET /school-profile  -->  useSchoolProfile()  -->  useEffectiveSeedData()
        |
[Data Seeder Mode] --POST /org-seeder/seed (OrgSeedDto)--> OrgSeederService.seedOrg()
        |                                                        |
        |  1. getAllByType(orgId) -> SeedContext.profileDepartments
        |  2. programSeeder / courseSeeder / strandSeeder / levelSectionSeeder / major/minorSubjectSeeder / gradingScale/Scheme / semesterTemplate / programCalendar
        |     each does:  profile ? levelDefsFromProfile() : buildLevelDefs()  (see level-section-seeder.service.ts:24)
        v
[School Year Records]  (Program/Course/Strand/Level/Section/Subject ... for that SY)
```

**Frontend bridge:** `SeederCard.tsx:44` loads `useSchoolProfile()` and derives overrides via `useEffectiveSeedData.ts:14` — mapping profile departments to `collegeCourses`, `shsStrands`, `levelDefsByEntity`, `sectionsByLevelName`, `levelSubjectsByLevelName`, etc. Those overrides replace the constant defaults in the stepper UI. User selections then go into `OrgSeedDto` (`backend/src/modules/org-seeder/dto/org-seed.dto.ts:79`).

**Backend bridge:** `org-seeder.service.ts:53` — `getAllByType()` is copied into `SeedContext.profileDepartments` before any seeder runs. Every seeder checks that map first (e.g. `level-section-seeder.service.ts:24`).

## 4. Configuration Mode (Editor)

**Route:** `/admin/data-seeder` → **Configure School Profile** tab → `SchoolProfileCard.tsx`.

- **View vs Edit** — if a saved profile exists, defaults to `View`; `Edit` unlocks the draft. Guard prevents losing dirty edits (`useNavigationGuard` + `beforeunload`).
- **Departments** — toggle grid of program types. Selecting a type auto-populates pre-defined courses/strands/levels/sections/subjects.
- **Structure per department:**
  - `college` → Courses → Levels per course → Sections + Subjects per level
  - `shs` → Strands → Levels per strand → Sections + Subjects per level
  - others (`daycare/kinder/elementary/jhs`) → Levels → Sections + Subjects
- **Save** — `POST /school-profile/save` (`school-profile.service.ts:66`) **replaces** all departments for the submitted types in one transaction (deletes existing + recreates). Unselected types are untouched. Payload = `SaveSchoolProfileDto` (`school-profile.dto.ts:190`).

Detailed CRUD also exists (`POST/PATCH/DELETE /school-profile/departments/:type/select`, `/courses/:id`, `/strands/:id`, `/levels/:id`, `/sections/:id`, `/subjects/:id`) but the toggle's bulk-save is the primary flow.

## 5. Data Seeder (Executor)

**Route:** `/admin/data-seeder` → **Seed a School Year** tab → `SeederCard.tsx`.

**Steps (cards):**
1. **School Year** — pick existing or create new (must span the year).
2. **Departments** — pick which `type`s to seed. Disabled if already seeded for that SY.
3. **Levels / Sections / Strands / Courses / Subjects** — all values shown are `profile override ?? default constants`. Disabled options are already-seeded names.
4. **Grading Scale / Scheme / Academic Calendar / Semester Templates** — optional toggles.
5. **Summary → Apply Seed** — `POST /org-seeder/seed` with `OrgSeedOptions` (`seed-context.ts:56`: `programs, courses, strands, levelConfigs, sectionConfigs, gradingScales, seedGradingScales/Schemes/Templates/Calendars`).

**Idempotent:** Same `seedId()` → `already_exists` count; counts returned as `SeedResult` (`programs/courses/strands/levels/sections/subjects/...` with `seeded/already_exists/skipped + warnings`). Audited as `org_seeded` (`org-seeder.service.ts:110`).

> **Connection in one sentence:** Configure once per org (profile), seed many times per school year (data seeder); the seeder reads the profile as overrides so every new year inherits the school's structure without re-typing it.
