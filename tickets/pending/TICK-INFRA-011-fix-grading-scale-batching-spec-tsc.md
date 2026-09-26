# TICK-INFRA-011 — Fix TS2554 in grading-scale-batching.spec.ts (stale ctor after cache refactor)

Status: pending
Priority: medium
Created: 2026-09-26
Created by: agent
Assigned to: unassigned
Worktree: (filled in when claimed)
Branch: (filled in when claimed)

## Problem

`backend/src/modules/grading-scale/__TEST__/grading-scale-batching.spec.ts`
line 12 fails `tsc --noEmit` with:

```
error TS2554: Expected 2 arguments, but got 1.
  return { repo: new GradingScaleRepository(db as never), db };
```

Root cause is a cross-ticket ordering slip, not a defect in either ticket:

- `7e57241b` (perf phase5) added `grading-scale-batching.spec.ts`, constructing
  the repo with a single argument.
- `5257dc82` (perf phase6, TICK-INFRA-007) added a second constructor parameter
  to `GradingScaleRepository`:
  `constructor(private readonly db: DatabaseService, private readonly cache: AppCacheService) {}`
- The spec was never updated. Its sibling `grading-scale-caching.spec.ts` WAS
  updated correctly to `new GradingScaleRepository(db as never, cache as never)`.

The error is type-only: the spec still PASSES at runtime (the `cache` param is
`undefined`, but that test path never touches the cache), so the unit suite
reports green and the failure is invisible to test-count checks. Only
`tsc --noEmit` catches it.

Verified by diffing `tsc --noEmit` output between a clean baseline worktree at
`origin/development` (9 errors) and the pushed tip (8 errors):

```
NEW vs baseline:
  src/modules/grading-scale/__TEST__/grading-scale-batching.spec.ts(12,20)   <-- this ticket
  src/modules/org-schedule-config/org-schedule-config.service.ts(13,32)      <-- pre-existing, line 9 -> 13 only
FIXED vs baseline:
  src/modules/semester-template/semester-template.service.ts(116,13)
  src/modules/semester-template/semester-template.service.ts(291,9)
```

Note: backend `tsc --noEmit` is red at baseline (9 errors on
`origin/development`), so CI `backend-typecheck` / `ci-gate` are already red
upstream. This push reduces the count 9 -> 8. This ticket removes the one
error attributable to the perf work.

## Goal

1. `grading-scale-batching.spec.ts` typechecks cleanly.
2. Match the pattern already used by `grading-scale-caching.spec.ts` (pass a
   cache double) rather than casting the error away.
3. Audit the rest of the phase5/6 specs for the same stale-constructor class of
   error so this does not recur.
4. Do not attempt to fix the other 7 pre-existing tsc errors — out of scope.

## Relevant Areas

- backend/src/modules/grading-scale/__TEST__/grading-scale-batching.spec.ts
- backend/src/modules/grading-scale/__TEST__/grading-scale-caching.spec.ts (reference pattern)
- backend/src/modules/grading-scale/grading-scale.repository.ts
- shared/skills/testing/MUST-HAVES.md; shared/rules/architecture.md

## Acceptance Criteria

- [ ] `npx tsc --noEmit -p tsconfig.json` error count drops by exactly 1 (8 -> 7)
- [ ] No new error introduced elsewhere
- [ ] The spec still passes at runtime and still asserts the same behavior
- [ ] A cache double is supplied (not suppressed with a cast)
- [ ] Other phase5/6 specs checked for the same staleness

## Confidence

- Score: not yet assessed (filed only, per explicit instruction not to start work)

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None. Not started — filed for triage only.

## Activity Log

2026-09-26 — Filed by agent during the TICK-GRADE-004 pre-push verification.
Found by building a clean baseline worktree at `origin/development` and
diffing `tsc --noEmit` output, rather than trusting a single run (a single run
cannot distinguish a pre-existing error from a new one when both live in files
the push also touched). Human decision at the time: push as-is and file, since
the push improves the aggregate 9 -> 8.

## Commits

(none yet)

## Notes

The `org-schedule-config.service.ts` TS2440 (`import` conflicts with a local
`toMinutes` function) is a genuine pre-existing bug — the import and the local
function are both present on `origin/development` at line 9; this push only
shifted it to line 13. It is listed here only so it is not mistaken for new
work; it deserves its own ticket if someone wants it fixed.