# Phase 3 — Readiness-Based Step Gating

## Step 0 — Investigate

Confirm Phase 0's finding on whether any School Year Readiness logic already exists
(even partially). If nothing exists yet, this phase builds the shared function fresh,
scoped only to what config needs — the full readiness feature (with Class-level checks)
remains a separate future build, but the function signature must be designed so that
future feature can extend it rather than duplicate it.

## Step 1 — Shared readiness function

```ts
// backend/src/modules/school-year/school-year-readiness.util.ts (or shared location
// confirmed in Step 0)
interface ReadinessIssue {
  scope: "department" | "courseOrStrand" | "level" | "section" | "subject";
  entityName: string;
  message: string; // e.g. "BSCS doesn't have levels yet"
}

interface StructuralReadinessResult {
  isComplete: boolean;
  issues: ReadinessIssue[];
}

function checkStructuralReadiness(
  schoolYearId: string,
): Promise<StructuralReadinessResult>;
```

Checks, in order (matching the agreed hierarchy, Class-level checks excluded):

1. At least one Department (Program) exists.
2. Each Department that has Course/Strand children — each Course/Strand has at least one
   Level. Each Department with no Course/Strand — has at least one Level directly.
3. Each Level has at least one Section.
4. Each Level has at least one Subject.

This function is called by:

- The Department step's Done/Skip logic (checks the whole tree so far).
- The Subject step's Done/Skip logic (checks levels have subjects).
- Later, unmodified, by the real School Year Readiness feature — confirm the function
  doesn't assume it's only ever called against a blueprint.

## Step 2 — Per-step Done/Skip determination

Each step in the registry (Phase 2) gets a lightweight check function:

- **Department step**: "Done" if `checkStructuralReadiness` reports zero issues at the
  department/course-strand/level/section scopes; otherwise "Skip", with the issues
  surfaced as the note text (overriding the static tutorial note when there are
  incomplete items — tutorial-off mode should still show these, since they're
  actionable warnings, not tutorial copy — confirm this distinction with the user before
  building if ambiguous).
- **Subject step**: "Done" if every Level has ≥1 Subject; otherwise "Skip".
- **Grading Scale / Semester Template steps**: "Done" if every Department has an
  assignment (`GradingScaleAssignment` / `ProgramSemesterAssignment` respectively,
  scoped to the blueprint's `school_year_id`); otherwise "Skip".
- **Grading Scheme step**: navigation-only in this build (rule 12) — always shows
  "Skip" unless the user explicitly wants a different placeholder behavior; confirm
  before implementing since there's no underlying data check to run yet.

## Step 3 — Wire into floating widget

The floating widget (Phase 2) calls the current step's check function on mount/data
change (via existing React Query cache for that page's data — do not introduce a
separate polling mechanism) and renders the resulting label + note override.

## Verification

- Create a department with a course that has no levels; confirm the widget shows
  "Skip" and a note naming the specific incomplete item.
- Complete the structure; confirm the button flips to "Done".
- Confirm this reuses one function, not parallel logic in frontend and backend.

Stop and report before Phase 4.
