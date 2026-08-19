# Phase 4 — Promotion Service ("Save Configuration")

## Step 0 — Investigate

Re-confirm final `SchoolConfig*` schema from Phase 1 as actually migrated (not just
planned) before writing the mapping logic. Re-read the real
Program/Course/Strand/Level/Section/Subject repository methods to confirm exact field
names for the copy.

## Step 1 — Promotion service

```ts
// backend/src/modules/school-config/school-config-promotion.service.ts
async function promoteBlueprintToConfig(orgId: string): Promise<void>;
```

Inside a single `$transaction`:

1. Resolve the org's blueprint `SchoolYear` (must exist — error if not, since promotion
   without ever entering config mode is not a valid state).
2. Delete all existing `SchoolConfig*` rows for the org (wipe, per rule 5).
3. Walk the blueprint's real `Program → Course/Strand → Level → Section → Subject` tree
   and insert corresponding `SchoolConfig*` rows, preserving hierarchy via new FKs (not
   reusing the real UUIDs — config rows get their own ids).
4. Walk the blueprint's `GradingScaleAssignment` rows (scoped to the blueprint's
   `school_year_id`) and insert `SchoolConfigGradingScaleAssignment` rows referencing the
   matching new `SchoolConfigDepartment` id and the **existing** `grading_scale_id`
   (never cloned, rule 6).
5. Same for `ProgramSemesterAssignment` → `SchoolConfigSemesterTemplateAssignment`,
   referencing the existing `template_id`.
6. Use bulk/atomic inserts (`createMany` or equivalent), not per-row loops with
   individual awaits, following the Item 5 precedent (`bulkCreate` via `$transaction`).

## Step 2 — "Save Configuration" wiring

- Explicit action, not auto-save (confirmed earlier: partial configs are fine and
  expected, but the save is a deliberate action, e.g. a button in the floating widget or
  on the school-years empty-state screen — confirm exact placement with the user before
  building, since this wasn't pinned down precisely).
- On success, toast confirmation. The blueprint itself is untouched — it remains the
  live editing surface for next time (rule 4).

## Step 3 — "Delete preset and start fresh" action

- Separate, explicitly confirmed destructive action (distinct from any exit modal).
- Deletes all `SchoolConfig*` rows for the org AND the blueprint's real child data
  (Program/Course/Strand/Level/Section/Subject/assignments under the blueprint
  `school_year_id`) — but does not delete the blueprint `SchoolYear` row itself, since a
  fresh blueprint is needed to configure again. Confirm this in a transaction; confirm
  cascade deletes are correct given the real models' relations (check `onDelete` behavior
  on Program/Course/etc. — these aren't currently cascade-configured in the shared
  schema, so explicit ordered deletes may be required instead of relying on Postgres
  cascade).

## Verification

- Save a partial config (department + subjects only, no grading scale/semester
  template assigned). Confirm `SchoolConfig*` rows reflect exactly that partial state,
  no errors.
- Save again after adding more structure. Confirm old `SchoolConfig*` rows are fully
  replaced, not duplicated or left stale.
- Run "delete and start fresh". Confirm blueprint's real child rows are gone, blueprint
  `SchoolYear` row still exists, and re-entering config mode starts genuinely empty.
- Run full backend test suite.

Stop and report before Phase 5.
