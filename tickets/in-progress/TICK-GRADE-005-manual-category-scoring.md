# TICK-GRADE-005 — Direct manual scoring for Behavior/Participation/Performance/Attendance

Status: in-progress
Priority: high
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Worktree: ../EduToolV4-worktrees/TICK-GRADE-005-manual-category-scoring
Branch: agent/TICK-GRADE-005-manual-category-scoring

## Problem

Educator-scored categories cannot be entered on the Grades page. The educator
should click the Behavior cell and type the score directly, capped at the
category maximum — not create a manual *assessment* first.

Most of the plumbing already exists and is unwired:

- `ManualCell.tsx` — click-to-edit cell, Enter/blur commit, Esc cancel, lock guard
- `grades/page.tsx:59-80` `handleManualCommit` → `gradeApi.setManualScore`
- `grade.controller.ts:64` `PATCH :termId/students/:studentId/manual`
- `grade.service.ts:228-269` upsert to `ManualScore` + audit log + lock check
- `grade-core.service.ts:113,218` manual score feeds the weighted grade

**Bug 1 — manual columns can never bootstrap (this is the reported symptom).**
`DefaultGradeTable.tsx:57-69` derives editable columns from categories that
*already have a score*:

```ts
s.categoryBreakdown.filter(c => c.manualScore !== null).map(c => c.category)
```

A category only becomes an editable column once a score exists — but a score can
only be entered once the column exists. Chicken-and-egg, so the Behavior column
renders a static `—` forever. Quizzes/Activities/Exams are unaffected because
they derive from `allAssessments` (actual assessment rows), not from scores.

**Bug 2 — manual routing keys off a type that is never stored.**
`category.type === 'manual'` is the only thing routing a manual score into the
grade (`grade-core.service.ts:113,218`; `grade.service.ts:406,458`;
`grade-educator.service.ts:1038`; `grade-student.service.ts:116`;
`export.service.ts:69,253`). Schemes store Behavior as `type='behavior'`, never
`'manual'`, so even a saved Behavior score is ignored by the grade engine — it
looks for assessments of `type='behavior'` instead and finds none.

`'manual'` is also a phantom type: absent from the canonical 14-value enum,
rejected by `@IsEnum` in `grading-scheme.dto.ts:29` and
`grading-scheme-template.dto.ts:24`, and
`components/admin/data-seeder/constants/grading-schemes.ts:20-75` hardcodes
`type: 'manual'` for Participation/Behavior — rows that cannot be saved through
the API. `FOLLOW_UPS.md:28-40` flags the decision as open and says not to resolve
it inline; this ticket resolves it deliberately by **deriving** manual-scored
from the type set rather than by adding `'manual'` back.

## Goal

1. Expose the category `type` on `CategoryBreakdown`.
2. Derive editable manual columns from the **grading scheme**, not from existing
   scores, so the column appears immediately and empty.
3. Route behavior / participation / performance_task / attendance as
   manual-scored categories, reusing TICK-ASSESS-005's `MANUAL_ONLY_TYPES`.
4. Surface a per-category maximum (header + input clamp) so the educator knows
   the cap. Max = `max_score` when set, else the category weight (Behavior 20%
   → "/20").
5. Regression tests on `computeWeightedScore` / `buildCategoryBreakdown` before
   any routing change.

## Relevant Areas


## Confidence

- Score: 84/100 (Requirement clarity 21, Codebase verification 20,
  Architecture fit 18, Edge cases 12, Blast radius 13)
- **Critical-risk override applied** (authoritative grade math): would cap at 79
  until a regression test on the scoring functions is green.
- Gaps + assumptions chosen (user did not answer the clarifying questions;
  proceeding on the recommended options, all disclosed here):
  1. **Max derivation** — `max_score` when set, else the category weight
     (Behavior 20% → "/20"). Alternative (always 0-100) was rejected because it
     gives the educator no real cap, which was the explicit ask.
  2. **These types are removed from the assessment wizard entirely** — they
     become grade columns only, not manually-graded assessments.
  3. **Ticket split** — kept separate from TICK-ASSESS-005 (ASSESS domain) since
     this changes grade computation and deserves its own review.
  4. **Unverified against a live UI** — Bug 1 is read from source; the
     chicken-and-egg reasoning is static, not reproduced in a browser.
- Note: `origin/development` advanced to 4e11beaa after TICK-ASSESS-005's
  worktree was cut; that branch must be rebased before review.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

- 2026-09-30: Claimed, counter GRADE=4 → 5. Worktree from fresh
  `origin/development` (4e11beaa), outside the repo.
- 2026-09-30: Confidence 84/100 as above. Proceeding on the recommended
  interpretations for the three unanswered questions, each disclosed in the
  Confidence section so the reviewer can correct a wrong assumption.

## Commits

- (pending)

## Notes

- Pairs with TICK-ASSESS-005: that ticket makes these types manual-only in the
  wizard; this one gives them a first-class home on the Grades page.

- shared/skills/database/MUST-HAVES.md §Grading invariants
- shared/rules/confidence-gating.md (critical-risk: authoritative grade math)
- shared/skills/backend/MUST-HAVES.md, shared/skills/frontend/MUST-HAVES.md
- shared/skills/testing/MUST-HAVES.md
- backend/src/modules/grade/{core/grade-core.service.ts, grade.service.ts,
  educator/grade-educator.service.ts, student/grade-student.service.ts}
- backend/src/modules/grading-scheme/constants/assessment-type.constants.ts
- frontend/src/components/educator/grades/{DefaultGradeTable,ManualCell}.tsx

## Acceptance Criteria

- [ ] Behavior/Participation/Performance/Attendance columns appear on the Grades
      page with no prior score and no prior assessment
- [ ] Clicking the cell edits inline and persists to `ManualScore`
- [ ] The saved score feeds the weighted grade for that category
- [ ] Column header shows the max; input is clamped to it
- [ ] Assessment columns (Quiz/Exam/…) keep their existing behavior
- [ ] Regression tests on computeWeightedScore + buildCategoryBreakdown green
- [ ] `manualCats` no longer depends on `manualScore !== null`
