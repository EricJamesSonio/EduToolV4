# TICK-GRADE-003 — Perf Phase 2 grade batching (parallel terms, Map lookups, batched writes)

Status: in-progress
Priority: high
Created: 2026-09-25
Created by: agent
Assigned to: agent
Started: 2026-09-25
Worktree: ../EduToolV4-worktrees/TICK-GRADE-003-perf-phase2-grade-batching
Branch: agent/TICK-GRADE-003-perf-phase2-grade-batching

## Problem

Grade grid is the highest-traffic path and the slowest: `getGradesByClass` awaits `buildTermResult` sequentially per term (T*8 serialized queries); per-student `.filter()` over full-class submissions/manuals (`O(S^2*A)`); `computeWeightedScore`/`buildCategoryBreakdown` do `.find()` per assessment (`O(A^2)`/student); `computeGrades` upserts sequentially per student. Touches authoritative grading data — behavior must be bit-identical.

## Goal

1. `grade-educator.service.ts getGradesByClass`: `Promise.all` over terms; hoist scheme/enrollmentDates/overrides/profiles; Map-grouped submissions/manuals in `buildTermResult`.
2. Same in legacy `grade.service.ts` — FIRST check if dead code; if dead, flag only, do not touch.
3. `grade-core.service.ts buildCategoryBreakdown` (+`computeWeightedScore` — same pattern, same file): `Map<assessment_id, submission>` built once.
4. `computeGrades`: hoisted maps + `createMany(skipDuplicates)` + `updateMany` (or chunked `Promise.allSettled` in `$transaction`); preserve locked-skip guard via single batched query.
5. Four separate commits, one per item. Query-count before/after via Phase 0 logging.

## Relevant Areas

- shared/skills/database/MUST-HAVES.md §Grading invariants, shared/rules/error-handling.md §data integrity
- backend/src/modules/grade/educator/grade-educator.service.ts
- backend/src/modules/grade/grade.service.ts
- backend/src/modules/grade/core/grade-core.service.ts
- backend/src/modules/grade/grade.repository.ts

## Acceptance Criteria

- [ ] Grade-grid output identical (existing grade specs pass + new specs for Map-grouping/parallel paths)
- [ ] Locked-skip guard preserved (recompute-skip spec still passes)
- [ ] Query count per grid load measured before/after and reported
- [ ] Legacy grade.service.ts verdict recorded (dead or fixed)

## Confidence

Score: 82/100
- Requirement clarity: 25 (4 explicit items, behavior-preserving)
- Codebase verification: 20 (audit-read the files; exact current lines verified in-worktree before editing)
- Architecture fit: 18 (repo/service layering kept; batching inside existing methods)
- Edge cases: 9 (grading authoritative → capped thinking; lock/override/manual-score interactions must be covered by specs)
- Blast radius: 10 (highest-traffic authoritative path; mitigated by 4 isolated commits + specs)
Proceeding with disclosed assumption: output-shape equivalence verified via unit specs with mocked repos (shared dev DB is empty — no live-volume comparison possible; Phase 0 logging comparison uses seeded local volume instead).

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-09-25 — Claimed, creating worktree from development.
Confidence: 82/100 (Requirement clarity 25, Codebase verification 20, Architecture fit 18, Edge cases 9, Blast radius 10). Assumption: equivalence via mocked-repo specs (dev DB empty); query counts measured with seeded local volume + Phase 0 logging.

## Commits

None yet.

## Notes

Four commits planned, one per Goal item. Touches grading (authoritative) — no logic/output changes, refactor only. Any genuine bug found gets flagged, not silently fixed.
