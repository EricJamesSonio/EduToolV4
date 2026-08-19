# Phase 0 — Investigation

No code changes in this phase. Output is a written findings report the human reviews
before Phase 1 starts.

## Goal

Confirm or correct every architectural assumption made in `overview.md` against actual
source, so schema and service design in later phases isn't built on guesses.

## Files/areas to read and report on

### School Year

- `backend/src/modules/school-year/school-year.repository.ts`,
  `school-year.service.ts`, `school-year.controller.ts`, `dto/school-year.dto.ts`
- Every frontend call site of `useSchoolYears` (grep `frontend/src/hooks/admin/useSchoolYears.ts`
  and its usages) — confirm the full list of places that would leak a blueprint row if
  not filtered.
- `frontend/src/components/shared/SchoolYearSelector.tsx` — confirm it accepts a
  controlled `selectedId`/`onSelect` and whether it supports being pre-locked to one
  option (needed for config mode to force-select the blueprint).

### Program / Course / Strand / Level / Section / Subject creation flow

- `frontend/src/app/admin/programs/page.tsx` and `[id]/page.tsx` (or equivalent detail
  route) — confirm Course/Strand/Level/Section creation all live inside program detail,
  as described.
- `backend/src/modules/program/*`, `course/*` (if separate), `level/*`, `section/*`,
  `subject/*` — confirm service/repository shapes for cloning later.

### Grading Scale assignment

- Already confirmed: `GradingScaleAssignmentSection.tsx` uses
  `gradingScaleApi.assignToProgram(programId, scaleId, schoolYearId)` and
  `removeAssignment`, scoped per school year via `SchoolYearSelector`. Confirm the
  backend `grading-scale-assignment.repository.ts` shape and uniqueness constraint
  (`@@unique([program_id, school_year_id])` already known from schema).

### Semester Template assignment

- `frontend/src/components/admin/semester-settings/AssignmentSection.tsx`,
  `AssignRow.tsx`, `use-assign-row.ts`, `use-program-calendar-query.ts` — confirm whether
  assignment is also scoped per-program via a school-year-aware selector the same way
  grading scale is. Confirm `ProgramSemesterAssignment` creation flow and how
  `ProgramSemesterTermDate` gets populated (resolved dates) — config only needs the
  `template_id` reference, not resolved dates, since dates are re-resolved at generation
  time for the new year.

### Grading Scheme step (navigation-only in this build)

- Confirm `/admin/grading-schemes/page.tsx` works standalone without requiring a
  school-year context, so it can sit in the step sequence as a pure navigation stop with
  no readiness gating tied to school year data.

### Readiness logic

- Search for any existing "School Year Readiness" implementation
  (mentioned as planned/on-the-horizon in prior work — confirm if any scaffolding
  already exists, e.g. `ReadinessDialog.tsx` in educator grades, or elsewhere). Report
  whether this needs to be built fresh in Phase 3 or extended from something partial.

### Org-level settings

- `backend/src/modules/org-enrollment-setting/*` or `organization/*` — confirm best
  existing location to add a single org-scoped `tutorial_mode_enabled` boolean, or
  whether a new minimal table/field is cleaner.

## Deliverable

A findings report (markdown, inline in the response) covering:

1. Confirmed/corrected file paths and shapes for everything above.
2. Any assumption from `overview.md` that turned out to be wrong, with the correction.
3. Explicit go/no-go on the "zero new UI for Grading Scale + Semester Template steps"
   assumption.
4. Recommended location for the org-level tutorial toggle.

Do not proceed to Phase 1 until this report is reviewed.
