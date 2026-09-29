# Handoff — TICK-ASSESS-004: grading-scheme category name auto-fill

Status: ready-for-review
Branch: agent/TICK-ASSESS-004-grading-scheme-name-autofill (base: development `c34af581`)
Commit: `60eb7e58` — 6 files, +189/−12, **frontend only**
Worktree: ../EduToolV4-worktrees/TICK-ASSESS-004-grading-scheme-name-autofill

## What changed

- `admin/grading-scheme/GradingSchemeComponentRow.tsx` — exported `labelForType(type)` (canonical label); private `isAutoName(name)` (true when Name is empty or still exactly a canonical label, case-insensitive). The Type `<Select>` now emits `type` and, when Name is untouched, `name`. Name input gained `aria-label="Category name"` (its visible `<label>` has no `htmlFor`, so it was unlabeled for assistive tech) and its placeholder now reuses `labelForType`.
- Seeding across all 4 editors (7 sites): admin `GradingSchemeEditor.makeDefaultRows()` + `.handleAdd`, `ClassGradingSchemeEditor.DEFAULT_ROW`, `NewTemplateDialog.DEFAULT_ROW`, shared `TemplateFormDialog.makeDefaultRows()` + `.handleAdd`.
- New spec `admin/grading-scheme/__tests__/GradingSchemeComponentRow.test.tsx` (6 tests, RTL + `user-event`; the Radix pointer/`ResizeObserver` jsdom polyfills live **inside the spec**, not in `jest.setup.ts`, so other tests are unaffected).

## Behaviour

- Pick `behavior` → Name becomes `Behavior`; new rows arrive pre-filled (`Quiz`, `Written Work`, …).
- Hand-rename to `Homework Points` → later type changes never touch it.
- A Name that still equals a canonical label counts as auto → re-fillable.
- Field stays editable, so `custom`/`other` keep working. Backend untouched: `name` is `MinLength(1)/MaxLength(100)` with no uniqueness constraint, so auto-filled duplicates are safe.

## Validation (worktree, 60eb7e58)

- targeted spec **6/6**; `fe-jest` **12 suites / 108 tests green** (development baseline 11 / 102); `fe-lint` **0 errors** (1 pre-existing warning in `SemesterFormDialog.tsx`); `fe-tsc` **17 errors, byte-identical to baseline, 0 new**, none in touched files (one new error I caused in the spec's ResizeObserver guard was caught and fixed).
- No backend file touched → CI's `paths-filter` skips backend jobs and `ci-gate` accepts that as expected.

## Verify by hand

1. `npm run dev` (frontend) → Educator → class → grading scheme (editor with **Import from Library**).
2. **Add Category** → Name already shows the default type's label.
3. Flip the Type dropdown → Name follows. Type a custom name → flip again → it stays.

## Out of scope (flagged, not fixed)

- The class/template dialog editors still append a *fixed* type (`written_work` / `quiz`) instead of the first unused one, so two rows can share a type and therefore a name. Harmless (no backend uniqueness) and pre-existing; the admin and shared-template editors already pick the first unused type.
