# Phase 3 — Program Shift Module

**Mode:** Start in Plan Mode. Build Mode only after Eric approves.

**Depends on:** Phase 2 merged, AND Phase 0's open decision (status-flip on shift) resolved and confirmed by Eric. Do not start planning this phase if that decision is still open — go back and close it first.

## Goal

New module implementing the shift workflow: end the old program enrollment, create the new one, bulk-set outcomes on the old program's classes, and record the event for permanent history.

## Files to read before planning

- `backend/src/modules/student-enrollment/student-enrollment.service.ts` (`updateProgramEnrollment` — reuse its section/level/course/strand validation logic, don't duplicate it)
- `backend/src/modules/enrollment/enrollment-eligibility.util.ts` (`resolveSubjectAcademicStructure` — needed to resolve which classes belong to the "old" program)
- `backend/src/modules/school-year/school-year-readiness.service.ts` (`assertReady` — reuse, don't duplicate)
- `backend/src/modules/org-enrollment-setting/org-enrollment-setting.service.ts` (read `default_shift_outcome`)
- `backend/src/modules/audit-log/audit-log.service.ts`
- An existing module of similar shape to model file layout on — e.g. `backend/src/modules/student-enrollment/` (module/controller/service/repository/dto split)
- Whatever test convention `student-enrollment` or `enrollment` uses (mocked unit spec vs. real-DB e2e spec under `test/`) — this repo's convention is "no Prisma/service mocking, real database writes only" per project standards; confirm which layer (unit vs e2e) that applies at before writing tests

## New files (plan, confirm paths before creating)

- `backend/src/modules/program-shift/program-shift.module.ts`
- `backend/src/modules/program-shift/program-shift.repository.ts`
- `backend/src/modules/program-shift/program-shift.service.ts`
- `backend/src/modules/program-shift/program-shift.controller.ts`
- `backend/src/modules/program-shift/dto/program-shift.dto.ts`
- `backend/src/modules/program-shift/__TEST__/program-shift.service.spec.ts` (or `test/program-shift.e2e-spec.ts` — per convention check above)

## Core method

`shiftProgram(orgId, studentSchoolYearId, actorId, dto)`

`dto = { toProgramId, levelId?, courseId?, strandId?, sectionId?, perClassOutcomeOverrides?: { enrollmentId, outcome, reason? }[] }`

All inside one `db.$transaction`:

1. Load the student's current active `StudentProgramEnrollment` for this `studentSchoolYearId`. 404 if none found.
2. `readinessService.assertReady(orgId, schoolYearId)`.
3. End the current row: `status: 'ended'`, `end_reason: 'shifted'`, `ended_at`, `ended_by: actorId`.
4. Create the new `StudentProgramEnrollment` row (active) with the new program/level/course/strand/section from dto — reuse validation logic from `updateProgramEnrollment` (extract to a shared private method or util if not already reusable as-is).
5. Create the `ProgramShiftEvent` row linking old → new enrollment ids, `default_outcome_used: org.default_shift_outcome`.
6. Resolve all currently-active `Enrollment` rows for this student whose class's subject traces back to the OLD program (via `resolveSubjectAcademicStructure`). For each: apply `perClassOutcomeOverrides` if provided for that enrollment id, else the org default; set `outcome_set_at`, `outcome_set_by`, `shift_event_id`; apply the status-flip decision resolved in Phase 0 exactly as agreed — don't reinterpret it here.
7. Audit log the shift (`action: 'program_shift'`, metadata: from/to program ids, affected class count).

## DTO validation

`toProgramId`: required, must validate as existing program UUID. `perClassOutcomeOverrides`: optional array; each `outcome` must be a valid `ClassEnrollmentOutcome` via `@IsEnum`.

## Ambiguity to flag if found

If resolving "which classes belong to the old program" is not a clean filter — e.g. a class's subject is shared across multiple programs via `SubjectSharing` — this is a Stop Condition, not something to resolve unilaterally. Report concrete examples (using actual data if available) before deciding a resolution rule. State confidence on any proposed rule; if <90%, ask Eric.

## Build Mode verification

- Unit/e2e tests: happy-path shift; shift with a per-class override; shift blocked when school year not ready; shift blocked when student has no active program enrollment; shift-back into the original program within the same school year succeeds (proves the Phase 1 partial unique index actually works end-to-end); old classes behave correctly in roster/capacity queries per whichever status-flip decision was made (assert the actual agreed behavior, not a guess).
- All gates from `02-rules-buildmode.md`.

## Exit criteria

- All planned tests pass with real output.
- Eric reviews and approves before Phase 4 begins (Phase 4 can technically start in parallel against Phase 1–2 data alone if Eric wants to unblock it, but the outcome/shift-event data won't be meaningful until this phase lands — flag that trade-off if asked).
