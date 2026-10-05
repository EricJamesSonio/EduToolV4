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
- [ ] Phase-1-cleanup: remove legacy read-then-write paths in  `assessment-core.repository.ts` (`upsertSubmission`) and
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

## TICK-ASSESS-005 (2026-09-30) — `manual` DTO-vs-entity mismatch (still deliberately untouched)
- `backend/src/modules/grading-scheme/entity/grading-scheme.entity.ts`
  `ComponentType` historically included `'manual'`, which the canonical
  `ComponentType` enum (`constants/assessment-type.constants.ts`, 14 values)
  and `@IsEnum` DTO validation do NOT accept. The entity type now reads
  `AssessmentComponentType | 'manual'` to preserve existing behavior.
- **STILL OPEN — TICK-ASSESS-005 did not resolve this.** It added
  `SYSTEM_GRADABLE_TYPES` / `MANUAL_ONLY_TYPES` / `isSystemGradable()`, which
  answer "can the AI auto-grade this type?" and are a *different* concern from
  whether `'manual'` is a creatable scheme-component type. The entity, the
  `grade-core.service.ts` `category.type === 'manual'` branch, and the
  data-seeder rows below are untouched.
- Open decision needed: should `'manual'` be a creatable scheme-component
  type (then add it to the canonical enum + DTO + frontend lists), or is it
  legacy/stale data that should be migrated away (then remove from the
  entity)? Related: frontend seeder
  `components/admin/data-seeder/constants/grading-schemes.ts` hardcodes
  `type: 'manual'` for Participation/Behavior — also rejects under the DTO.
- **Partially addressed by TICK-GRADE-005**, which derives manual-scored
  categories from the type set (participation/behavior/attendance/
  performance_task) rather than from the `'manual'` marker, so Behavior and
  Participation work on the Grades page without `'manual'` ever being
  creatable. The `'manual'` marker itself is still unresolved.
- Do NOT resolve inline in a future ASSESS phase without that decision.

