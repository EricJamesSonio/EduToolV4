# Phase 3 Status Report — Student Section Reassignment

## Investigation findings (done first, before writing code)
`frontend/src/components/admin/school-years/program-view/AssignSectionDialog.tsx` calls `useUpdateProgramEnrollment` → `PATCH /school-years/:schoolYearId/enrollments/programs/:programEnrollmentId` → `StudentEnrollmentService.updateProgramEnrollment()`. That existing endpoint already mutates `StudentProgramEnrollment.section_id`, **but with zero validation** — it did not check the target section's org, level/course/strand match, or capacity. So an equivalent reassignment endpoint **already exists**, and this phase is **validation hardening on the existing endpoint** (the phase doc's explicit fallback path), not new code.

## What changed
- `backend/src/modules/student-enrollment/student-enrollment.service.ts` — hardened `updateProgramEnrollment()`: when `dto.section_id` is provided (and differs from the current section):
  1. Resolves the target section via `SectionService.findById()` (throws NotFound if missing or wrong org)
  2. Rejects with `BadRequestException` if `level_id` differs from the enrollment's, or (when the enrollment has them set) `course_id`/`strand_id` don't match
  3. Rejects with `ConflictException` ("Section "X" is full (n/capacity).") when `countStudentsInSection >= capacity`
  4. Updates `section_id` and logs `student_section_reassigned` with `{ fromSectionId, toSectionId, studentId }`
  - Non-section updates (level/course/strand changes) keep the old `enrollment_updated` audit path unchanged.
- `backend/src/modules/student-enrollment/student-enrollment.repository.ts` — `findProgramEnrollmentById` now also selects `studentSchoolYear.student_id` (needed for the audit metadata; additive include, no schema change).
- `backend/src/modules/student-enrollment/student-enrollment.module.ts` — imports `SectionModule` to inject `SectionService`.

Note on the route: kept the existing `PATCH .../programs/:programEnrollmentId` endpoint rather than adding a second one — the phase doc's routing guidance is "match existing conventions," and the existing endpoint *is* the StudentProgramEnrollment mutation surface that the frontend already uses. `UpdateProgramEnrollmentDto` already accepts `section_id` (nullable via `@IsOptional`), so no new DTO/controller route was needed.

## Verification
- `npx tsc --noEmit` in backend/: output unchanged at 96 lines vs. the pre-existing baseline (zero new errors; no matches under `student-enrollment/`).
- `prettier --write` applied to the three changed files (implicit formatting of pre-existing lines in the service, which was not prettier-clean before; formatting-only).
- `npm run lint` remains blocked by the same pre-existing missing `typescript-eslint` package.

## Deviations / notes
- Minor: `SectionService.findById` already throws `NotFoundException` for missing sections, so I omitted a redundant null-check (would have been unreachable). The capacity compare uses the "already at capacity → full" rule for `==` (equivalently `<` for allowed) per acceptance check.