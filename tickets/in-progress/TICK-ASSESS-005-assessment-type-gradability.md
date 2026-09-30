# TICK-ASSESS-005 — Split assessment types into system-gradable vs manual-only

Status: in-progress
Priority: high
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Worktree: ../EduToolV4-worktrees/TICK-ASSESS-005-assessment-type-gradability
Branch: agent/TICK-ASSESS-005-assessment-type-gradability

## Problem

Two real defects, both from the same root cause — no single source of truth for
*which* assessment types the AI can auto-grade.

**1. Manual-only types are selectable in the System-Graded wizard.**
`ComponentType` is one flat 14-value enum with no gradability metadata.
`new/page.tsx:56-59` builds `schemeTypes` from *every* scheme component with no
filter, and the same unfiltered list is passed to both `Step3` (system path,
`:227`) and `ManualStep1` (manual path, `:252`). `Step3.tsx:211-226` renders a
plain `<select>` over it, so **"Behavior" appears in the System-Graded flow**.
Backend never blocks it: `assessment-creation.helper.ts:15-27` checks only
scheme membership, never gradability. Result: educator picks System-Graded +
Behavior → AI generates auto-graded MC questions → `grade-core.service.ts:120-157`
averages it by weight. `Step0.tsx:79` already documents the intent ("Best for
projects, recitation, and behavior") — the list just never encoded it.

**2. True/False generates as Multiple/Identification.** String mismatch:
- wizard/DTO/frontend: `true_or_false` (`constants.ts:41`, `assessment.dto.ts:31`, `assessment.types.ts:13`)
- AI blueprint: `true_false` (`ai/types.ts:32`)
- prompt rules key: `true_false` (`prompt-builder.util.ts:19`)
- token cost key: `true_false` (`ai/constants.ts:3`)

`assessment-generation.helper.ts:151,254` use an **unchecked cast**
(`r.questionType as QuestionBlueprint['type']`) to force `true_or_false` into a
union that does not contain it. Then `prompt-builder.util.ts:33-34`:
`exampleAndRules[type] ?? exampleAndRules.identification` — the lookup MISSES
and **silently falls back to the identification format**. The model returns
identification-shaped output; `confirmPreview` (`assessment-educator.service.ts:672-688`)
stores whatever `q.type` it emitted, and the student UI renders by `q.type`
(`student/.../page.tsx:313-394`) with `AssessmentQuestions.tsx:80-104` showing
`q.choices` whenever present — so it reads as Multiple Choice.
`TOKEN_COST['true_or_false']` also misses → falls back to 150
(`ai.service.ts:321,363`), so chunk sizing and `maxTokens` are wrong too.

**3. `'manual'` is a phantom type** (blocks clean enforcement).
`grading-scheme.entity.ts:7` allows `AssessmentComponentType | 'manual'`, but
`'manual'` is not in the 14-value enum and is rejected by `@IsEnum` in
`grading-scheme.dto.ts:29` and `grading-scheme-template.dto.ts:24`. Meanwhile
`grade-core.service.ts:113` branches on `category.type === 'manual'`, and
`frontend/src/components/admin/data-seeder/constants/grading-schemes.ts:20-75`
hardcodes `type: 'manual'` for Participation/Behavior/Health — rows that cannot
be saved through the API. It is a **category-level** marker in the grading
engine, orthogonal to `GradingMode`, so it must NOT be repurposed as the
gradability flag. `FOLLOW_UPS.md:28-40` flags this as an open decision and says
not to resolve it inline.

## Goal

1. One canonical system-vs-manual type split in the backend constants, with a
   pure `isSystemGradable()` helper.
2. Backend rejects a manual-only type when the resolved mode is system/hybrid
   (authoritative — CORE.md Part 1), on **both** `create` and `generatePreview`.
3. Replace the unchecked `as QuestionBlueprint['type']` casts with real
   narrowing; unify the T/F spelling to `true_or_false`; make `buildChunkPrompt`
   **throw** on unknown types instead of silently falling back.
4. Frontend filters the type picker by active grading mode; remove the
   divergent hardcoded `["quiz","activity","exam","custom"]` fallback.
5. Parity test pinning backend/frontend type lists so this cannot drift again.
6. Do NOT touch `'manual'` — log the open decision in FOLLOW_UPS.md.

## Relevant Areas

## Confidence

- Score: 86/100 (Requirement clarity 23, Codebase verification 21,
  Architecture fit 19, Edge cases 12, Blast radius 11)
- **Critical-risk override applied** (grading + DB-migration-adjacent): capped at
  79% for the *implementation* until the database ground-truth check below passed.
  It passed, lifting the effective score to 86.
- Gaps and the assumptions chosen for each (proceeding per the 80-94 band):
  1. **Which types are manual-only is a judgment call, not a fact.** Proceeding
     with `participation, behavior, attendance, performance_task` as manual-only;
     `written_work, quarterly_assessment, exam, quiz, assignment, project,
     recitation, activity, custom, other` as system-gradable. `performance_task`
     and `recitation` are the debatable pair — a practical demo is normally
     educator-judged, while a written recall test is auto-gradable. Flagging for
     review; the split is one constant and trivial to move.
  2. **Migration scope assumed from live data.** Queryed the dev DB before
     planning the migration: `Question` has **zero** `true_false`/`true_or_false`
     rows (so defect 2 never persisted bad data), the single `behavior`
     assessment is already `grading_mode = 'manual'`, and no
     `GradingSchemeComponent` row uses `'manual'`. Conclusion: **no migration is
     required** and none will be written — the fix prevents new bad rows rather
     than repairing old ones. Blast radius on existing data is therefore zero.
     If production differs from dev, the code fix still holds; only a backfill
     would be needed, which is a separate ticket.
  3. **Reject vs auto-correct.** Proceeding with an explicit 400 naming the
     manual-only types rather than silently coercing `gradingMode` to manual —
     silently coercing hides a real mistake from the educator.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

- 2026-09-30: Claimed, counter ASSESS=4 → 5. Worktree created from fresh
  `origin/development` (ad5ab278) outside the repo, per AGENTS.md §3. The main
  checkout carries unrelated uncommitted work, so the isolated worktree is
  required here, not merely conventional.
- 2026-09-30: Confidence 86/100 as above. Initial raw score was 77 (below the 80
  stop threshold) because the plan assumed a migration whose target data was
  unknown. Per confidence-gating.md stopped and queried the live dev DB to close
  that gap; the result (zero T/F rows, no `manual` scheme components) removed
  the migration entirely and raised the score.
- 2026-09-30: Scope decision — Step 3 (migration) **dropped** as unnecessary per
  the DB evidence above. Remaining scope is code-only, no schema change.

## Commits

- (pending)

## Notes

- Follows TICK-ASSESS-001, which unified the 14-type allow-list. That ticket
  fixed *which types exist*; this one fixes *which types each grading mode may
  use* — the exact gap its own "Phase A of 3-phase plan" note anticipated.
- The open `'manual'` question is deliberately left for its own ticket, per
  FOLLOW_UPS.md.


- shared/rules/confidence-gating.md (critical-risk override: grading + migration)
- shared/skills/database/MUST-HAVES.md §Grading invariants
- shared/skills/backend/MUST-HAVES.md, shared/skills/frontend/MUST-HAVES.md
- shared/skills/testing/MUST-HAVES.md
- backend/src/modules/grading-scheme/constants/assessment-type.constants.ts
- backend/src/core/ai/{types,constants,prompt-builder.util}.ts
- backend/src/modules/assessment/{dto,educator/helpers,educator}
- frontend/src/components/educator/assessment-builder/*
- frontend/src/app/educator/classes/[classId]/assessments/new/page.tsx

## Acceptance Criteria

- [ ] `isSystemGradable()` + `SYSTEM_GRADABLE_TYPES` exported from the canonical
      backend constants, derived from the enum (no second hardcoded list)
- [ ] Manual-only types (participation/behavior/attendance/performance_task) are
      absent from the System-Graded type picker
- [ ] Backend returns 400 when a manual-only type is used with system/hybrid mode,
      on both `create` and `generatePreview`
- [ ] No `as QuestionBlueprint['type']` cast remains; unknown question type
      throws a typed error instead of falling back to `identification`
- [ ] True/False generates with the True/False prompt format and correct token cost
- [ ] `Step3.tsx` hardcoded type fallback removed
- [ ] Parity spec pins backend/frontend lists
- [ ] `'manual'` untouched in code; open decision recorded in FOLLOW_UPS.md
- [ ] Targeted tests pass; lint/typecheck clean in worktree
