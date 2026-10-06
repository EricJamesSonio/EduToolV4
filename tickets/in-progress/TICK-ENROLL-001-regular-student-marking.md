# TICK-ENROLL-001 — Mark-as-regular: auto-complete lower-level subjects + auto-enroll active-semester classes

Status: in-progress
Priority: high
Created: 2026-10-06
Created by: agent
Assigned to: agent
Started: 2026-10-06
Worktree: ../EduToolV4-worktrees/TICK-ENROLL-001-regular-student-marking
Branch: agent/TICK-ENROLL-001-regular-student-marking

## Problem

Regular (continuing) students re-enrolling for a new school year must have
their lower-level subjects auto-completed (via SubjectCompletionOverride) and
be auto-enrolled into classes in the active semester — scoped strictly to the
student's own track, idempotent, and safe to re-run.

Prior work (already on development):
- b7773049 — EnrollmentService.checkEligibility delegates to
  SubjectPrerequisiteService.checkEligibilityBatch (one decision path,
  incl. SubjectCompletionOverride credits).
- 5b7efce5 — StudentService.addEnrollment routes through
  EnrollmentService.enroll (prerequisite gate + preserved overflow/audit).
- Approved migration 20261006000000_add_regular_student_marking:
  SubjectCompletionOverride.source ("manual" | "regular", default "manual"),
  StudentProgramEnrollment.is_regular / regular_marked_at / regular_marked_by.
  Migration applied to local DB; schema.prisma updated.

## Goal

1. Any admin edit of a completion row (upsert, updateStatus pending/
   completed) sets source='manual'. Un-marking deletes source='regular'
   rows only — never a row an admin touched.
2. Two idempotent steps: (1) short tx writes overrides + is_regular flag,
   commits; (2) planner computes enrollment plan, executor enrolls in a
   second tx that re-checks duplicates + capacity inside it. Combined
   report; partial failure after step 1 safe to re-run.
3. No per-class EnrollmentService.enroll() loop (~5 queries/class). Plan in
   memory: resolveSubjectAcademicStructures + isEligibleForClassStructure,
   one checkEligibilityBatch over all subject ids, countActiveMany for
   capacity, one batched duplicate lookup, one createMany(skipDuplicates).
   Same decision rules as enroll(); shared helpers extracted.
   Overflow = skipped and reported.
4. Batching spec: query count constant as classes/subjects grow.
5. Preview endpoint and execute step share the same planner function.
6. Dialog copy: regular status applies to the current school year only;
   must be re-applied after Change Year.
7. Out of scope (Part 3): cross-year grade/override id-mismatch bug.

## Relevant Areas

- backend/src/modules/student/ (StudentService.addEnrollment — done)
- backend/src/modules/enrollment/ (enrollment.service, repository, eligibility util)
- backend/src/modules/subject-prerequisite/ (checkEligibilityBatch)
- backend/src/modules/subject-completion-override/ (upsert/updateStatus source)
- backend/src/modules/student-program-enrollment/ or owner of StudentProgramEnrollment
- backend/prisma/migrations/20261006000000_add_regular_student_marking/
- frontend student detail (mark-regular dialog + Change Year copy)

## Acceptance Criteria

- [ ] No-credit enrollment rejected; completed override allows enroll
  (incl. direct API call path) — specs (Part 1b done: student-add-enrollment-prereq.spec.ts)
- [ ] Admin upsert/updateStatus sets source='manual'; un-mark deletes only
  source='regular' — specs
- [ ] Preview and execute use the same planner; reports agree
- [ ] Batching spec proves constant query count as classes/subjects grow
- [ ] Partial failure after step 1 is safe to re-run (idempotent)
- [ ] Frontend: year-scoped copy on mark-regular dialog + Change Year
- [ ] Targeted + full backend suites pass; typecheck/lint pass

## Confidence

- Score: 88/100 (Requirement clarity 25, Codebase verification 20,
  Architecture fit 18, Edge cases 12, Blast radius 13).
- Gaps: exact owner module of StudentProgramEnrollment writes not yet
  opened (assuming student-program-enrollment or student module owns it —
  will verify before coding step 2); frontend dialog component shape
  assumed similar to existing student-detail dialogs (will verify).
  Proceeding with disclosure; assumptions logged per step.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-10-06 — Claimed by agent. Part 1 (enroll-gate refactor) and Part 1b
(addEnrollment routing + prereq specs) already committed on development
as b7773049 and 5b7efce5. Migration approved and applied locally.
Starting Part 2 backend (source='manual' stamping, planner, executor).

## Commits

(none yet)
