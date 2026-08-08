# Phase 3 — Backend: Student Section Reassignment

## Goal
A single, reusable backend action to move a student to a different section — used by both the existing admin `AssignSectionDialog.tsx` flow and the new registrar-facing entry points in Phase 5.

## First step: search before building

`components/admin/school-years/program-view/AssignSectionDialog.tsx` already exists in the frontend, implying a section-assignment capability already exists somewhere in the backend (likely in `student-enrollment.service.ts`, `student-enrollment.repository.ts`, or `section.service.ts`). **Do not write a new endpoint until you've confirmed whether one already exists.** If it exists, this phase is just validation hardening on the existing one. If it doesn't (e.g. `AssignSectionDialog` only handles *initial* section assignment during enrollment, not *reassignment* of an already-enrolled student), build it fresh per the spec below.

## Endpoint spec

`PATCH /student-enrollment/:enrollmentId/section` (or wherever `StudentProgramEnrollment` mutations already live — match existing routing conventions in `student-enrollment.controller.ts`)

**Body:** `{ sectionId: string }`

**Validation, in order:**
1. Enrollment record exists, belongs to `orgId` from the authenticated user
2. Target section exists, belongs to same `orgId`
3. Target section's `level_id` matches the enrollment's `level_id` — and if the enrollment has `course_id`/`strand_id` set, the target section's `course_id`/`strand_id` must match too
4. `countStudentsInSection(targetSectionId) < targetSection.capacity` — reject with `ConflictException` if full
5. Update `StudentProgramEnrollment.section_id`
6. Log via `AuditLogService.logAdminAction()` — action: `student_section_reassigned`, metadata: `{ fromSectionId, toSectionId, studentId }`

## Acceptance check
- Move a student to a section with a different `level_id` → rejected
- Move a student to a full section → rejected with clear message
- Move a student to a valid, non-full section with matching level/course/strand → succeeds, audit-logged

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Domain model: StudentProgramEnrollment
has level_id, course_id (nullable), strand_id (nullable), section_id (nullable).
Section has level_id, course_id (nullable), strand_id (nullable), capacity.

Step 1 — investigate first:
Search the codebase (particularly backend/src/modules/student-enrollment/ and
backend/src/modules/section/) for any existing logic that reassigns a
StudentProgramEnrollment's section_id after initial enrollment. Also check what
backend endpoint backs frontend/src/components/admin/school-years/program-view/AssignSectionDialog.tsx
(check its corresponding API call in frontend/src/api/admin/student-enrollment.api.ts
or section.api.ts). Report back what you find before writing any new code.

Step 2 — build or harden:
If no reassignment endpoint exists, add one following the existing module's
conventions (controller → service → repository pattern, DTO with class-validator).
If one exists, add the validation below to it if missing.

Required validation, in this order:
1. Enrollment exists and belongs to the authenticated user's org_id
2. Target section exists and belongs to the same org_id
3. Target section's level_id (and course_id/strand_id, if the enrollment has them set)
   matches the enrollment's — reject with BadRequestException if not
4. Target section is not full: countStudentsInSection(sectionId) < section.capacity —
   reject with ConflictException if full, message should state current/capacity numbers
5. Update StudentProgramEnrollment.section_id
6. Log via the existing AuditLogService.logAdminAction() pattern used elsewhere in this
   codebase (see section.service.ts for the exact call shape) — action:
   'student_section_reassigned', include fromSectionId/toSectionId/studentId in metadata

Show me the diff before applying, and tell me explicitly whether this was new code
or a hardening of existing code.
```