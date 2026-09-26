# TICK-GRADE-004 — Bulk compute skips locked grades (business-logic change, NOT perf)

Status: ready-for-review
Priority: high
Created: 2026-09-26
Created by: agent
Assigned to: agent
Started: 2026-09-26
Worktree: ../EduToolV4-worktrees/TICK-GRADE-004-compute-skip-locked
Branch: agent/TICK-GRADE-004-compute-skip-locked

## Problem

`computeGrades` (bulk) overwrites locked grades: it upserts every computed row unconditionally, while the single-student `recomputeStudentGrade` path refuses to touch locked rows (guard + `grade_recompute_skipped_locked` audit). Bulk compute should honor the same lock semantics — locked = published/final. This was briefly bundled into TICK-GRADE-003's batching work, then split out here because it changes grade-lock semantics, not performance.

## Goal

1. Bulk `computeGrades` (educator + legacy services) skips locked rows via a single batched lock check, reports `skippedLocked`, extended message + audit metadata.
2. Dedicated tests specifically covering the locked-row case: locked row untouched, unlocked row written, mixed batch, all-locked batch, message/audit shape.
3. TICK-GRADE-003 stays pure-overwrite batching (its spec pins overwrite). This ticket is the ONLY place the skip exists.
4. DO NOT MERGE without human review — business-logic change by design.

## Relevant Areas

- shared/skills/database/MUST-HAVES.md §Grading invariants
- backend/src/modules/grade/grade.repository.ts (`saveComputedGrades` + skip option)
- backend/src/modules/grade/educator/grade-educator.service.ts
- backend/src/modules/grade/grade.service.ts

## Acceptance Criteria

- [ ] Locked rows never written by bulk compute (spec-proven, incl. mixed/all-locked)
- [ ] Unlocked rows written exactly as before (GRADE-003 specs still green)
- [ ] `skippedLocked` surfaced in return + audit metadata
- [ ] Human review sign-off before merge (ticket stays ready-for-review, unmerged)

## Confidence

Score: 90/100
- Requirement clarity: 24 (narrow, explicit; merge hold is the point)
- Codebase verification: 24 (rework done on GRADE-003 branch; exact old/new behavior diffed)
- Architecture fit: 18 (skip option on the batch method; single decision point)
- Edge cases: 12 (locked/unlocked/mixed/empty batches pinned)
- Blast radius: 12 (grading authoritative — capped thinking; isolated behind review hold)
Proceeding. No assumption beyond: skip (not error) on locked, mirroring recompute.

## Tests

- New locked-row spec 3/3 (locked untouched, all-locked no-write, default-path overwrite preserved); full grade suite 9/9 incl. GRADE-003 pure-batch specs
- eslint clean; tsc no new errors; build verified via grade suite run (full build on development integration after GRADE-003 merge)
- Full suite: not run (awaiting human review decision first)
- Development integration: not run (HOLD — do not merge without human sign-off)

## Blocker

Needs human review before merge (by design — see Goal §4).

## Activity Log

2026-09-26 — Split from TICK-GRADE-003 per review (bulk compute overwrote locked rows; scope text had conflated recompute's guard with compute). GRADE-003 reworked to pure-overwrite batching (e17fa9a0). Claimed; worktree stacked on GRADE-003 tip (needs saveComputedGrades; merges after GRADE-003).
Confidence: 90/100 (Requirement clarity 24, Codebase verification 24, Architecture fit 18, Edge cases 12, Blast radius 12). No open assumption.
2026-09-26 — Implemented (4bf068ef): skipLocked option on saveComputedGrades + both computeGrades pass it; dedicated locked-row spec 3/3; GRADE-003 batching spec updated to new shape on this branch; full grade suite 9/9 green. Pushed, ready for HUMAN REVIEW — HOLD, do not merge.
2026-09-26 — Ready for review (merge held).

## Commits

- 4bf068ef feat(grade-lock): bulk compute skips locked grades via opt-in batch option (branch agent/TICK-GRADE-004-compute-skip-locked, stacked on GRADE-003 @ e17fa9a0, PR vs development after GRADE-003 merges — HOLD for human review, do not merge)

## Notes

Depends on TICK-GRADE-003 (branch stacked on agent/TICK-GRADE-003-perf-phase2-grade-batching @ e17fa9a0, NOT fresh from development — documented exception: the batch method it extends lives there). Merge order: GRADE-003 first, then this only with human sign-off.
