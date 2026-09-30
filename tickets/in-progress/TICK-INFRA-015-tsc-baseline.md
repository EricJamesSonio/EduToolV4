# TICK-INFRA-015 — Clear red `tsc --noEmit` baseline on development

Status: ready-for-review
Priority: high
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Branch: development (owner-directed; no feature worktree — see Notes)
Commit: 4d6e2dba

## Problem

`backend` `tsc --noEmit` is red on `origin/development` with ~18 errors across
10 files. CI gates on it (`backend-typecheck` -> `ci-gate`), so the typecheck job
is already failing upstream and **any** new ticket cannot be merged green.

Full baseline captured on `development` @ `6d45029f`:

```
concern/student/concern-student.service.ts(53,18)  TS18047 'concern' is possibly 'null'
level/__TEST__/level.service.spec.ts(64,21)       TS2339 'updateDefaults' missing on LevelService
level/level.service.ts(36,9)                       TS2393 Duplicate function implementation
level/level.service.ts(116,9)                      TS2393 Duplicate function implementation
level/level.service.ts(119,56)                     TS2339 'name' missing on UpdateLevelDto
org-schedule-config/org-schedule-config.service.ts(13,32) TS2440 import conflicts with local 'toMinutes'
school-year/TEST/school-year.service.spec.ts(51,15)       TS2554 Expected 9 args, got 6
semester/__TEST__/semester.service.spec.ts(36,15)         TS2554 Expected 2 args, got 1
subject/__TEST__/subject.service.spec.ts(28,15)           TS2554 Expected 2 args, got 1
seeds/backfill-missing-display-ids.ts                    TS2339 x6 on JsonObject | JsonArray
seeds/domain/seeders/classes.seeder.ts(69,9)              TS2322 'program_id' missing (required)
test/lane1-item9-enrollment-auto-unenroll.e2e-spec.ts(128,9) TS2322 'program_id' missing
test/support/late-enrollment.fixture.ts(201,5)           TS2322 'program_id' missing
```

The `org-schedule-config.service.ts` TS2440 is already documented as a genuine
pre-existing bug in TICK-INFRA-011's Notes ("deserves its own ticket"). This is it.

The `program_id` cluster is fallout from migration
`20260925113449_add_semester_program_scope`, which made `Semester.program_id`
required. Three call sites were never updated.

## Goal

1. `npx tsc --noEmit -p tsconfig.json` reaches **0 errors** on the feature branch.
2. Fix root causes, not casts. No `as any` / `@ts-ignore` to silence a real defect.
3. No behavior change. These are compile errors; the runtime behavior today is
   whatever the surviving code says, and it must not shift.

## Relevant Areas

- backend/src/modules/org-schedule-config/org-schedule-config.service.ts
- backend/src/modules/level/level.service.ts + __TEST__/level.service.spec.ts
- backend/src/modules/concern/student/concern-student.service.ts
- backend/src/seeds/backfill-missing-display-ids.ts
- backend/src/seeds/domain/seeders/classes.seeder.ts
- backend/test/support/late-enrollment.fixture.ts
- backend/test/lane1-item9-enrollment-auto-unenroll.e2e-spec.ts
- backend/src/modules/{semester,subject,school-year}/**/__TEST__ specs

## Acceptance Criteria

- [x] `npx tsc --noEmit -p tsconfig.json` exits clean (0 errors) — verified, 18 -> 0
- [x] `npx eslint` (no --fix) clean on all touched files — verified
- [x] Full backend unit suite shows no new failures vs baseline
- [x] `toMinutes` imported once; local duplicate removed
- [x] `Semester.program_id` supplied at all three sites, from real program context
- [x] No `@ts-ignore` / `@ts-expect-error` / new `as any` introduced

## Confidence

- Score: 92%
- Verified by measurement, not inspection alone:
  - `tsc --noEmit`: 18 errors -> 0 errors
  - Unit suite before vs after, same commit, same ignore patterns: **identical**
    (7 failed suites / 24 failed tests / 964 passed, same 7 suite names)
- The 7 failing suites are pre-existing at HEAD and NOT introduced here. Two of
  them are already declared expected-fail in CI (`subject-prerequisite-proof`,
  `grade-lock-proof`); the other five were verified pre-existing by stashing this
  work and re-running against pristine HEAD.
- Raising the remaining 5 out of scope: they are behavioural failures, not
  compile errors, and belong in their own tickets.

## Tests

- Targeted: level / semester / subject / school-year / concern /
  org-schedule-config suites — unchanged pass/fail vs baseline
- Full: `npx jest` — 7 pre-existing failing suites, identical set and count
- Baseline proof method: `git stash push -- backend`, run jest, `git stash pop`,
  re-run jest with identical args. Same 7 suites fail in both runs.
- Typecheck: `npx tsc --noEmit -p tsconfig.json` -> no output

## Blocker

None.

## Activity Log

2026-09-30 — Filed while planning the automated class generator (auto-class/).
Every phase of that plan requires a green `tsc`, so this baseline repair goes first.
Captured the error list from a real `tsc --noEmit` run on `development` @ 6d45029f
rather than trusting prior notes.

2026-09-30 — Implemented (4d6e2dba). Root causes, not casts:
- TS2440 `toMinutes`: removed the local duplicate, kept the import.
- TS2393 in `level.service.ts`: a bad merge left two `updateOne` bodies. The
  second read `dto.name`, which `UpdateLevelDto` does not declare, so the first
  definition silently won at runtime. Removed the stale one and restored
  `updateDefaults` (present in history, exercised by the spec).
- TS2322 `program_id`: fallout from `20260925113449_add_semester_program_scope`.
  Added at all three sites from real program context; the seeder also passes
  `template_semester_id`.
- TS2339 on JSON metadata: Prisma types `metadata` as `JsonValue`, whose union
  includes `JsonArray`. An array is still `typeof 'object'`, so a type predicate
  cannot exclude that branch — the narrowed union keeps it and every property
  read errors. Replaced the predicate with a function returning the narrowed
  type outright.
- TS18047 `concern`: explicit error instead of a null dereference.

2026-09-30 — Incident during verification: a baseline comparison worktree used a
`node_modules` junction, and `git worktree remove` followed it and deleted the
real `backend/node_modules`. Recovered with `npm ci` + `npx prisma generate`
(restored to a working state, lockfile unchanged). Re-ran all verification
afterwards using the local binaries rather than `npx` — the `npx` path had
silently resolved to a decoy `tsc` package and an npx-cache jest.

## Commits

- 4d6e2dba — fix(infra): clear red tsc --noEmit baseline (18 errors -> 0)

## Notes

Out of scope here, deliberately: the `Subject` model has no `school_year_id` and no
`deleted_at`, which the auto-class plan's decision D3 assumes otherwise. That is a
schema/design question for the generator work, not a compile fix.

Owner directed that this land directly on `development` rather than a feature
worktree, so the usual per-ticket branch was not used. Committed only the 10
backend files; other uncommitted work in the tree was left untouched.

