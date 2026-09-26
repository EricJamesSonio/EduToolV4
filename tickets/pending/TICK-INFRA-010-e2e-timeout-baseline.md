# TICK-INFRA-010 — Backend/frontend e2e suites time out at baseline

Status: pending
Priority: high
Created: 2026-09-26
Created by: agent
Assigned to: unassigned
Worktree: (filled in when claimed)
Branch: (filled in when claimed)

## Problem

The e2e suites cannot complete in this environment, so they provide no signal
and cannot be used as a merge gate.

- Frontend: `frontend/playwright.config.ts` sets `timeout: 180_000` and boots
  two `webServer` entries (`npm run start:dev` in `../backend` and in the
  frontend, each with a 120s startup timeout). The single spec,
  `frontend/e2e/admin-setup-.spec.ts`, times out at baseline.
- Backend: `backend/package.json` defines
  `"test": "jest && jest --config ./test/jest-e2e.json --runInBand"`, so
  `npm test` runs the unit suite and then the e2e suite, which hangs. The unit
  suite must be run via `npx jest` directly to get a usable result.

CI already compensates for the known-bad e2e specs via
`E2E_PROOF_PATTERN` (cross-semester-destruction, late-enrollment-grading,
org-seeder), but the underlying environment problem is unaddressed.

Root cause is not yet diagnosed: candidates include Postgres not being
reachable/migrated in this environment, the backend dev server not binding
within the 120s window, or genuinely slow fixture seeding.

## Goal

1. Diagnose why the e2e suites time out at baseline.
2. Make at least one e2e path runnable locally (backend e2e preferred — it does
   not need a browser).
3. Make `npm test` in `backend` usable without a manual flag split, or document
   clearly that unit and e2e must be invoked separately.
4. Document the prerequisite local setup (DB, migrations, env) so the suites
   are reproducible.

## Relevant Areas

- frontend/playwright.config.ts
- frontend/e2e/admin-setup-.spec.ts
- backend/test/jest-e2e.json and backend/test/*.e2e-spec.ts
- backend/package.json (`test` script)
- .github/workflows/ci.yml (`backend-e2e-tests`, `E2E_PROOF_PATTERN`)

## Acceptance Criteria

- [ ] Root cause identified and documented
- [ ] Documented local prerequisites for running e2e
- [ ] At least the backend e2e suite runs to completion locally
- [ ] `npm test` behavior is unambiguous (either fixed or explicitly documented)
- [ ] No change to which specs CI treats as known-bad without a deliberate decision

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
Pre-existing and unrelated to the 43-commit push: `git log
origin/development..development -- frontend/e2e frontend/playwright.config.ts`
returns empty. Noted that this is why the verification used `npx jest`
directly for the backend unit baseline instead of `npm test`.

## Commits

(none yet)

## Notes

The agent that ran the TICK-GRADE-004 validation worked around this by
invoking the local jest binary directly (`.\node_modules\.bin\jest.cmd`) rather
than `npx jest`, which additionally avoids npx attempting a network fetch.