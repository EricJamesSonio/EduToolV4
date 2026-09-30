# TICK-ASSESS-005 — Assessment type gradability split + true_or_false fix

Branch: `agent/TICK-ASSESS-005-assessment-type-gradability`
Commit: `114f7d0b`
Base: `ad5ab278` — **stale**, `origin/development` has moved to `4e11beaa`. Rebase required.

## What changed

Two defects, one root cause (no source of truth for which types the AI can auto-grade):

1. **Manual-only types were selectable under System-Graded.** One unfiltered
   14-type list fed both `Step3` (system) and `ManualStep1` (manual), so the AI
   auto-graded a "Behavior" assessment and `grade-core.service.ts` averaged it by
   weight. Fixed with `SYSTEM_GRADABLE_TYPES` + `isSystemGradable()` (derived from
   the enum, complement computed), a server-side
   `assertTypeMatchesGradingMode()` on both `create` and `generatePreview`, and a
   mode-aware picker on the frontend. Also deleted `Step3`'s hardcoded
   `["quiz","activity","exam","custom"]` fallback — a 5th divergent list.

2. **True/False generated as Multiple Choice.** The wizard sent `true_or_false`;
   the AI layer keyed on `true_false`; the call site used an unchecked
   `as QuestionBlueprint['type']` cast, so it compiled and then failed at runtime
   when the prompt-builder lookup missed and fell back to `identification`.
   Unified on `true_or_false`, replaced both casts with a throwing
   `toAiQuestionType()`, made `buildChunkPrompt` throw instead of falling back,
   and fixed the `TOKEN_COST` key (was silently falling back to 150, corrupting
   chunk sizing).

## No migration — verified, not assumed

Queried the live dev DB before planning: `Question` has **zero**
`true_false`/`true_or_false` rows, the one `behavior` assessment is already
`grading_mode='manual'`, and no `GradingSchemeComponent` uses `type='manual'`.
So the bug never persisted bad data; the fix prevents new bad rows instead.

## Validation

- backend targeted: 4 suites / 67 tests green (2 new specs)
- backend module-scoped (assessment + grading-scheme + grade): 19 / 193 green
- backend full: 87 suites / 925 tests, failure set **identical to the development
  baseline**, 0 new (9 pre-existing: class, educator, level,
  meeting-gateway-rate-limit, program, registrar, school-year, semester,
  subject-prerequisite)
- frontend full: 18 suites / 190 tests green (1 new spec, 23 cases)
- backend `tsc` 0 errors; eslint clean on all touched paths

## Reviewer notes

- One self-inflicted regression was found and fixed during validation:
  `assessment-educator.spec.ts`'s mock `creation` object lacked the new
  `assertTypeMatchesGradingMode`, so `create` threw. Mock added.
- The legacy `'manual'` scheme-component marker is **deliberately untouched**
  (FOLLOW_UPS.md). TICK-GRADE-005 partially addresses the *symptom* by deriving
  manual-scored categories from the type set instead, but the `'manual'` marker
  question itself is still open.
- **Duplicate-constant note:** this branch and TICK-GRADE-005 both declare
  `SYSTEM_GRADABLE_TYPES` / `MANUAL_ONLY_TYPES` in
  `assessment-type.constants.ts` because they were developed on parallel branches
  from `development`. Definitions are byte-identical and both derive from the
  enum, so rebasing one onto the other resolves with a straight delete of the
  duplicate. Expect a conflict on that file.

## Confidence: 86/100 (disclosed assumptions)

The user did not answer three clarifying questions; the recommended options were
used and are recorded in the ticket. The one to sanity-check is the **manual-only
set**: `participation`, `behavior`, `attendance`, `performance_task`. If the
reviewer disagrees with `attendance` or `performance_task` being manual-only, that
is a one-constant change plus the two specs.
