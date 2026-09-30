# TICK-GRADE-005 — Direct manual scoring for Behavior/Participation/Performance/Attendance

Branch: `agent/TICK-GRADE-005-manual-category-scoring`
Commit: `f6fa683e`
Base: `4e11beaa` (current `origin/development` at branch time)

## What the educator asked for

Behavior / Participation / Performance should be scored by the educator typing a
score **directly into the Grades page cell**, capped at the category maximum —
not by creating a manual *assessment* first. Most of this already existed and was
simply unwired. The wiring gap turned out to be **two** bugs.

## Bug 1 — manual columns could never bootstrap (the reported symptom)

`DefaultGradeTable.tsx` derived editable columns from categories that *already
had a score*:

```ts
s.categoryBreakdown.filter(c => c.manualScore !== null).map(c => c.category)
```

A score can only be entered once the column exists, and the column only existed
once a score did — so Behavior rendered as a permanent, un-editable `—`.
`CleanGradeTable.tsx` had the same bug via
`type !== 'manual' || manualScore != null` (not in the original ticket body; also
fixed). Both now derive columns from the grading scheme and use the backend's new
`isManualScored` flag.

## Bug 2 — manual routing keyed off a type that is never stored

`category.type === 'manual'` was the **only** thing routing a manual score into
the grade, in 7 places across `grade-core.service.ts`, `grade.service.ts`,
`grade-educator.service.ts`, `grade-student.service.ts` and `export.service.ts`.
Schemes persist Behavior as `type='behavior'`, so a saved Behavior score was
ignored by the grade engine — it looked for assessments of `type='behavior'`,
found none, and **silently dropped the category weight from the average**.

`isManualScoredCategory()` now derives the manual set from the canonical
`MANUAL_ONLY_TYPES` and still honors the legacy `'manual'` literal, so existing
rows and the frontend data-seeder keep working.

## The cap

`manualCategoryMax()` = scheme `max_score` when set, else the category weight
(Behavior at 20% shows as `Behavior /20`). Enforced twice:
- `ManualCell` clamps and **stays open** with an inline `Maximum is 20.` so the
  educator can correct it (UX)
- `resolveManualScoreInput()` on the server rejects over-cap scores, unknown
  categories, and assessment-derived categories (authority — CORE.md Part 1). It
  also prevents orphan `ManualScore` rows, which are matched by name and would
  otherwise be silently ignored forever.

The grades page toast now surfaces the server's reason instead of a generic
"try again".

## Validation

- backend targeted: `src/modules/grade` 12 suites / 92 tests green — the 6
  pre-existing grade specs unchanged, plus 20 new cases in
  `manual-category-scoring.spec.ts`
- backend full: 87 suites / 914 tests, failure set **identical to the development
  baseline**, 0 new (9 pre-existing)
- frontend full: 18 suites / 176 tests green (+9 new `ManualCell` cases)
- backend `tsc` 20 pre-existing errors, **none in touched files**; frontend `tsc`
  0; eslint clean

## Reviewer notes

- **Duplicate-constant conflict expected** with TICK-ASSESS-005 in
  `assessment-type.constants.ts` (both branches declare
  `SYSTEM_GRADABLE_TYPES` / `MANUAL_ONLY_TYPES`). Byte-identical, both derived
  from the enum — resolve by deleting one copy during the rebase.
- Not verified in a running browser. The bootstrap bug was diagnosed statically
  from the source; worth a manual click-through of the Grades page.
- Two of the new tests failed first on wrong assumptions about the service
  signature and one hand-computed expectation (70, not 80). The tests were
  corrected, not the code.
- A bulk PowerShell rewrite corrupted encoding in 4 backend files mid-task; it
  was reverted with `git checkout` and reapplied via the editor, and every
  touched file was verified BOM-free and mojibake-free before commit.

## Confidence: 84/100 (disclosed assumptions)

The user did not answer three clarifying questions; the recommended options were
used and are recorded in the ticket:
1. Max = `max_score`, else category weight. (Alternative — always 0-100 — was
   rejected because it gives the educator no real cap, which was the ask.)
2. These types are removed from the assessment wizard entirely (TICK-ASSESS-005
   does that half).
3. Kept as its own ticket because it changes authoritative grade math.
