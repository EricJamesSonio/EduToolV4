# Phase 5 — Generation Service (Apply Preset to New School Year)

## Step 0 — Investigate

Re-read `school-year.service.ts` create flow and `CreateSchoolYearDialog.tsx` to confirm
the exact current creation contract (fields, validation, response shape) before adding a
"use preset" branch to it.

## Step 1 — Generation service

```ts
// backend/src/modules/school-config/school-config-generation.service.ts
async function generateFromConfig(
  orgId: string,
  newSchoolYearId: string,
): Promise<void>;
```

Inside a single `$transaction`:

1. Load all `SchoolConfig*` rows for the org. If none exist, no-op (creation proceeds as
   a normal empty school year — this must not error).
2. Create real `Program` rows for each `SchoolConfigDepartment`, under
   `newSchoolYearId`.
3. Create real `Course`/`Strand` rows for each `SchoolConfigCourse`/`SchoolConfigStrand`,
   mapped to the newly created Program ids.
4. Create real `Level` rows, mapped to new Program/Course/Strand ids.
5. Create real `Section` rows, mapped to new Level ids.
6. Create real `Subject` rows, mapped to new Level ids.
7. Create real `GradingScaleAssignment` rows: for each
   `SchoolConfigGradingScaleAssignment`, insert
   `{ program_id: <new program id>, school_year_id: newSchoolYearId, grading_scale_id }`
   — referencing the existing global `GradingScale`, never creating one.
8. Create real `ProgramSemesterAssignment` rows similarly, referencing the existing
   `SemesterTemplate`. Confirm from Phase 0 findings whether term dates
   (`ProgramSemesterTermDate`) need to be resolved at this point or left for the admin to
   set afterward via the existing semester-settings flow — do not silently skip a
   required step if the real assignment flow expects dates immediately.
9. Use bulk inserts with explicit id-mapping (old `SchoolConfig*` id → new real id),
   built incrementally level by level since children need parent's newly generated id —
   this cannot be a single flat `createMany` across all levels; structure the transaction
   as ordered batches (departments, then courses/strands, then levels, then
   sections+subjects, then assignments), each batch a bulk insert.

## Step 2 — Wire into School Year creation

- Add a "Use configuration preset" toggle to `CreateSchoolYearDialog.tsx`, visible only
  if a saved `SchoolConfig*` exists for the org (hide/disable if empty — no dangling
  toggle for orgs with no config saved yet).
- On submit with the toggle on: create the real `SchoolYear` row first (existing flow,
  unmodified), then call `generateFromConfig` with its id.
- On submit with the toggle off, or no config exists: existing empty-creation flow,
  completely unchanged.

## Step 3 — Readiness after generation

- Confirm (per rule 9) that no code path marks the new school year "ready" as a result of
  generation. If a readiness computation runs automatically on creation, confirm it
  correctly reports "not ready" due to missing Class-level data, and that this is
  expected/correct, not a bug.

## Verification

- Generate a new year from a config with 2 departments, mixed course/strand structure,
  grading scale assignments, semester template assignments. Confirm every real row
  exists with correct FKs, and nothing was duplicated (especially the global
  GradingScale/SemesterTemplate rows — confirm exactly one of each still exists after
  generation, not a second copy).
- Generate a second year from the same config. Confirm the first year's rows are
  untouched and the second year gets its own independent set.
- Create a school year with the toggle off. Confirm behavior is identical to current
  production behavior (zero regression).
- Run full backend test suite, plus any relevant Playwright e2e flows touching school
  year creation.

Stop and report before Phase 6.
