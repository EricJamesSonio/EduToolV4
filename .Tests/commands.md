# Test Commands Reference — EduToolV4

## Backend — Unit Tests (Jest)

Run from `backend/`

```bash
# All unit tests
npm test

# Single spec file
npx jest grade-core.service.spec.ts
npx jest src/modules/grade/__TEST__/grade-core.service.spec.ts

# Verbose (clean per-it() pass/fail lines, no stack-trace noise)
npx jest grade-core.service.spec.ts --verbose

# Watch mode (reruns on file change)
npm run test:watch

# Coverage report
npm run test:cov
```

## Backend — E2E Tests (Jest, real DB)

Run from `backend/`. Requires `DATABASE_URL` pointed at a real dev/test Postgres — these are non-mocked and write real data.

```bash
# All e2e tests
npm run test:e2e

# Single e2e spec
npx jest --config ./test/jest-e2e.json cross-semester-destruction.e2e-spec.ts
```

## Frontend — Playwright E2E

Run from `frontend/`. Config assumes backend on `:5000` and frontend on `:3000` (`reuseExistingServer: true` — start both manually first for faster runs, or let Playwright boot them).

```bash
# Headless (default)
npx playwright test

# Headed (visible browser) — macOS/Linux
HEADED=1 npx playwright test

# Headed — Windows PowerShell
$env:HEADED=1; npx playwright test

# Headed — Windows cmd
set HEADED=1 && npx playwright test

# Run one spec file
npx playwright test admin-setup.spec.ts

# Interactive UI mode (step through, inspect DOM at each step)
npx playwright test --ui

# Headed + pause at first step (Playwright Inspector)
npx playwright test --debug

# View HTML report (screenshots/video/traces from last run)
npx playwright show-report
```

## Notes

- Backend unit/e2e proof tests for known Critical-tier bugs (items 1–5, grading/grade-lock/seeder/prerequisites) are **expected to fail** — red output confirms the bug is still present, not a broken test.
- Playwright's `trace: 'on-first-retry'` and `video: 'on'` are already configured — failed runs auto-capture debugging artifacts, viewable via `show-report`.
