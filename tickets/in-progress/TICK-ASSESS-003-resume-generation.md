# TICK-ASSESS-003 — Resume AI assessment generation after navigation

Status: in-progress
Priority: high
Created: 2026-09-28
Created by: agent
Assigned to: agent
Started: 2026-09-28
Worktree: ../EduToolV4-worktrees/TICK-ASSESS-003-resume-generation
Branch: agent/TICK-ASSESS-003-resume-generation

## Problem

Wizard state + previewId live in page `useState` (dies on unmount); backend generation status is in-memory Maps keyed by random UUID (lost on restart, unlistable by class+educator). No resume path exists.

## Goal

1. Backend: persisted generation-job record (source of truth; memory stays as fast-path cache). New endpoint `GET assessment/generation/active?classId=` scoped to requesting educator. Reconcile orphaned `generating` (no in-memory job, e.g. after restart) to `failed`.
2. Frontend: extract Step4 inline poller into reusable `useAssessments.ts` hook; on mount of new/page.tsx query active job and restore step+previewId; handle generating (resume polling) / ready (jump to review) / failed (error + restart, not silent step 0).
3. Race: two tabs same class — most-recent job wins; document + test.

## Relevant Areas

- shared/skills/database/MUST-HAVES.md §Indexing (new table filters), §Grading invariants (n/a — previews pre-grade, no scoring change)
- shared/rules/database-migrations.md, shared/rules/architecture.md, shared/rules/security.md §Multi-tenant isolation
- shared/skills/backend/MUST-HAVES.md, shared/skills/frontend/MUST-HAVES.md, shared/skills/testing/MUST-HAVES.md
- backend/src/modules/assessment/educator/assessment-generation.helper.ts, assessment-educator.service.ts, assessment-educator.controller.ts, prisma/schema.prisma
- frontend/src/hooks/educator/useAssessments.ts, assessment-builder/Step4.tsx, new/page.tsx, api/educator/assessment.api.ts

## Acceptance Criteria

- [ ] Migration + model for generation-job record (additive, reversible, indexed on lookup columns)
- [ ] Active-job endpoint scoped by token org+educator; orphan reconcile to failed
- [ ] useGenerationStatus hook extracted; Step4 uses it (no behavior change)
- [ ] new/page.tsx restores generating/ready/failed correctly on mount
- [ ] Targeted tests pass (helper reconcile, endpoint scoping, hook/restore behavior as feasible); lint/typecheck pass
- [ ] Merge after TICK-ASSESS-001 and TICK-ASSESS-002

## Confidence

- Score: 84/100 (Requirement 22, Codebase verification 18, Architecture 18, Edge cases 12, Blast radius 14).
- Gaps: generation helper internals not yet fully read in this worktree (audit covered behavior, not every line) — will read before coding; race semantics chosen (most-recent wins) and will be documented + unit-tested at query level. Assumption: no live DB available here, so migration is committed unapplied + validated via `prisma validate`/`format` and jest with mocked db; reviewer applies it in a non-prod env per migration rules.
- Blast radius: generation flow only; no scoring/grade paths touched. Auth scoping per token (controller guard pattern to be confirmed by reading controller).

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

- 2026-09-28: Claimed, counter ASSESS=3. Confidence 84/100 as above.

## Commits

None yet.

## Notes

- Phase C of 3-phase plan. Merge after TICK-ASSESS-001 and TICK-ASSESS-002 (touches new/page.tsx imports near Phase A hunk — flag for reviewer).
