# TICK-ASSESS-004 — Grading-scheme category name auto-derived from type

Status: in-progress
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

- [ ] Picking a type writes its label into Name (test-proven)
- [ ] Re-selecting a type updates Name only when untouched; hand-typed text preserved
- [ ] Rows created by "Add Category" arrive pre-filled (all 4 editors)
- [ ] Name input remains editable
- [ ] fe-jest green (baseline 11 suites/102 tests + new spec), fe-lint 0 errors, fe-tsc adds no new errors (baseline 17 pre-existing)

## Confidence

- Score: 95/100. Requirement explicit, UI-only; all 4 call sites verified; backend `GradingSchemeComponentDto.name` is `MinLength(1)/MaxLength(100)` with **no uniqueness constraint** → duplicate auto-names are safe; no backend/schema/grading math touched.
- Gaps: the two dialog editors don't pass `usedTypes` on add, so two `quiz` rows can both read "Quiz" — harmless and pre-existing; out of scope.

## Tests

- New spec: `frontend/src/components/admin/grading-scheme/__tests__/GradingSchemeComponentRow.test.tsx` — (a) type select fills canonical label, (b) second type change re-fills while untouched, (c) hand-typed name survives a type change, (d) name input still editable.
- Validation: pending (filled in at ready-for-review).

## Blocker

None.

## Activity Log

- 2026-09-29: Claimed, counter ASSESS 3 → 4. TICK-ASSESS-004 confirmed free (no pending/in-progress collision).

## Commits

- (pending)

## Notes

- User decision (2026-09-29): Option 1 — auto-fill + follow while untouched, field stays editable.
- Out of scope: making the two dialog editors pick the first unused type on add (admin editor + shared template dialog already do that today).
