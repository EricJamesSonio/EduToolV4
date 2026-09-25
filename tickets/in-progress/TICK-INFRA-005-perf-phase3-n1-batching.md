# TICK-INFRA-005 — Perf Phase 3 mechanical N+1 batching (transcript, attendance, grade-student, bulk ops)

Status: ready-for-review
Priority: high
Created: 2026-09-25
Created by: agent
Assigned to: agent
Started: 2026-09-25
Worktree: ../EduToolV4-worktrees/TICK-INFRA-005-perf-phase3-n1-batching
Branch: agent/TICK-INFRA-005-perf-phase3-n1-batching

## Problem

Per-item sequential / Promise.all-of-single-query N+1 in four areas (audit Phase 2 items #2, #5, #6, #10 + bulk sweeps): transcript per-enrollment 5-query fan-out; attendance per-session record lookup + per-record upsert; grade-student per-term refetch of full-class rows + invariant scheme; class/educator/student bulk loops with per-item org fetch + sequential creates.

## Goal

Convert each to one batched `findMany({ where: { id: { in: [...] } } })` + in-memory `Map`, behavior-preserving. Separate commit per module for isolated revert:
1. `transcript-student.service.ts` — batch subject/profile/schoolYear/grade; memoize `findTemplateTermsByClass` by `subject.program_id`.
2. `attendance-student.service.ts` + `attendance.repository.ts` — batch findMany + partition create/update in `$transaction`.
3. `grade-student.service.ts` — term-batching like Phase 2.
4. Bulk ops: `class.service.ts getStudentClasses`, `educator/student.service.ts bulkCreate`, `student-enrollment.service.ts bulkEnrollStudents`, `enrollment-auto-lock.service.ts lockExpired`, `grade-lock.validator.ts validateReadiness` — batch reads via IN, writes via createMany/updateMany, bcrypt via Promise.all.

## Relevant Areas

- shared/skills/database/MUST-HAVES.md §Avoiding N+1
- backend/src/modules/transcript/student/transcript-student.service.ts
- backend/src/modules/attendance/
- backend/src/modules/grade/student/grade-student.service.ts
- backend/src/modules/class/class.service.ts
- backend/src/modules/educator/educator.service.ts
- backend/src/modules/student/student.service.ts
- backend/src/modules/student-enrollment/student-enrollment.service.ts
- backend/src/modules/enrollment-portal/registrar/enrollment-auto-lock.service.ts
- backend/src/modules/grade-lock/grade-lock.validator.ts

## Acceptance Criteria

- [ ] Each module: same output, batched queries (specs with mocked repos pin values + call counts)
- [ ] Existing specs for touched modules still pass
- [ ] One commit per module

## Confidence

Score: 84/100
- Requirement clarity: 25 (4 explicit items, mechanical pattern)
- Codebase verification: 21 (audit-read; exact lines verified in-worktree per module before editing)
- Architecture fit: 19 (repo methods for queries; services group in memory)
- Edge cases: 9 (transcript/grade authoritative-adjacent; lock/empty/ordering edge cases pinned by specs)
- Blast radius: 10 (read-path heavy; bulk writes use transactions; isolated commits)
Proceeding. Assumption: output equivalence via mocked-repo specs (dev DB empty).

## Tests

- New batching specs: 6 files, all pass (transcript 6, attendance 3+2, grade-student 2, class 1, educator bulk 2, student bulk 1, enrollment bulk 3, auto-lock 3, readiness 2)
- Existing specs for touched modules: transcript (updated to batched API), attendance.service (bulk assertion updated), grade/export suites pass
- Pre-existing failures UNCHANGED (proven identical on old code): class.service.spec 10 failed (stale 7-arg constructor calls), educator.service.spec 3 failed (stale return-shape/Conflict expectations). Flagged, not fixed (outcome decisions outside perf scope).
- eslint clean on all touched files; tsc: only the 3 pre-existing errors; build OK (531 files)
- Full suite: not run (deferred to development integration after merge)
- Development integration: not run (await merge)

## Blocker

None.

## Activity Log

2026-09-25 — Claimed, creating worktree from development.
Confidence: 84/100 (Requirement clarity 25, Codebase verification 21, Architecture fit 19, Edge cases 9, Blast radius 10). Assumption: mocked-repo equivalence specs.
2026-09-25 — Implemented 10 commits (transcript, attendance, grade-student, class, educator, student, student-enrollment, auto-lock, grade-lock, + class-spec 8-arg fixup). Verified: new specs green, existing touched specs green/updated, pre-existing class+educator spec failures proven identical on old code and left untouched. tsc/build clean.
2026-09-25 — Ready for review.

## Commits

- 4dab867d perf(transcript) batch + memoize per subject
- b0293461 perf(attendance) batched lookup + bulk save
- dc771a2c perf(grade-student) 5 queries for all terms
- 6c6c69b2 perf(class) batched subject+educator lookup
- 8fb0eedf perf(educator) single org lookup + parallel bcrypt
- f3359e41 perf(student) single org lookup + parallel bcrypt
- 37268b58 perf(student-enrollment) batched pre-checks
- e4e63abf perf(enrollment-auto-lock) single UPDATE sweep
- 41116882 perf(grade-lock) class-wide load grouped by term
- d34ba7b8 fixup! class spec 8-arg constructor (branch agent/TICK-INFRA-005-perf-phase3-n1-batching, PR vs development)

## Notes

Cross-cutting mechanical batching → single INFRA ticket, per-module commits. No logic/output changes; genuine bugs flagged separately.
