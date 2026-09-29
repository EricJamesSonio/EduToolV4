# TICK-ASSESS-004 — Grading-scheme category name auto-derived from type

Status: ready-for-review
Priority: medium
Created: 2026-09-29
Created by: agent
Assigned to: agent
Started: 2026-09-29
Worktree: ../EduToolV4-worktrees/TICK-ASSESS-004-grading-scheme-name-autofill
Branch: agent/TICK-ASSESS-004-grading-scheme-name-autofill

## Problem

Every grading-scheme editor asks for a free-text Category `Name` beside the Type dropdown. Selecting `behavior` leaves Name blank (only a placeholder hints the label), so the user retypes "Behavior" — redundant. All 4 editors seed `name: ""` and none derives it from the selected type: `GradingSchemeEditor`, `ClassGradingSchemeEditor`, `NewTemplateDialog`, `TemplateFormDialog`, all rendering the shared `GradingSchemeComponentRow`.

## Goal

1. Selecting a type fills Name with that type's canonical label (`behavior` → "Behavior").
2. Name follows later type changes **while untouched** (empty, or still exactly a canonical label); a hand-typed name is never overwritten.
3. New rows arrive pre-filled with the label of the type they are created with (all 4 editors).
4. Name stays editable — `custom`/`other` need bespoke names ("Leadership", "Exam 2").
5. Rule lives in the shared row component (one source of truth), not duplicated per editor.

## Relevant Areas

- frontend/src/components/admin/grading-scheme/GradingSchemeComponentRow.tsx
- frontend/src/components/admin/grading-scheme/GradingSchemeEditor.tsx
- frontend/src/components/educator/grading-scheme/ClassGradingSchemeEditor.tsx
- frontend/src/components/educator/grading-scheme/NewTemplateDialog.tsx
- frontend/src/components/shared/grading-scheme/TemplateFormDialog.tsx
- shared/skills/frontend/MUST-HAVES.md (component conventions)

## Acceptance Criteria

- [x] Picking a type writes its label into Name (test-proven)
- [x] Re-selecting a type updates Name only when untouched; hand-typed text preserved
- [x] Rows created by "Add Category" arrive pre-filled (all 4 editors)
- [x] Name input remains editable
- [x] fe-jest green (baseline 11 suites/102 tests + new spec), fe-lint 0 errors, fe-tsc adds no new errors (baseline 17 pre-existing)

## Confidence

- Score: 95/100. Requirement explicit, UI-only; all 4 call sites verified; backend `GradingSchemeComponentDto.name` is `MinLength(1)/MaxLength(100)` with **no uniqueness constraint** → duplicate auto-names are safe; no backend/schema/grading math touched.
- Gaps: the two dialog editors don't pass `usedTypes` on add, so two `quiz` rows can both read "Quiz" — harmless and pre-existing; out of scope.

## Tests

- New spec (6/6 PASS): `frontend/src/components/admin/grading-scheme/__tests__/GradingSchemeComponentRow.test.tsx` — type select fills canonical label, second change re-fills while untouched, hand-typed name survives type change, label-matching name still re-fillable, name input editable, `labelForType` mapping.
- Validation on worktree branch 60eb7e58 (frontend only — no backend file touched, so CI skips backend jobs by design): fe-jest **12 suites / 108 tests all green** (baseline on development was 11 / 102 → +1 suite / +6 tests), fe-lint **0 errors** (single pre-existing warning in `SemesterFormDialog.tsx`, untouched), fe-tsc **17 errors — byte-identical to the 17-error baseline, 0 new, none in grading-scheme files** (the one new error I introduced in the spec's ResizeObserver guard was caught and fixed). Build deferred to CI (live dev servers own `.next`).
- Development integration: pending reviewer merge.

## Blocker

None.

## Activity Log

- 2026-09-29: Claimed, counter ASSESS 3 → 4. TICK-ASSESS-004 confirmed free (no pending/in-progress collision).
- 2026-09-29: Implemented in worktree off development c34af581. Shared row now auto-fills Name on type change while untouched (`labelForType` + `isAutoName`); 7 seeding sites across the 4 editors pre-fill the label; Name got an `aria-label` (its visible label had no `htmlFor`, so it was unlabeled for AT). New spec 6/6, lint 0 errors, tsc 17/17 parity (0 new), full frontend suite 12/108 green. Commit 60eb7e58. Ready for review.

## Commits

- 60eb7e58 feat(grading-scheme): auto-fill category name from selected type (TICK-ASSESS-004) (branch agent/TICK-ASSESS-004-grading-scheme-name-autofill)

## Notes

- User decision (2026-09-29): Option 1 — auto-fill + follow while untouched, field stays editable.
- Out of scope: making the two dialog editors pick the first unused type on add (admin editor + shared template dialog already do that today).
