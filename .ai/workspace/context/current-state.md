# Current Project State

Last updated: 2026-10-08

<!--
One section per major domain/module. Keep status labels consistent:
implemented / partially implemented / not implemented / needs investigation
-->

## Timezone Step 5 enforcement (2026-10-08)

Status: implemented (TICK-INFRA-018 fast-forwarded to development, `01e1c21c..7a99ca5b`)

Implemented:

- ESLint timezone bans (both `eslint.config.mjs`): error in the 54 migrated files, warn elsewhere (23 backend + 66 frontend allowlist files, documented in-config to shrink). `datetime.util` implements (exempt), kind-C schedule files exempt by design, specs out of scope. Every disable carries a reason.
- CI `backend-tz-matrix` + `frontend-tz-matrix` (4 TZs each, in `ci-gate`); `test:tz-invariant` scripts (single TZ) + `test:tz` loops; dev scripts `TZ=UTC`; Dockerfile `ENV TZ=UTC`; HTTP boundary e2e (no DB).
- Merge gate: tz loops green x4 both apps, eslint 0 errors, tsc clean, both builds green; full suites at documented baselines.

## Timezone independence (2026-10-07)

Status: implemented (TICK-INFRA-017 fast-forwarded to development, `5b7efce5..af9aa74d`)

Implemented:

- Single time layer per side (`backend/src/commons/utils/datetime.util.ts`, `frontend/src/utils/datetime.util.ts`): `ORG_TIMEZONE = 'Asia/Manila'` (equality-tested), `parseInstant`, `@IsInstant`, `@IsCalendarDate`, `localInputToIso`, `isoToLocalInput`, `formatInZone`, `todayInZone`, `calendarDateOf` (+12h legacy tolerance), `calendarDateToUtc`, `addDaysToCalendarDate`, day-bound helpers, `weekdayInZone`, `weekdayOccurrencesInZone`, `normalizeDateInput` (frontend). Intl only, no new deps.
- Boundaries enforced per area in 8 commits (assessment → grade lock → crons + kind-B → edit-form round-trip → enrollment lock → attendance → lesson → meeting → audit-log). Remaining for later: Step 5 enforcement (eslint bans, CI matrix, dev/Docker TZ), Step 6 bad-data counting (held for cutoff date).
- Merge gate: development unmoved since branch point, clean fast-forward; validation above in CHANGELOG. Pre-existing reds unchanged (level/registrar/educator suites, frontend lint error in untouched assessment-type-gradability test, useTeachableSeed OOM).

## Grading-scheme category naming (2026-09-29)

Status: implemented (TICK-ASSESS-004 fast-forwarded to development, commit 60eb7e58)

Implemented:

- Category `Name` auto-fills from the selected type and follows it while untouched; hand-typed names are preserved; all 4 grading-scheme editors pre-fill new rows. Single rule in `GradingSchemeComponentRow` (`labelForType`, `isAutoName`), 7 seeding sites, plus `aria-label` on the previously unlabeled Name input. New spec 6/6 green.
- Merge gate: rebased branch off `development c34af581` (created fresh, no rebase needed), validated vs baseline — frontend 12 suites / 108 tests green (baseline 11 / 102), lint 0 errors, tsc 17 errors identical to baseline (0 new).
- Out of scope (flagged): class/template dialog editors still append a *fixed* type instead of the first unused one, so two rows can share a type and therefore a name — harmless, component `name` has no backend uniqueness constraint.

## Assessment type gradability + manual category scoring (2026-09-30)

Status: implemented (TICK-ASSESS-005 `f378f39c`, TICK-GRADE-005 `f877f96f` — both merged to development)

Implemented:
- `SYSTEM_GRADABLE_TYPES` / `MANUAL_ONLY_TYPES` / `isSystemGradable()` in
  `assessment-type.constants.ts` answer "which types can the AI auto-grade?",
  derived from the enum with the complement computed so the two cannot drift.
  The frontend mirrors this and filters the wizard's type picker by the active
  grading mode; the backend rejects a manual-only type with system/hybrid mode
  on both `create` and `generatePreview`.
- Manual-only types (participation, behavior, attendance, performance_task) are
  educator-scored on the **Grades page**: `isManualScoredCategory()` in
  `grade-core.service.ts` routes them to the `ManualScore` path across 7 call
  sites (grade-core, grade.service, grade-educator, grade-student, export),
  replacing the `type === 'manual'` check that never matched persisted data.
- `CategoryBreakdown` exposes `isManualScored` and `maxScore`, so the grade
  tables render an editable, capped column *before* any score exists. The cap is
  `max_score` when set, else the category weight, enforced in the cell and
  authoritatively server-side (which also rejects unknown categories).
- True/False generation fixed: unified on `true_or_false` across the AI layer,
  with the unchecked `as QuestionBlueprint['type']` casts replaced by a throwing
  `toAiQuestionType()` and `buildChunkPrompt` now throwing instead of silently
  falling back to the identification format.

Open review findings / not verified:
- The Grades page change was diagnosed from source, not reproduced in a browser —
  a click-through is still worth doing.
- The manual-only set is a product decision, not a fact; `attendance` and
  `performance_task` are the debatable members. Changing it is a one-constant
  edit plus the two specs.
- The legacy `'manual'` scheme-component marker remains unresolved (see
  FOLLOW_UPS.md). TICK-GRADE-005 works around it by deriving from the type set
  rather than by making `'manual'` creatable.

## Assessment type unification (2026-09-29)

Status: implemented (TICK-ASSESS-001 fast-forwarded to development, commit c29d36d0)

Implemented:

- Canonical 14-type list in `backend/src/modules/grading-scheme/constants/assessment-type.constants.ts` feeds `assessment.dto.ts`, `grading-scheme.dto.ts`, `grading-scheme.entity.ts` (no parallel redeclaration). Frontend derives `AssessmentType` + the `schemeTypes` filter in `assessments/new/page.tsx` from `assessment-builder/constants.ts`; duplicate allow-list removed; `AssessmentBadges` covers assignment/participation/behavior. 2 new specs pin the parity (14-list + DTO identity).
- `manual` untouched by design (legacy `AssessmentComponentType | 'manual'`) — recorded in FOLLOW_UPS.md; candidate follow-up ticket: remove leftover `type:'manual'` in frontend data-seeder and the legacy branch in `grade-core.service.ts:113`.
- Merge gate: rebased from stale `db689a1e` onto `3e03d728` (zero file overlap), then validated on development vs a pre-merge baseline — tsc error sets identical (be 20 / fe 17, 0 new), backend failures unchanged (8 pre-existing suites / 27 tests), +2 suites / +12 tests green, lint 0 errors. Builds left to CI (live dev servers hold `.next`/`dist`).

Open review findings (non-blocking, low): `ASSESSMENT_TYPES: readonly string[]` widens a former literal tuple (could be `readonly AssessmentComponentType[]`); type-only import cycle `types/educator/assessment.types.ts` ↔ `assessment-builder/constants.ts`.

## Performance work (2026-09-25 → 2026-09-26, 8 tickets merged to development)

Status: implemented (TICK-GRADE-004 merged to development after human sign-off — see below)

Implemented (all validated on development: backend unit suite holds at 25 pre-existing failures / same 5 suites, tsc pre-existing set only, builds green):

- TICK-INFRA-003 — Perf observability: env-gated Prisma query logging, finalize()-based request timing + statusCode, request-id wiring, DB-ping health check (merge 05e6778a).
- TICK-INFRA-004 — 21 hot-path indexes via new migration + @@index entries (incl. Enrollment unique, verified dup-free); CONCURRENTLY script for prod (merge 72a787a1).
- TICK-GRADE-003 — Grade batching, pure-overwrite semantics: parallel terms, hoisted invariants, Map lookups, chunked batch writes (merge 35f4fab2).
- TICK-INFRA-005 — Mechanical N+1 batching, 9 modules (transcript, attendance, grade-student, class, educator/student bulk, enrollment bulk, auto-lock, grade-lock validator) (merge e16965a6; educator/student email-domain conflicts resolved to development's role-prefix rule).
- TICK-INFRA-006 — Server pagination for audit/activity logs + notifications; 15s full-log poll removed; analytics via SQL groupBy/aggregate (merge ea66ee99).
- TICK-CLASS-001 — Eligibility/prerequisite batching + per-request scale memoization; EXPLAIN ANALYZE on scratch volume, no red flags (merge 8995b2fb).
- TICK-INFRA-007 — In-memory read cache (org/scales/settings/calendar TTLs). Redis/BullMQ parked: no Redis provisioned (merge a84deeae).
- TICK-INFRA-008 — Frontend: overfetch tracker wired, 30s timeout, memoized tables, list-default query freshness (merge 1ae40a1e).
- TICK-GRADE-004 — Bulk compute skips locked grades: `saveComputedGrades({ skipLocked: true })` used by both computeGrades paths (grade.service.ts, grade-educator.service.ts), reports `skippedLocked`. Merged after explicit human sign-off (merge dbb61e17). GRADE-003 stays pure-overwrite by design.
- TICK-INFRA-011 — Grading-scale batching spec tsc error fixed (cache double supplied; 30/30 green).
- TICK-INFRA-012 — Repaired corrupted `ProgramEnrollmentEndReason` enum value (`admin_correctionorganiz` → `admin_correction`) via metadata-only rename migration; verified live enum, rows untouched, student-enrollment suites green. Dev DB migrated; prod rollout is a separate human decision.
- TICK-INFRA-013 — Organization spec synced to `autoSeedNewSchoolYears` field (25/25 green).
- TICK-INFRA-009 — Broken `next build` on `src/app/admin/page.tsx` fixed (unused client-only imports removed; Turbopack errors gone). End-to-end build still stops at pre-existing semester type errors — follow-up needed.

On hold (needs human decision):

- Redis/BullMQ queues (no ticket yet — needs Redis provisioning + worker-topology/retry-policy decisions).
- Dirty working tree (16 files, level/section feature WIP, uncommitted as of 2026-09-27 — breaks level/section/school-year specs): another agent's active work, do not touch.

Known pre-existing debt (not from this work, flagged during merges):

- 27 backend unit failures in 8 suites (class, educator, level, meeting-gateway-rate-limit, program, registrar, school-year, semester — stale mocks vs evolved code; re-measured 2026-09-29, unchanged by TICK-ASSESS-001; was "25 in 5 suites" on 2026-09-26).
- `next build` red on src/app/admin/page.tsx (server component using useEffect/useRouter; commits 86a2abe6/454cff32).
- Backend e2e hooks time out in this environment (180s+); not usable as a merge gate here.
- `tsc --noEmit` on backend is red at baseline (pre-existing errors in class/semester specs, org-schedule toMinutes shadow, semester-template/seeder program_id drift, e2e fixtures). The phase5→6 stale-constructor error is fixed (TICK-INFRA-011 above).
- Junk file `et --hard b1f9964f0e64b173fc94e063a0c33895682fbba6` (Vim help text, 16KB) is tracked at repo root and already on origin/development (commit 1a4d8693) — artifact of a botched `git reset --hard` redirect.

## Frontend / Landing & Admin UI

Status: implemented

Implemented:

- TICK-INFRA-002 — Frontend mojibake normalization (— U+2014, – U+2013, … U+2026, → U+2192, − U+2212, ─ U+2500) across SolutionSection, ResourcesSection, ProgramLevelsSection, SchoolProfileCard, SeederCard — 5 files, 30 fixes, 0 `â` hits, lint/typecheck/build passed (merge 00dfabe0).
- TICK-ORG-001 — Organization schedule settings: OrgScheduleConfig (07:00-17:00/30, 15|20|25|30|45|60), GET/PUT /org-schedule-config strict 409, class.service bounds validation, Organization tabs + picker (merge 4d0d8f51, commit 3b1996c0).
- TICK-PLATFORM-001 — Missing React Query invalidations for resets/profile — ready-for-review (4ce84a30).

In progress:

- TICK-ACADEMIC-001 — Register student/academic-history on React Query factory
- TICK-ADMIN-001 — Admin querykeys cleanup
- TICK-GRADE-001 — Educator grades realtime

Not implemented:

- Billing/payments (not evidenced in repo per onboarder)

## <Domain A>

Status: not implemented

Implemented:

-

In progress:

-

Not implemented:

-

## <Domain B>

Status: not implemented
