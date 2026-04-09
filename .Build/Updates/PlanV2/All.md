==============================================================
SCHEMA CHANGES (v1 → v2) — DIFF SUMMARY
==============================================================

CHANGED:
  Organization.email_extension → now @unique (was optional field)
  Profile → added personal_email String? (NEW FIELD)
  SchoolYear → removed gradingSchemes relation (GradingScheme no longer has school_year_id)
  GradingScheme → now scoped by class_id (required), added template_id (optional trace)
                 removed school_year_id, educator_id, is_default

NEW MODELS:
  GradingSchemeTemplate
  GradingSchemeTemplateComponent

REMOVED FIELDS:
  GradingScheme.school_year_id
  GradingScheme.educator_id
  GradingScheme.is_default

==============================================================
FEATURES TO IMPLEMENT (from improvement docs)
==============================================================

1. Email extension uniqueness (emailextensions.md)
2. Personal email for notifications (feaeture.email.md)
3. Grading Scheme refactor → class-scoped + templates (grading-scheme.md)
4. Semester template fix → scope by actual program not type (semester-settings.md)
5. Subject page fixes → remove educator assignment, require course/strand (subject.page.md)
6. Dashboard → active school year only (dashboard.md)
7. Classes page → remove school year filter, use global selector (class.page.md)
8. School year → manual "End School Year" + auto unenroll (school-year.enrollement.md)
9. Grading scale → 1 per program enforcement (grading-scale.md)
10. Org seeder → idempotent seeding (org.md)

==============================================================
MIGRATION
==============================================================

RUN:
  npx prisma migrate dev --name "v2_grading_scheme_refactor_personal_email_email_extension_unique"

This covers:
  - Organization.email_extension @unique
  - Profile.personal_email added
  - GradingSchemeTemplate + GradingSchemeTemplateComponent (new tables)
  - GradingScheme restructured (class_id required, school_year_id removed, template_id added)

==============================================================
BACKEND — FILES TO UPDATE
==============================================================

--- grading-scheme module (MAJOR REFACTOR) ---

UPDATE: src/modules/grading-scheme/grading-scheme.repository.ts
  - Remove school_year_id from all queries
  - Add template_id support
  - Scope all queries by class_id
  - Add methods: findByClassId, applyTemplateToClasses (bulk)

UPDATE: src/modules/grading-scheme/grading-scheme.service.ts
  - Remove school year scoping logic
  - Add: applyTemplateToProgram(programId, templateId) → bulk apply per class
  - Add: applyTemplateToClass(classId, templateId)
  - Remove: is_default, educator_id handling

UPDATE: src/modules/grading-scheme/grading-scheme.controller.ts
  - Remove school_year_id param from endpoints
  - Add POST /grading-schemes/apply-to-program
  - Add POST /grading-schemes/apply-to-class/:classId

UPDATE: src/modules/grading-scheme/dto/grading-scheme.dto.ts
  - Remove: school_year_id, educator_id, is_default
  - Add: template_id (optional), class_id (required for create)
  - Add: ApplyToProgramDto { program_id, template_id }

UPDATE: src/modules/grading-scheme/entity/grading-scheme.entity.ts
  - Reflect new schema shape

--- NEW: grading-scheme-template module ---

CREATE: src/modules/grading-scheme-template/
  grading-scheme-template.module.ts
  grading-scheme-template.controller.ts
  grading-scheme-template.service.ts
  grading-scheme-template.repository.ts
  dto/grading-scheme-template.dto.ts
  entity/grading-scheme-template.entity.ts

ENDPOINTS:
  GET    /grading-scheme-templates            (list by org, optional program_type filter)
  POST   /grading-scheme-templates            (create template + components)
  GET    /grading-scheme-templates/:id        (get with components)
  PATCH  /grading-scheme-templates/:id        (update)
  DELETE /grading-scheme-templates/:id        (soft or hard delete)

ADD TO: src/domains/academic/academic-domain.module.ts
  - Import GradingSchemeTemplateModule

--- profile / personal email ---

UPDATE: src/modules/auth/auth.service.ts (or wherever profile is updated)
  - Add update personal_email logic (separate endpoint, user-controlled)

UPDATE: src/modules/student/student.service.ts
  - Include personal_email in profile queries/updates

UPDATE: src/modules/educator/educator.service.ts
  - Include personal_email in profile queries/updates

CREATE: src/modules/profile/ (if not exists, otherwise update)
  - PATCH /profile/personal-email  → update own personal_email
  - Validate: valid email format, optional

--- organization email extension uniqueness ---

UPDATE: src/modules/organization/organization.service.ts
  - Catch P2002 unique constraint on email_extension
  - Throw ConflictException with clear message

UPDATE: src/modules/organization/dto/organization.dto.ts
  - Add @IsEmail() or custom domain validator for email_extension

--- semester template fix ---

UPDATE: src/modules/semester-template/semester-template.repository.ts
  - Remove program_type filtering
  - Fetch programs directly from school year relation
  - Return actual Program[] not type-filtered list

UPDATE: src/modules/semester-template/semester-template.service.ts
  - assignToProgram: accept program_id (actual program), not program_type
  - Fix mismatch bug: use school_year → programs relation

UPDATE: src/modules/semester-template/dto/semester-template.dto.ts
  - Change: program_type String → program_id String (for assignment)

--- subject module ---

UPDATE: src/modules/subject/subject.service.ts
  - Remove educator_id from createSubject logic
  - For major subjects: require course_id OR strand_id (based on program type)
  - For minor subjects: require level_id

UPDATE: src/modules/subject/dto/subject.dto.ts
  - Remove educator_id from CreateSubjectDto
  - Add conditional validation: major → course_id/strand_id required

UPDATE: src/modules/subject/subject.controller.ts
  - Remove any educator assignment endpoints tied to subject

--- school year: manual end + auto unenroll ---

UPDATE: src/modules/school-year/school-year.service.ts
  - Add: endSchoolYear(id, orgId) method
    → set status = 'ended'
    → unenroll all active students (StudentSchoolYear.status = 'unenrolled')
    → set unenrolled_at = now()

UPDATE: src/modules/school-year/school-year.controller.ts
  - Add: POST /school-years/:id/end

UPDATE: src/core/scheduler/scheduler.tasks.ts
  - Keep existing auto-unenroll on end_date reached
  - Ensure it sets unenrolled_at and status correctly

--- grading scale: 1 per program enforcement ---

UPDATE: src/modules/grading-scale/grading-scale.service.ts
  - Before create: check if grading scale already exists for (org_id, school_year_id, level_id/program scope)
  - Throw ConflictException if duplicate

UPDATE: src/modules/grading-scale/grading-scale.repository.ts
  - Add: findBySchoolYearAndProgram(orgId, schoolYearId, levelId)

--- dashboard: active school year only ---

UPDATE: src/modules/analytics/analytics.service.ts
  - All queries: filter by school years where status = 'active'
  - Remove any cross-year aggregation

UPDATE: src/modules/analytics/analytics.repository.ts
  - Add: getActiveSchoolYear(orgId)
  - Scope all analytics queries to active year

--- org seeder: idempotent ---

UPDATE: src/modules/org-seeder/org-seeder.service.ts
  - Before inserting: check existence per (school_year_id, program, type)
  - Return status per item: 'seeded' | 'already_exists' | 'skipped'
  - Never duplicate sections or subjects

==============================================================
BACKEND — NEW MODULE REGISTRATIONS
==============================================================

UPDATE: src/domains/academic/academic-domain.module.ts
  - Add GradingSchemeTemplateModule

==============================================================
FRONTEND — FILES TO UPDATE
==============================================================

--- types ---

UPDATE: src/types/admin/grading-scheme.types.ts
  - Remove: school_year_id, educator_id, is_default
  - Add: class_id, template_id
  - Add: GradingSchemeTemplate, GradingSchemeTemplateComponent types
  - Add: ApplyToProgramPayload type

UPDATE: src/types/admin/subject.types.ts
  - Remove: educator_id from subject create/edit types

UPDATE: src/types/admin/semester.types.ts
  - Update assignment type: program_type → program_id

CREATE: src/types/admin/grading-scheme-template.types.ts
  - GradingSchemeTemplate
  - GradingSchemeTemplateComponent
  - CreateGradingSchemeTemplateDto
  - ApplyTemplateToClassDto

--- API layer ---

UPDATE: src/api/admin/grading-scheme.api.ts
  - Remove school_year_id from params
  - Add: applyToProgram(payload: ApplyToProgramPayload)
  - Add: applyToClass(classId, templateId)
  - Update: getByClass(classId)

CREATE: src/api/admin/grading-scheme-template.api.ts
  - getAll(orgId, filters?)
  - getById(id)
  - create(payload)
  - update(id, payload)
  - delete(id)

UPDATE: src/api/admin/subject.api.ts
  - Remove educator assignment from create/update payload

UPDATE: src/api/admin/semester.api.ts  (or semester-template.api.ts if exists)
  - Update assignment to use program_id

CREATE: src/api/admin/profile.api.ts (if not exists)
  - updatePersonalEmail(email)

--- hooks ---

UPDATE: src/hooks/admin/useGradingSchemes.ts
  - Remove school_year_id dependency
  - Add: useApplyTemplateToProgram()
  - Add: useClassGradingScheme(classId)

CREATE: src/hooks/admin/useGradingSchemeTemplates.ts
  - CRUD hooks for templates
  - useApplyTemplate(classId | programId)

UPDATE: src/hooks/admin/useSchoolYear.ts
  - Add: endSchoolYear(id) mutation

UPDATE: src/hooks/admin/useSubject.ts
  - Remove educator_id from create hook payload

UPDATE: src/hooks/admin/useSemester.ts (or semester-template hook)
  - Fix: assignment now uses program_id not program_type

--- components ---

UPDATE: src/components/admin/grading-scheme/GradingSchemeEditor.tsx
  - Show template selector (from GradingSchemeTemplate list)
  - Add "Apply to Program" button → calls applyToProgram
  - Remove school year selector

UPDATE: src/components/admin/grading-scheme/GradingSchemeComponentRow.tsx
  - Minor: reflect new shape (no is_default, no educator)

CREATE: src/components/admin/grading-scheme/ApplyToProgramDialog.tsx
  - Select Program → Select Template → Confirm
  - Calls applyToProgram bulk endpoint

CREATE: src/components/admin/grading-scheme-template/
  GradingSchemeTemplateList.tsx
  GradingSchemeTemplateCard.tsx
  CreateTemplateDialog.tsx
  EditTemplateDialog.tsx

UPDATE: src/components/admin/subject/SubjectDialog.tsx
  - Remove educator assignment field
  - Add conditional: if major + college → require course_id
  - Add conditional: if major + shs → require strand_id
  - Add: level_id required for minor subjects
  - Add smart defaults from current filter context

UPDATE: src/components/admin/semester/SemesterFormDialog.tsx (or template dialog)
  - Fix program assignment: dropdown shows real programs from school year
  - Not filtered by program_type string

UPDATE: src/components/admin/class/ClassesFilterBar.tsx
  - REMOVE school year filter (use global selector)

CREATE: src/components/admin/organization/PersonalEmailCard.tsx
  - Optional personal email input for profile
  - Used in profile pages for educator/student

UPDATE: src/components/shared/ProfileContent.tsx
  - Add personal email field (optional, user-controlled)
  - Label clearly: "For external notifications only"

--- pages ---

UPDATE: src/app/admin/grading-schemes/page.tsx
  - Remove school year filter from local state
  - Use global school year selector
  - Add "Templates" section / tab

CREATE: src/app/admin/grading-scheme-templates/page.tsx
  - List all templates
  - Create/Edit/Delete

UPDATE: src/app/admin/classes/page.tsx
  - Remove local school year filter
  - Rely on global school year selector state

UPDATE: src/app/admin/subjects/page.tsx
  - Update create dialog to use new SubjectDialog (no educator)

UPDATE: src/app/admin/school-years/[id]/page.tsx
  - Add "End School Year" button (if status = active)
  - Confirm dialog before ending

UPDATE: src/app/admin/dashboard/page.tsx
  - Ensure analytics hooks only fetch active school year data

UPDATE: src/app/admin/profile/page.tsx
  - Add personal email field

UPDATE: src/app/educator/profile/page.tsx
  - Add personal email field

UPDATE: src/app/student/profile/page.tsx
  - Add personal email field

UPDATE: src/app/admin/semester-settings/page.tsx
  - Fix program selector to use real programs from school year

==============================================================
EXECUTION ORDER (recommended)
==============================================================

1. Run migration (prisma migrate dev)
2. Backend: GradingSchemeTemplate module (new)
3. Backend: GradingScheme refactor (class-scoped)
4. Backend: Profile personal_email endpoints
5. Backend: Organization email_extension conflict handling
6. Backend: Subject service/dto cleanup (remove educator)
7. Backend: Semester template fix (program_id)
8. Backend: School year endSchoolYear()
9. Backend: Grading scale 1-per-program validation
10. Backend: Analytics scope to active year
11. Backend: Org seeder idempotent
12. Frontend: Types update (grading-scheme, subject, semester)
13. Frontend: New grading-scheme-template types + API
14. Frontend: Hooks update
15. Frontend: Component updates (SubjectDialog, ClassesFilterBar, GradingSchemeEditor)
16. Frontend: New components (ApplyToProgramDialog, GradingSchemeTemplateList, PersonalEmailCard)
17. Frontend: Pages update (grading-schemes, classes, subjects, school-year detail, dashboard, profiles)
18. Frontend: New page (grading-scheme-templates)