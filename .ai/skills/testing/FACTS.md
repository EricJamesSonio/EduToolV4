# Testing Skill — Facts

Last verified: 2026-08-26, commit 1f5fe24

## Stack

Unit/integration: Jest 30 (frontend jest.config.js via next/jest, jsdom; backend jest.config.js via ts-jest). Frontend setupFilesAfterEnv jest.setup.ts, moduleNameMapper @/→src/. Tests matched as __tests__/*.test.ts or *.spec.ts (see backend/src/modules/__TEST__ patterns). Backend e2e: Jest with test/jest-e2e.json.
E2E: Playwright 1.62.1 (see frontend/playwright.config.ts, scripts test:e2e, test:e2e:headed cross-env HEADED=1). Excludes e2e/ from Jest (testPathIgnorePatterns).

## Project-specific notes

- Frontend unit tests import @tanstack/react-query — wrap with QueryClientProvider and queryKeys factory. See frontend/src/hooks/__tests__/useRole.test.tsx example.
- No custom test harness beyond Jest + Testing Library (frontend) / @nestjs/testing (backend).
