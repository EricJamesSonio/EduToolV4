# Handoff — TICK-GRADE-004 Bulk compute skips locked grades (HOLD: needs human review)

Status: ready-for-review, **DO NOT MERGE without human sign-off** (branch `agent/TICK-GRADE-004-compute-skip-locked`, 1 commit `4bf068ef`, stacked on GRADE-003 @ `e17fa9a0`)
Worktree: `../EduToolV4-worktrees/TICK-GRADE-004-compute-skip-locked` (keep until decided)

## Why this exists (review question answered)
- **Was it intentional or accidental?** It was implemented because the Phase 2 scope text explicitly ordered it ("Preserve the existing 'skip if locked' guard behavior … check locked status via a single batched query"). That scope sentence conflated `recomputeStudentGrade`'s guard with `computeGrades`, which never had one. So: done per instructions, but the instruction was wrong to bundle it — the reviewer is right, and the split below resolves it.
- **What did old code do, exactly?** Both `computeGrades` (educator `grade-educator.service.ts`, legacy `grade.service.ts`) looped `for (studentId of enrolledStudentIds) { …compute…; await repo.upsert({…}) }` with no `is_locked` read anywhere — Prisma upsert on the `(org,student,class,term)` key overwrote `final_score/final_grade` unconditionally, **including locked rows**. Only `recomputeStudentGrade` had the guard (early return + `grade_recompute_skipped_locked` audit, proven by its spec).
- **Resolution**: TICK-GRADE-003 reworked to pure-overwrite batching (`e17fa9a0`, spec pins overwrite). This ticket is the behavior change, isolated, with its own tests.

## What changed (1 commit)
- `saveComputedGrades(args, { skipLocked })`: opt-in single lock-check + skip, returns `{ computed, skippedLocked }`; default path untouched (pure overwrite).
- Both `computeGrades` pass `{ skipLocked: true }`, return `skippedLocked` + extended message + audit metadata.
- New `grade-compute-skip-locked.spec.ts` 3/3: locked untouched / all-locked no-write / default-path overwrite preserved.

## Self-verification (done)
- Grade suite 9/9 on this branch; eslint clean; tsc no new errors.

## Decision needed from human
Merge (locked skip is the desired semantics — published grades must be final) or close as rejected (bulk compute intentionally overwrites, e.g. admin recompute flow). Either way, GRADE-003 merges independently.
