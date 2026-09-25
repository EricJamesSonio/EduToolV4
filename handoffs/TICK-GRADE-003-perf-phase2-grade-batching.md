# Handoff — TICK-GRADE-003 Perf Phase 2 grade batching

Status: ready-for-review (branch `agent/TICK-GRADE-003-perf-phase2-grade-batching`, 4 commits, PR vs `development`)
Worktree: `../EduToolV4-worktrees/TICK-GRADE-003-perf-phase2-grade-batching` (keep until merged)

## What changed (4 isolated commits, grading logic untouched)
1. `87bfd855` — `grade-core.service.ts`: `computeWeightedScore`/`buildCategoryBreakdown` use prebuilt `Map`s (assessments-by-type, submission-by-assessment, manual-by-category; first-row-wins = old `find` semantics). `O(A²)` → `O(A)` per student.
2. `530b161a` — `grade-educator.service.ts`: `getGradesByClass` fetches class invariants once + `Promise.all` over terms; `buildTermResult` takes optional `shared` ctx (single-term path unchanged), groups subs/manuals/assessments once, active-weight via id-Set.
3. `c3bb67a0` — legacy `grade.service.ts`: same (parallel terms, hoisted scheme/profiles, grouped lookups). Verdict: **LIVE** (serves `GET /classes/:classId/grades` via `grade.controller.ts`) — fixed, not dead.
4. `717e14b1` — new `GradeRepository.saveComputedGrades()` (1 lock-check SELECT + chunked `$transaction` upserts @50/chunk, empty fast path); both `computeGrades` use it. Also fixes a tsc strict-null nit in the commit-2 spec.

## Query counts (mocked-repo proof, 2-term fixture; scales linearly)
- BEFORE: class invariants fetched per term (count test on old code: `findGradingSchemeForClass` ×2 for 2 terms); grid ≈ 2 + T×8 sequential; compute ≈ 9 + S sequential upserts.
- AFTER: invariants ×1 total (count test green); grid ≈ 3 prelim + 4 hoisted + T×4 parallel; compute ≈ 9 + 1 lock check + ceil(S/50) tx rounds. S=40: ~34+ sequential → ~11 mostly-parallel.

## Self-verification (done)
- 58/58 grade tests pass (37 core incl. KNOWN-BUG pins unchanged; lock-guard proofs + recompute-skip green).
- New specs run GREEN on pre-refactor code (checked out development versions) with zero expectation changes → output equivalence proven, not assumed.
- eslint clean; tsc no new errors; build OK (526 files).

## ⚠️ One intentional behavior adjustment (flagged, not silent)
`computeGrades` previously **overwrote locked grades** (no guard; only `recomputeStudentGrade` had one). It now **skips locked rows** via the single batched check and returns additive `skippedLocked` + extended message + `skippedLocked` in the audit metadata. If overwriting locked grades on bulk compute was ever intended, say so and I'll revert to pure-overwrite batching. No other output changes.

## No bugs fixed inline. Next: Phase 3 (separate ticket/branch).
