# TICK-ASSESS-003 — Resume AI assessment generation after navigation

Status: ready-for-review
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

- Targeted: PASS — backend assessment+grading-scheme+grade 17 suites/148 tests (new assessment-generation.helper.spec: 15 tests — persist/ready/failed/reconcile/most-recent/confirm-ownership/restart-confirm). Frontend: new resume.test 4/4; FULL frontend suite 12 suites/106 tests PASS. tsc: 0 errors in touched files (backend + frontend). ESLint exit 0 on all touched files.
- Migration `20260928000002_add_assessment_generation_jobs`: schema `prisma validate` OK; SQL hand-written + format-reverted to zero unrelated churn. NOT applied (no live DB here) — reviewer must apply in non-prod first per migration rules.
- Manual browser scenarios (navigate-away resume, restart-shows-failed, two-tabs most-recent-wins) NOT run here — flagged for reviewer with dev servers.
- Development integration: not run (awaiting reviewer merge; merge after TICK-ASSESS-001 and TICK-ASSESS-002)

## Blocker

None.

## Activity Log

- 2026-09-28: Claimed, counter ASSESS=3. Confidence 84/100 as above.
- 2026-09-28: Implemented. Backend: AssessmentGeneration model+enum+migration, repo job methods, helper persists generating/ready/failed/cancelled + reconcile-to-failed + getActiveGeneration (most-recent wins) + ownership-checked confirm payload (memory or DB row); service+controller `GET generation/active` (token-scoped + class-ownership check). Frontend: useGenerationPreview/useActiveGeneration hooks, Step4 refactored onto hook+mapPreviewQuestions, new/page.tsx mount-restore (generating→Step4, ready→rebuilt Step5, failed→explicit banner). Deviations from plan: endpoint is `GET /classes/:classId/assessments/generation/active` (path param, matches controller prefix) instead of `?classId=`; confirm-after-restart works via DB row. Commit b0e5def5. Ready for review.

## Commits

- b0e5def5 feat(assess): persist preview jobs and resume generation after navigation (branch agent/TICK-ASSESS-003-resume-generation)

## Notes

- Phase C of 3-phase plan. Merge after TICK-ASSESS-001 and TICK-ASSESS-002 (touches new/page.tsx imports near Phase A hunk — flag for reviewer).
