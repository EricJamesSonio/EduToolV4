# Handoff — TICK-CLASS-001 Perf Phase 5 eligibility/prerequisite batching

Status: ready-for-review (branch `agent/TICK-CLASS-001-perf-phase5-eligibility`, 2 commits, PR vs `development`)
Worktree: `../EduToolV4-worktrees/TICK-CLASS-001-perf-phase5-eligibility` (keep until merged)

## What changed (behavior-preserving; one decision code path)
1. `7e57241b` plumbing —
   - `enrollment-eligibility.util.ts`: new `resolveSubjectAcademicStructures` (1 subject query for N subjects; program precedence direct→course→strand→level→sharings identical to single path).
   - `grading-scale.repository.ts`: new `findByClassIds` (classes + assignments = 2 queries → `Map<classId, scale|null>`).
   - `subject-prerequisite.repository.ts`: new `getPrerequisitesWithGradesForSubjects` (2 queries, same latest-wins ordering) + `findBySubjects` (defined-fallback).
   - `subject-prerequisite.service.ts`: new `checkEligibilityBatch` (shared per-request scale cache); single `checkEligibility` delegates to it. `isGradePassing` memoized (failures never cached — same retry-then-fallback).
   - `enrollment.service.ts`: `isGradePassing` memoized; `checkEligibility` takes optional shared cache (single-enroll path passes none → per-call cache, same as before).
2. `5e6c25f8` wiring (`class.service.ts` only) — `getEligibleClassesForStudent`: one structure batch for all candidates + one `checkEligibilityBatch` for all eligible subjects.

## Query counts (E = eligible classes, P = prereqs)
- Structures: E×(1–6 sequential) → 1. Scales: E×P×2 → ≤ distinct-classes (memoized, 2-query batch available). Rows: E×2 → 2. Worst case ≈ 500+ sequential → ~8 parallel queries.

## Self-verification (done)
- 72 tests green incl. all 4 prereq proof tests (real-repo latest-wins passes on the batch path unchanged), enrollment decision specs, 8 new batch specs (precedence, mapping, decisions, call counts).
- Proof spec (a)-2 mocks updated to the batch seam — scenario (interrupted import → deny) unchanged.
- eslint/tsc/build clean (tsc: pre-existing set only).

## EXPLAIN ANALYZE (scratch DB, then dropped — shared dev DB untouched)
- Setup: `perf_explain_scratch` on the Aiven server, full current history + Phase 1 perf indexes, seeded 200 classes / 50 enrollments / 200 prereq links (3-deep chain S_top→S_mid→S_base + 197→S_base) / 50 locked passing grades. `ANALYZE` run. DB dropped after (`REMAINING 0` verified).
- Results (all sub-ms, no red flags):
  - Batched `Subject … id=ANY(200)`: Seq Scan, 0.25ms — optimal at 200 rows (planner cost 9.0); PK available for scale-up.
  - Batched `SubjectPrerequisite … subject_id=ANY(200)`: Seq Scan, 0.27ms — optimal at this size; `@@index([org_id, subject_id])` confirmed used by the single-predicate form (Index Scan, 0.09ms).
  - Batched grades join: Nested Loop + `Grade_pkey` scan with filter, 0.81ms; `Grade_org_id_class_id_term_id_idx` present for class-first patterns.
  - Scale assignments: **Index Scan on the unique key**, 0.06ms. Single forms: PK/composite index scans, ~0.09ms.
  - No `INVALID` indexes. Conclusion: plans are optimal at measured volume; production win is round-trip collapse (500+ sequential awaits → ~8 parallel queries), not plan shape. If prod tables reach millions, re-verify `id=ANY` selectivity — flagging here so it's on record, not because anything looks wrong.

## ⚠️ Deliberate nuance (flagged, not silent)
Multi-sharing subjects: single path read only the FIRST sharing row (unordered `findFirst` — nondeterministic); batch scans all sharings like `findEducatorProgramTypes` already does. Deterministic improvement on an unspecified-order path; structure id-sets were already all-sharings in both.

## Next: Phase 6 (separate ticket/branch — needs infra decisions, see ticket).
