# Late-Enrollment Grading Exclusion — Phase 2: Core Grading Logic

Do not start until Phase 1's migration has been confirmed applied. Re-read
`backend/src/modules/grade/core/grade-core.service.ts` fresh at the start of
this phase — do not rely on Phase 0's notes verbatim, since this is the file
you are about to change and it must be read immediately before editing.

## Business rule (exact)

For a given `(assessment_id, student_id)` pair used in a grade computation:

1. Determine the student's enrollment date for the class the assessment
   belongs to. Use the join path confirmed in Phase 0's report as the actual
   source of truth. Do not substitute a different date field than the one
   confirmed to exist and be reachable in that report.
2. Determine the assessment's effective date: `release_date` if present,
   otherwise fall back to the field Phase 0 identified as the reliable
   substitute (e.g. `created_at`). If neither is reliably available, stop and
   flag this — do not silently pick a fallback that wasn't confirmed.
3. **Default rule:** if `assessment.effective_date < student.enrollment_date`,
   the assessment is **excluded** from this student's grade computation for
   that class.
4. **Override:** before applying the default rule, check
   `AssessmentGradingOverride` for a row matching `(assessment_id,
student_id)`.
   - If a row exists with `include = true` → treat as **included**,
     regardless of the default rule.
   - If a row exists with `include = false` → treat as **excluded**,
     regardless of the default rule (this lets an educator explicitly exclude
     something that would otherwise default to included, e.g. a late add
     that still shouldn't count).
   - If no row exists → apply the default rule from step 3.
5. Assessments/components excluded by this rule are removed from the
   weighted grade calculation and the **remaining weights are renormalized**
   proportionally so they sum to the same total the scheme originally used
   (mirror whatever renormalization pattern Phase 0 found for
   `is_optional` components — do not invent a different formula).
6. This rule applies only to assessments authored **before** the student's
   effective enrollment date. It has no effect on `is_missed` or
   `is_exempted` handling — those remain exactly as they currently work.
   Do not merge or conflate this exclusion with missed/exempted logic; keep
   it as a separate, explicit check.

## Edge cases to handle explicitly (write a comment at each decision point)

- Student has **zero** eligible (non-excluded) assessments in a
  category/component after exclusion → do not divide by zero; follow
  whatever the codebase already does when a component has no scoreable
  items (confirm this behavior in Phase 0 notes; if undocumented, stop and
  ask rather than guessing).
- All assessments in a term are excluded for a student (fully late
  enrollment mid-term) → grade for that term should reflect "no eligible
  assessments," not a false 0%.

- Mixed case: some assessments before enrollment, some after, within the
  same weighted component → only the pre-enrollment ones are excluded;
  renormalize within that component, not just across the whole scheme.
- A student has an override row for an assessment that has since been
  soft-deleted (`Assessment.deleted_at` set) → excluded assessments that are
  also deleted should not appear at all, override or not.

## Implementation constraints

- Extract the inclusion/exclusion decision into a single, pure, unit-testable
  function — do not inline this logic across multiple call sites. Suggested
  location: `backend/src/modules/grade/core/assessment-inclusion.util.ts`,
  but if Phase 0 found an existing `utils.ts` pattern in this module, follow
  that instead.
- The function signature must accept plain data (assessment effective date,
  enrollment date, override record) and return a boolean plus a reason enum
  (`"default_excluded" | "override_included" | "override_excluded" |
"included"`). This reason must be threaded through so Phase 4's UI can
  display _why_ something is excluded/included, not just that it is.
- All new Prisma queries against `AssessmentGradingOverride` must filter by
  `org_id` (per the constraint noted in Phase 1).
- Do not change the public method signatures of `grade-core.service.ts`
  that other modules depend on, unless Phase 0 confirmed no external callers
  — check this before touching the signature.

## Verification (required before reporting done)

1. Run the existing grade-core unit tests
   (`backend/src/modules/grade/core/__TEST__/`, or wherever Phase 0 found
   them) and confirm they still pass unmodified — this proves you haven't
   broken existing behavior for on-time-enrolled students.
2. Manually trace through the "mixed case" edge case with real seed data (or
   a temporary script) and print the before/after weight renormalization to
   confirm it sums correctly.
3. Do not write the Phase 5 test suite yet — that is a separate phase. This
   phase's verification is confirmation-only.

## Guardrails

- Max 3 retries if verification fails, each retry with a materially
  different fix attempt, then stop and report the exact failure with the
  computed vs expected values.
- If at any point you find yourself guessing which enrollment field to use
  because Phase 0's report didn't clearly confirm it, stop and ask — do not
  pick one and proceed.
- End with: **"Phase 2 complete. Core logic verified against existing tests
  and edge cases. Ready for Phase 3 confirmation."**
