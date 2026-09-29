# Perf baseline — before numbers (Phase 0, no functional change)

Date: 2026-09-27. Branch: `development` (direct, per request — no worktree/phase branches).
Static query-count analysis (code inspection) + test baseline. No code changed in this phase.

## Query timing toggle (already present, no change needed)

- `backend/src/core/database/database.provider.ts:64-72` — `PRISMA_QUERY_LOG=true`
  enables Prisma `['query', 'warn', 'error']` logging; default off (`['warn', 'error']`).
- Usage for before/after: `PRISMA_QUERY_LOG=true npx jest <spec>` or set in staging env
  and compare per-request query counts/durations around the Phase 1–3 fixes.
- Pool: `pg` default `max=10`, shared by REST + `meeting.gateway` + `groupy.gateway`
  (`database.provider.ts:57-60`). User approved `max=20 + DB_POOL_MAX env override`
  — **deferred to a later phase, NOT changed here**.

## Baseline query counts (S = students, T = terms; example S=40, T=4)

| Path | Location | Queries (before) | Notes |
|---|---|---|---|
| Student search (`?search=`) | `student.repository.ts:177-181` (+ `educator.repository.ts:89-93` same pattern) | 1 × `account.findMany({ include: { profile: true }, take: 5000 })` per keystroke | Transfers up to 5000 accounts+profiles (~2–5 MB) to return 1 page; rank/sort/slice in JS |
| Transcript load | `transcript-student.service.ts:36-93` | 1 (enrollments) + 4 batched (subjects, profiles, schoolYears, grades) + U×4 where U = distinct subjects (8 typical → 32) | `findTemplateTermsByClass` (`grade.repository.ts:546-639`) = 4 sequential hits each (class→subject→assignment+template→semester); ~37 queries/transcript |
| Grade recompute (1 student) | `grade-educator.service.ts:475-501` | ~8: 6 parallel (scheme, `findSubmissionsForTerm` class-wide, assessments, manualScores, enrollmentDates, overrides) + scale resolve + class fetch | `findSubmissionsForTerm` returns S×A rows (~800) to use ~20; 40× amplification on hottest write path |
| Class export CSV | `export.service.ts:17-109` | 3 + S×(1 + T×3); S=40, T=4 → ~523 queries | `findSubmissionsForTerm` (full class-term set) re-fetched S×T times + filtered per student; full CSV string + `res.send` double-buffer |

## Test baseline (pre-existing, recorded before any fix)

- Backend (`npx jest`, unit): **65 passed / 8 failed suites; 739 passed / 36 failed tests.**
  Failed suites (pre-existing on `development`, unrelated to perf phases —
  level/section/program/semester/class/registrar/school-year/educator specs):
  `program.service.spec`, `section.service.spec`, `semester.service.spec`,
  `level.service.spec`, `class.service.spec`, `registrar.service.spec`,
  `school-year.service.spec`, `educator.service.spec`.
  (Working tree already had uncommitted level/section changes at baseline time.)
- Frontend (`npx jest`): **11 passed suites, 102 passed tests — green.**
- E2E (`test/jest-e2e.json`): not run (needs live DB); unit baselines above are the gate.

## What Phase 0 did NOT change

- No pool sizing (deferred, approved: default `max=20`, `DB_POOL_MAX` override).
- No migration run. No socket/cache/frontend changes.
- Only file added: this doc.
