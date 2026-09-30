# Changelog

<!-- Newest entries at the top. -->

## 2026-09-30

### Fixed

- Manual-only assessment types no longer selectable under System-Graded, and True/False no longer generates as Multiple Choice (TICK-ASSESS-005, `f378f39c`): two defects, one root cause — no single source of truth for which types the AI can auto-grade. `SYSTEM_GRADABLE_TYPES` / `MANUAL_ONLY_TYPES` / `isSystemGradable()` (derived from the enum, complement computed) now answer it, and the backend rejects a manual-only type with system/hybrid mode on both `create` and `generatePreview`; the wizard filters the picker by grading mode and `Step3`'s hardcoded `["quiz","activity","exam","custom"]` fallback (a 5th divergent list) is gone. The T/F bug was a string mismatch — the wizard sent `true_or_false` while the AI layer keyed on `true_false`, and an unchecked `as QuestionBlueprint['type']` cast let it compile, then fail at runtime when the prompt-builder lookup missed and **silently fell back to the identification format**; unified on `true_or_false`, replaced both casts with a throwing `toAiQuestionType()`, made `buildChunkPrompt` throw instead of falling back, and fixed the `TOKEN_COST` key (it was falling back to 150, corrupting chunk sizing). **No migration** — verified against the live dev DB that `Question` has zero `true_false`/`true_or_false` rows and the one `behavior` assessment is already `grading_mode='manual'`, so the fix prevents new bad rows rather than repairing old ones.
- Behavior/Participation/Performance/Attendance are now scored directly on the Grades page (TICK-GRADE-005, `f877f96f`): the click-to-edit `ManualCell`, the `PATCH .../manual` endpoint, the `ManualScore` upsert and the grade math all already existed — the wiring gap was two bugs. **(1)** Editable columns were derived from categories that *already had a score* (`manualScore !== null`), so a score needed a column and a column needed a score: the Behavior cell was a permanent un-editable `—`. `DefaultGradeTable` and `CleanGradeTable` now derive columns from the grading scheme. **(2)** `category.type === 'manual'` was the only thing routing a manual score into the grade, across 7 call sites — but schemes persist `type='behavior'`, so a saved Behavior score was silently ignored and its weight dropped from the average. `isManualScoredCategory()` now derives the manual set from the canonical types and still honors the legacy `'manual'` literal. Per-category cap added: `max_score` when set, else the category weight (Behavior at 20% renders `Behavior /20`), enforced in the cell *and* authoritatively server-side, which also rejects unknown categories so no orphan `ManualScore` row can be created.

### Changed

- The duplicate `SYSTEM_GRADABLE_TYPES` / `MANUAL_ONLY_TYPES` declarations left by the two parallel branches were collapsed to one set when GRADE-005 merged into development; the doc comment now describes both bugs the split fixes.

### Merge validation

- Both tickets merged to `development` (ASSESS-005 fast-forward `f378f39c`; GRADE-005 merge commit `f877f96f`). Baseline captured on a fresh `verify-merge` worktree before merging — BE 86 suites / 888 tests with 9 failing, `tsc` 20; FE 17 suites / 167 tests — vs after: BE 88 / 951 with the **same 9 pre-existing failures, 0 new**, `tsc` 20 (none in touched files); FE 19 / 199. **Zero regressions; +63 backend and +32 frontend tests passing.** The predicted duplicate-constant conflict materialized and was resolved by hand. Not verified: a browser click-through of the Grades page — the bootstrap bug was diagnosed from source, not reproduced.

## 2026-09-29 (evening)

### Changed

- Grading-scheme category names auto-derive from the selected type (TICK-ASSESS-004, fast-forward 60eb7e58): picking `behavior` now fills Name with "Behavior", rows created by **Add Category** arrive pre-filled, and a hand-typed name is never overwritten (a name counts as auto while it's empty or still a canonical label). The rule lives once in the shared `GradingSchemeComponentRow` (`labelForType` / `isAutoName`) with 7 seeding sites across all 4 editors (admin scheme editor, class editor, new-template dialog, shared template dialog); the Name input also gained `aria-label="Category name"` — its visible label had no `htmlFor`, so it was unlabeled for assistive tech. Validation on the worktree branch: targeted spec 6/6, frontend 12 suites / 108 tests green (development baseline 11 / 102), lint 0 errors, `tsc` 17/17 parity with baseline (0 new, none in touched files).

## 2026-09-29

### Fixed

- Assessment type allow-list unification (TICK-ASSESS-001, fast-forward c29d36d0): new single source of truth `backend/src/modules/grading-scheme/constants/assessment-type.constants.ts` (14 types incl. assignment/participation/behavior) now feeds `assessment.dto.ts`, `grading-scheme.dto.ts`, `grading-scheme.entity.ts`; frontend derives `AssessmentType` and the `new/page.tsx` `schemeTypes` filter from `assessment-builder/constants.ts` (duplicate allow-list deleted); `AssessmentBadges` renders the 3 previously-missing types. `manual` left untouched (legacy `AssessmentComponentType | 'manual'`, logged in FOLLOW_UPS.md). Branch was 140 commits stale → rebased onto `3e03d728` first (zero file overlap, clean rebase).
- Merge validation on `development` (lint/tsc/jest; builds deferred to CI — live dev servers own `.next`/`dist`): backend 81 suites/858 tests with failures byte-identical to pre-merge baseline (8 pre-existing suites / 27 tests: class, educator, level, meeting-gateway-rate-limit, program, registrar, school-year, semester), +2 suites / +12 tests all green; frontend 11/102 green; lint 0 errors both sides; `tsc` error sets identical to baseline (backend 20, frontend 17, **0 new**).

## 2026-09-27 (evening)

### Fixed

- Broken `next build` on `src/app/admin/page.tsx` (TICK-INFRA-009, fast-forward 171be060): removed unused `useEffect`/`useRouter` imports; Turbopack errors eliminated. NOTE: end-to-end build still stops at pre-existing semester type errors (semester.api `programId`, SemesterFormDialog Select signatures — another agent's in-flight rework) — follow-up needed, not this ticket.

## 2026-09-27

### Fixed (verification follow-up — 3 tickets merged, each validated on development)

- Bulk compute skips locked grades (TICK-GRADE-004, merge dbb61e17): opt-in `{ skipLocked: true }` now default in both computeGrades paths; locked-row spec 3/3. Merged after explicit human sign-off.
- Grading-scale batching spec tsc error (TICK-INFRA-011, fast-forward 2b51620b): cache double supplied; grading-scale suites 30/30, error gone.
- Corrupted `ProgramEnrollmentEndReason` enum value (TICK-INFRA-012, merge 624ada61): another agent's migration had shipped `'admin_correctionorganiz'` to schema + live DB; repaired via metadata-only `ALTER TYPE … RENAME VALUE` migration, verified live enum labels, rows untouched, student-enrollment suites green.
- Organization spec drift (TICK-INFRA-013, merge 62446907): expectations synced to `autoSeedNewSchoolYears` field; suite 25/25.

### Held / flagged (not merged, not started)

- Redis/BullMQ queues: parked pending Redis provisioning + topology/policy decisions (no ticket yet).
- Dirty working tree (level/section feature WIP, uncommitted, breaks level/section/school-year specs): another agent's active work — do not touch.

## 2026-09-26

### Performance (8 tickets merged to development, each validated: unit suite at 25 pre-existing failures / same 5 suites, tsc pre-existing set, builds green)

- Perf observability (TICK-INFRA-003, merge 05e6778a): env-gated Prisma query logging, error-inclusive request timing, request-id wiring, DB-ping health check.
- Hot-path indexes (TICK-INFRA-004, merge 72a787a1): 21 indexes incl. Enrollment unique (dup-free); CONCURRENTLY script for prod.
- Grade batching, pure overwrite (TICK-GRADE-003, merge 35f4fab2): parallel terms, Map lookups, chunked batch writes. Locked-skip behavior split to TICK-GRADE-004 (held).
- Mechanical N+1 batching (TICK-INFRA-005, merge e16965a6): 9 modules; email-domain merge conflicts resolved to development's role-prefix rule.
- Pagination + SQL aggregation (TICK-INFRA-006, merge ea66ee99): server-paged logs/notifications, analytics groupBy/aggregate; fixed pre-existing broken educator activity-log unwrapping.
- Eligibility batching (TICK-CLASS-001, merge 8995b2fb): batched structures/scales/prereqs + memoization; EXPLAIN ANALYZE clean on scratch volume (dropped after).
- In-memory read cache (TICK-INFRA-007, merge a84deeae): org/scales/settings/calendar TTLs. Redis/BullMQ parked (no Redis provisioned).
- Frontend cleanup (TICK-INFRA-008, merge 1ae40a1e): overfetch tracker wired, 30s timeout, memoized tables, list-default freshness.

### Held / flagged (not merged)

- TICK-GRADE-004 — bulk compute skips locked grades: MERGED after human sign-off (dbb61e17). `saveComputedGrades({ skipLocked: true })` on both computeGrades paths; reports `skippedLocked`. Locked-row spec 3/3.
- Redis/BullMQ queues: parked pending Redis provisioning + topology/policy decisions (no ticket yet).
- Pre-existing: `next build` red on src/app/admin/page.tsx (server component using client hooks); backend e2e hooks time out in this environment.

## 2026-09-01

### Fixed

- Admin Students filter controls (hierarchy cascade, search + status, review + warning) stacked vertically one-per-row on small screens — now flexible `flex-1 min-w-*` items that line up 2–3 per row on mobile and snap back to the original fixed widths at `sm+` (TICK-STUDENT-001.
- Pre-existing flaky API client overfetch test: `trackCall`/dedup guard only ran when `process.env.NODE_ENV === 'development'`, but Jest locks it to `'test'` (silent no-op,, so the test never exercised the warn path — now also enabled under `'test'` (production unaffected`, fixing the failing `client.test.ts` "warns on overfetch" (same ticket,.

### Tickets

- TICK-STUDENT-001 — Admin Students filter responsive mobile layout — merged (merge 28570e45, commits 6c244e4e fix(admin:…), 28570e45 fix(api:…)..

 See also TICK-ORG-001 (below,) TICK-INFRA-002, TICK-PLATFORM-001.



## 2026-08-27

### Added

- Organization schedule settings as tab on Organization page: global 07:00-17:00/30 (durations 15,20,25,30,45,60), preview slots, strict blocking on update if any ClassSchedule out-of-bounds/misaligned, ClassSchedulePicker now drives grid from config (TICK-ORG-001).

### Tickets

- TICK-ORG-001 — Organization schedule time-range settings (global) — merged (merge 4d0d8f51, commit 3b1996c0)
- TICK-PLATFORM-001 — Fix missing React Query invalidations — ready-for-review (4ce84a30)

### Commits

- 3b1996c0 feat(org): add global schedule time-range settings as Organization tab
- 4d0d8f51 merge(agent): TICK-ORG-001 org schedule settings

## 2026-08-26

### Fixed

- Frontend mojibake normalization: corrected UTF-8 double-encoded glyphs (— U+2014, – U+2013, … U+2026, → U+2192, − U+2212, ─ U+2500) across 5 files (SolutionSection, ResourcesSection, ProgramLevelsSection, SchoolProfileCard, SeederCard) — 30 hits, 0 remaining `â` (TICK-INFRA-002).

### Tickets

- TICK-INFRA-002 — Fix frontend mojibake (em dash, en dash, ellipsis, arrow) — completed (merge 00dfabe0 + fdad3e40)

### Commits

- fdad3e40 fix(frontend): normalize mojibake glyphs to correct UTF-8 (5 files, 30 insertions, 30 deletions)
- 00dfabe0 merge(agent): TICK-INFRA-002 fix frontend mojibake

## YYYY-MM-DD

### Added

-

### Fixed

-

### Changed

-

### Tickets

-

### Commits

-
