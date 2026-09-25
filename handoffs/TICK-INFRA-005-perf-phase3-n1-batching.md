# Handoff — TICK-INFRA-005 Perf Phase 3 mechanical N+1 batching

Status: ready-for-review (branch `agent/TICK-INFRA-005-perf-phase3-n1-batching`, 10 commits, PR vs `development`)
Worktree: `../EduToolV4-worktrees/TICK-INFRA-005-perf-phase3-n1-batching` (keep until merged)

## What changed (one commit per module, all behavior-preserving refactors)
1. `4dab867d` transcript — 4 batched `findMany` (subject/profile/year/grades via new `GradeRepository.findByClasses`) + template-terms memoized per subject. `1+9E` → `5+U` queries (U = unique subjects).
2. `b0293461` attendance — `findRecordsByStudentInSessions` (1 query, first-row-wins = old `findFirst`); `saveRecordsBulk` (1 lock-check + 1 tx of per-status `updateMany` + `createMany skipDuplicates`, last-wins). `bulkSetAttendance` uses it.
3. `dc771a2c` grade-student — 5 queries for all terms (grades/subs/manuals/assessments/scheme) grouped by term in memory. Additive repo changes: `term_id` added to 2 selects, optional `termIds` param on `findManualScores`.
4. `6c6c69b2` class — `findSubjectsWithEducators` (1 query, lean selects) for `getStudentClasses`.
5. `8fb0eedf` educator + `f3359e41` student bulkCreate — org domain fetched ONCE (split pure formatter out), bcrypt parallelized, sequential creates with P2002 skips kept.
6. `37268b58` student-enrollment — readiness asserted once + 2 batched conflict pre-checks (new repo methods); sequential creates with identical Conflict messages. Intra-batch dupes now get clean already-enrolled Conflict instead of raw P2002 race (only behavior nuance; deterministic improvement).
7. `e4e63abf` auto-lock — `lockManyApplications` single UPDATE (pending-guarded) + re-read only on count mismatch; audit/count cover actually-locked rows.
8. `41116882` grade-lock validator — prelims parallelized; class-wide assessments/subs (new lean `findSubmissionsForClass`) grouped by term. Verified deleted-assessment submissions are inert in both versions (never match checked pairs).
9. `d34ba7b8` fixup — new class spec uses the 8-arg constructor.

## Self-verification (done)
- 6 new spec files green; updated specs (transcript, attendance.service bulk assertion) green; grade/export suites pass (58+ grade tests).
- Pre-existing failures proven IDENTICAL on old code and left untouched (flagged, not fixed): `class.service.spec` 10 failed (stale 7-arg constructor), `educator.service.spec` 3 failed (stale return-shape/Conflict expectations vs current `{created,skipped}` + skip-duplicates behavior). These need an outcome decision outside perf scope.
- eslint clean; tsc only 3 pre-existing errors; build OK (531 files).

## Query-count summary (per request, S = students, E = enrollments, T = terms, R = records)
- transcript: 1+9E → 5+U | attendance view: 2+S → 3 | attendance bulk: 3+2R → 5 | grade-student: 3+5T → 8 | student classes: 1+E → 2 | educator/student bulk: N org-fetch → 1, serial bcrypt → parallel | enroll bulk: 4S → 3+S | auto-lock: 1+N → 2 (3 on contention) | readiness: 4+2T sequential → 6 parallel.

## Next: Phase 4 (separate ticket/branch).
