# TICK-GRADE-003 — Perf Phase 2 grade batching (parallel terms, Map lookups, batched writes)

Status: ready-for-review
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

- Grade suite: 58/58 pass (37 core incl. KNOWN-BUG pins, 2 lock-guard proofs, 1 recompute-skip, 2 educator batching, 1 legacy batching, 4 compute batching, rest pre-existing)
- Equivalence proof: new batching specs run GREEN on pre-refactor code (via checkout of development versions) with zero expectation changes, then green on refactored code
- Before/after counts (mocked-repo, 2-term fixture): class-level fetches 2x per invariant BEFORE → 1x AFTER (proven by count test failing on old code with "Received 2", passing on new)
- eslint clean; tsc no new errors (3 pre-existing); `npm run build` OK (526 files)
- Full suite: not run (grade-scoped change; deferred to development integration after merge)
- Development integration: not run (await merge)

## Blocker

None.

## Activity Log

2026-09-25 — Claimed, creating worktree from development.
Confidence: 82/100 (Requirement clarity 25, Codebase verification 20, Architecture fit 18, Edge cases 9, Blast radius 10). Assumption: equivalence via mocked-repo specs (dev DB empty); query counts measured with seeded local volume + Phase 0 logging.
2026-09-25 — Implemented 4 commits (87bfd855 core maps; 530b161a educator parallel+hoist+group; c3bb67a0 legacy same; 717e14b1 batched computeGrades + saveComputedGrades + spec tsc fix). Legacy GradeService verdict: LIVE (serves GET /classes/:classId/grades) — fixed, not flagged dead. computeGrades now skips locked rows via single batched check (previously overwrote them) — intentional per ticket scope, flagged in handoff. Verified: 58/58 grade tests, equivalence green on old+new, lint/tsc/build clean.
2026-09-25 — Ready for review.
2026-09-26 — REVIEW RESOLUTION (locked-row question): the skip was implemented per scope text, which had conflated recompute's guard with compute (unguarded overwrite). Split out: this ticket reworked to pure-overwrite batching (e17fa9a0 — saveComputedGrades returns {computed}, services return original {computed,message}, spec pins overwrite incl. locked rows). Behavior change lives ONLY in TICK-GRADE-004 (held for human review). This ticket is now pure perf, mergeable. Verified: 58/58 grade tests, lint/tsc clean.

## Commits

- 87bfd855 perf(grade): Map lookups in computeWeightedScore/buildCategoryBreakdown
- 530b161a perf(grade): parallel term builds with hoisted invariants + grouped lookups in educator grid
- c3bb67a0 perf(grade): parallel term builds with hoisted scheme/profiles + grouped lookups in legacy grid
- 717e14b1 perf(grade): batched computeGrades writes via saveComputedGrades (branch agent/TICK-GRADE-003-perf-phase2-grade-batching, PR vs development)
- e17fa9a0 perf(grade): pure-overwrite batch writes; locked-skip split to TICK-GRADE-004

## Notes

Four commits planned, one per Goal item. Touches grading (authoritative) — no logic/output changes, refactor only. Any genuine bug found gets flagged, not silently fixed.
