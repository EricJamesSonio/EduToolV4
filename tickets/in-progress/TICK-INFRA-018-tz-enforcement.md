# TICK-INFRA-018 — Timezone Step 5 enforcement (lint bans, CI matrix, TZ defaults)

Status: in-progress
Priority: high
Created: 2026-10-08
Created by: agent
Assigned to: agent
Started: 2026-10-08
Worktree: ../EduToolV4-worktrees/TICK-INFRA-018-tz-enforcement
Branch: agent/TICK-INFRA-018-tz-enforcement

## Problem

TICK-INFRA-017 (merged) made the codebase timezone-independent by design,
but nothing stops the next commit from reintroducing `new Date(str)` on an
instant or a local `getDay`. Enforcement (original task Step 5) is missing:
no lint bans, no CI timezone matrix, dev machines still run in Manila time.

## Goal

1. ESLint bans (both apps, extending `eslint.config.mjs`): the unsafe set
   (`new Date(string|non-literal)`, `Date.parse`, `parseISO`, local
   get/set date parts, `toLocale*String`, `date-fns format()`,
   `toISOString().split`) is an **error in migrated files** (the TICK-INFRA-017
   file set) and a **warning everywhere else** (explicit allowlist backlog
   that shrinks as files migrate). The two `datetime.util` files are exempt
   (they implement the helpers). Every `eslint-disable` carries a reason.
2. CI timezone matrix: backend + frontend invariant suites under
   TZ=UTC, Asia/Manila, America/Los_Angeles, Pacific/Kiritimati.
3. Dev defaults: backend/frontend `dev` scripts run with TZ=UTC;
   backend Dockerfile sets `ENV TZ=UTC`.
4. Step 6 (bad-data counting/fixes) explicitly NOT in scope — held for a
   cutoff date.

## Relevant Areas

- shared/skills/testing/MUST-HAVES.md
- backend/eslint.config.mjs, frontend/eslint.config.mjs
- .github/workflows/ci.yml, backend/package.json, frontend/package.json
- backend/Dockerfile

## Acceptance Criteria

- [ ] `npx eslint` on both apps: 0 errors; warnings only on allowlisted files
- [ ] New violations in a migrated file fail lint (proven by test)
- [ ] CI config contains the 4-TZ matrix job
- [ ] Targeted invariant suites pass x4 TZs; tsc clean both apps

## Confidence

Score: 92/100 (Requirement 25, Codebase verification 23, Architecture 19,
Edge cases 12, Blast radius 13).
Gaps: exact CI job YAML shape unverified until read; proceeding — CI file
will be read before editing.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

- 2026-10-08: Claimed as TICK-INFRA-018 (counter 17 -> 18) per owner
  instruction (TZ Step 5 now, approved scope: bans as errors in migrated
  files + visible allowlist, CI matrix, dev/Docker TZ).

## Commits

None yet.

## Notes

Zone stays the single Manila constant (no per-org zone) — enforcement only.
