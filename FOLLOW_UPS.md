# Follow-ups (unrelated bugs spotted during perf phases — do NOT fix inline)

## Pre-existing baseline failures (on `development` before Phase 0, 2026-09-27)
- Backend unit: 8 failed suites / 36 failed tests — `program`, `section`,
  `semester`, `level`, `class`, `registrar`, `school-year`, `educator` service specs.
  Working tree had uncommitted level/section changes at baseline time.
- `npx tsc --noEmit` pre-existing errors in untouched files: `level.service.ts`
  (duplicate implementation), `class`/`school-year`/`semester` specs (arity
  mismatches), `org-schedule-config.service.ts` (`toMinutes` conflict), seed/e2e
  fixtures (missing `program_id`). None caused by perf phases.
- Rule: each phase must only keep its own specs green and not worsen the baseline.

## Deferred cleanups from perf phases
- [ ] Phase-1-cleanup: remove legacy read-then-write paths in
  `assessment-core.repository.ts` (`upsertSubmission`) and
  `attendance.repository.ts` (`upsertRecord`) once migration
  `20260928000000_submission_attendance_native_upsert_unique` is applied
  everywhere; then flip `NATIVE_UPSERT_ENABLED=true` and delete the flag.
- [ ] Apply migration `20260928000000_*` (dedupe check first — see SQL header).
- [ ] Apply migration `20260928000001_perf_hot_path_indexes_2` (review SQL first;
  zero-downtime path: `prisma/scripts/apply-perf-indexes-2-concurrently.sql`
  via psql, then `prisma migrate resolve --applied`).
- [ ] Pool sizing: set `max=20` + `DB_POOL_MAX` override (approved, deferred).
- [ ] Out-of-scope index candidates from the audit (not in the Phase 3 list,
  skipped deliberately): `StudentSchoolYear(org_id, status)`,
  `Concern(org_id, created_at)` for the digest sweep — revisit if those paths
  stay hot after Phases 1–3 land.
