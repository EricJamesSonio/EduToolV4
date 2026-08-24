# Phase 4 — Academic History Module (Admin-facing)

**Mode:** Start in Plan Mode. Build Mode only after Eric approves.

**Depends on:** Phase 3 merged for full data richness (shift events, outcomes). Can start against Phase 1–2 data alone if Eric explicitly wants to unblock it early — confirm which case applies before planning.

## Goal

A read-oriented service composing a student's complete academic history — across all school years, all program stints (including ended ones from shifts), all class enrollments (with outcome) — plus an admin-facing controller to query it for any student in the org.

## Files to read before planning

- `backend/src/modules/transcript/student/transcript-student.service.ts` (existing School Year → Semester → Class grouping logic — check for reuse potential before writing a second version of this tree-building code)
- `backend/src/modules/enrollment/enrollment.repository.ts` (`findByStudentAcrossOrg` — note it currently filters `status: 'active'` only; Academic History needs ALL statuses/outcomes, not just active)
- `backend/src/modules/student-enrollment/student-enrollment.repository.ts` (`findAllBySchoolYear` shape, for the include-tree pattern)
- `backend/src/modules/program-shift/program-shift.repository.ts` (once it exists from Phase 3 — to pull shift-event detail)
- Role guard pattern used for admin-only routes — check an existing admin controller (e.g. `student.controller.ts`) for the exact decorator/guard combo in use

## New files (plan, confirm paths before creating)

- `backend/src/modules/academic-history/academic-history.module.ts`
- `backend/src/modules/academic-history/academic-history.repository.ts`
- `backend/src/modules/academic-history/academic-history.service.ts`
- `backend/src/modules/academic-history/admin/academic-history-admin.controller.ts`
- `backend/src/modules/academic-history/dto/academic-history.dto.ts`
- `backend/src/modules/academic-history/__TEST__/academic-history.service.spec.ts`

## Core query shape

`getFullHistory(studentId, orgId)` returns:

- ALL `StudentSchoolYear` rows for the student (not just active) →
  - ALL `StudentProgramEnrollment` rows per school year, including ended ones, with `end_reason`/`ended_at`/linked shift-event detail →
    - That program-enrollment's associated `Enrollment` rows (with `outcome`), grouped by `Semester` → `Class` (subject, educator, grades)

Structure the response so a mid-year shift shows as two distinct program stints correctly nested under the same school year — don't flatten them into one.

## Reuse decision to make in planning

Check whether `transcript-student.service.ts`'s School Year → Semester → Class grouping logic (`groupTranscript` and friends) can be extracted into a shared helper both transcript and academic-history call, rather than writing a second implementation of the same tree-building shape. State confidence on whether this refactor is worth doing now vs. deferring — if <90%, ask Eric rather than deciding unilaterally, since it touches a module outside this phase's stated scope (transcript already exists and works; changing it is a scope question).

## Build Mode verification

- Test: student with 2 school years, one mid-year shift — confirm the tree shows both program stints correctly nested, with the ended stint's reason/date visible.
- Test: a class the student was never enrolled in (no `Enrollment` row at all) does not appear anywhere in the tree — this should fall out naturally from querying `Enrollment` rather than iterating all classes; verify explicitly rather than assuming it falls out correctly.
- Admin-only guard test: non-admin/non-registrar role gets 403 on this controller.
- All gates from `02-rules-buildmode.md`.

## Exit criteria

- All planned tests pass with real output.
- Eric reviews and approves before Phase 5 begins.
