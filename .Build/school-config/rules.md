# Rules — School Configuration Preset Build

These apply across every phase. Agents must treat these as hard constraints, not
suggestions.

## 1. Investigate before building

No phase writes schema, service, or component code before reading the actual current
source of every file it touches or depends on. Never guess a method signature, DTO
shape, component prop, or query key. If a phaseN.md references a file, the agent opens
it first.

## 2. Zero new CRUD UI for structural steps

Department, Course/Strand, Level, Section, Subject, Grading Scale, Semester Template
creation must go through the **existing, unmodified** admin pages/components. Config
mode is a shell layered on top (route gating, floating note, Done/Skip button) — it
never forks or duplicates a page. If a step appears to need new UI, stop and flag it
instead of building a parallel form.

## 3. Blueprint is a real row, not a special case

The blueprint `SchoolYear` must behave exactly like a real school year to every existing
page, hook, and API route it touches. The only special handling allowed is:

- A single boolean/enum flag (`is_config_draft`) on `SchoolYear`.
- One filter, in one place — the school-year repository method(s) backing list/dropdown
  queries — excluding drafts by default.
  No other file should need an `if (isBlueprint)` branch. If one seems necessary, the
  design is wrong; escalate instead of patching around it.

## 4. One draft per org, never deleted implicitly

Upsert semantics only. "Continue configuring" always reopens the same blueprint
`SchoolYear` row, scoped via the existing `SchoolYearSelector`, always starting at
Department (no `currentStep` persistence needed). Deleting the draft is only ever an
explicit, separate, confirmed action — never a side effect of exiting or saving.

## 5. Promotion is wipe-and-rewrite, in a transaction

`SchoolConfig*` tables represent the _last saved_ state of the blueprint. Every "Save
Configuration" clears and rewrites all `SchoolConfig*` rows for the org from the
blueprint's current real data, atomically. No partial writes, no orphaned rows from a
previous save.

## 6. Generation never duplicates global entities

`GradingScale`, `GradingSchemeTemplate`, and `SemesterTemplate` are org-global and are
never cloned. Config only ever stores **references** to these (their real IDs) via the
copied `GradingScaleAssignment`/`ProgramSemesterAssignment` shape. Generation creates new
assignment rows pointing at existing global entities — it must never create a new
GradingScale/SemesterTemplate row as a side effect of applying a preset.

## 7. Back navigation is pure navigation

Within a step's own page (e.g., Program detail), back/forward behaves exactly as it does
outside config mode. It never deletes or rolls back previously created data. The step
shell does not implement its own "back one step" control — the step sequence only moves
forward via Done/Skip.

## 8. Readiness logic is shared, not duplicated

The Done-vs-Skip determination and note text reuse the same per-level readiness checks
as School Year Readiness (department exists → course/strand-or-level exists → section
exists → subject exists), minus the Class-level checks, which are out of scope for
config. This must be one shared function/service called from both features, not two
copies that can drift.

## 9. Generation does not imply readiness

A school year generated from a preset is not automatically marked "ready." Readiness
still requires the Class-level checks that config intentionally does not cover. Never
short-circuit or bypass the real readiness computation because a preset was applied.

## 10. Tutorial toggle is org-scoped

The "turn off tutorial mode" setting is a single org-level flag. It only hides the
floating note text. It never affects route gating, Done/Skip logic, or step order —
those remain identical with tutorial mode on or off.

## 11. Real CLI output is verification

As with Lane 1: no fix, migration, or service is considered done until it has been run
and produced actual output. Agent self-assessment does not count as proof.

## 12. Scope discipline

Do not touch Academic Calendar, Class generation, Grading Scheme rule logic, or the
School Profile overview page in this build. If a phase seems to require touching one of
these, stop and flag it rather than expanding scope.

## 13. Reuse over duplication

Before adding a new table, service method, or component, check whether an existing one
(readiness logic, `SchoolYearSelector`, `GradingScaleAssignmentSection`,
`ProgramSemesterAssignment` flow, org-seeder patterns) already covers it.

## 14. Dead code is a trap

Any method that becomes unused after a phase (e.g., an old direct-creation path bypassed
by config mode) must be flagged for removal, not left in place where it could be
accidentally called and reintroduce inconsistent state.
