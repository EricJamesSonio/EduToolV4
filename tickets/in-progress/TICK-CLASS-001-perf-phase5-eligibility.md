# TICK-CLASS-001 — Perf Phase 5 eligibility/prerequisite batching + EXPLAIN ANALYZE

Status: in-progress
Priority: high
Created: 2026-09-26
Created by: agent
Assigned to: agent
Started: 2026-09-26
Worktree: ../EduToolV4-worktrees/TICK-CLASS-001-perf-phase5-eligibility
Branch: agent/TICK-CLASS-001-perf-phase5-eligibility

## Problem

`getEligibleClassesForStudent` fans out to ~500+ queries (per-class academic-structure resolution × per-prereq grading-scale lookups, all sequential); `checkEligibility`/`isGradePassing` re-queries scales per prereq with no batching or memoization. Highest-risk refactor — eligibility logic must stay bit-identical.

## Goal

1. `class.service.ts getEligibleClassesForStudent` + `enrollment-eligibility.util.ts`: batch subject/academic-structure lookups via IN, batch prereq + grading-scale lookups into Maps. Same eligibility output.
2. `subject-prerequisite.service.ts` + repository: same batching + per-request memoization of scale lookups.
3. EXPLAIN ANALYZE on realistic volume (200 candidates, 50 enrollments, 3-deep prereqs) in an isolated scratch database (never the shared dev DB); plans in handoff; flag loudly if seq-scan where index expected.
4. Specs pinning eligibility decisions (eligible/ineligible/missing/warning) before + after.

## Relevant Areas

- shared/skills/database/MUST-HAVES.md §Grading invariants (pass/fail is authoritative-adjacent)
- backend/src/modules/class/class.service.ts
- backend/src/modules/enrollment/enrollment-eligibility.util.ts
- backend/src/modules/subject-prerequisite/
- backend/src/modules/grading-scale/

## Acceptance Criteria

- [ ] Eligibility decisions identical on pinned fixtures (eligible, missing prereq, failing grade, warning paths)
- [ ] Batched queries (call-count specs); per-request scale memoization
- [ ] EXPLAIN ANALYZE plans collected on seeded scratch DB and recorded; no unexpected seq scans (or flagged)
- [ ] Existing specs green

## Confidence

Score: 80/100
- Requirement clarity: 24 (batching pattern set; EXPLAIN target volumes explicit)
- Codebase verification: 19 (audit-read; exact service/repo/scale shapes verified in-worktree before editing)
- Architecture fit: 18 (repo batch methods + in-memory Maps; no logic moves)
- Edge cases: 9 (pass/fail thresholds, missing grades, shared scales, 3-deep chains — pinned by specs)
- Blast radius: 10 (enrollment gating is high-stakes; mitigated by decision-pinning specs + isolated commits)
Proceeding at the 80% floor with disclosed assumption: scratch-DB EXPLAIN stands in for prod-volume plans (shared dev DB is empty and must not be seeded); decision-equivalence via mocked-repo specs.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-09-26 — Claimed (first CLASS ticket, counter created at 1), creating worktree from development.
Confidence: 80/100 (Requirement clarity 24, Codebase verification 19, Architecture fit 18, Edge cases 9, Blast radius 10). Assumption: scratch-DB plans + mocked decision specs (dev DB empty, must stay clean).

## Commits

None yet.

## Notes

Behavior-preserving refactor only. No logic/output changes. Scratch DB for EXPLAIN must be created and dropped; shared dev DB stays read-mostly (SELECTs only).
