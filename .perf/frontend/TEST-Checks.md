npx tsc --noEmit --incremental false    # TypeScript check
npm run lint                           # ESLint
npm test -- --runInBand                # All unit tests
npm run build                          # Full Next.js build
npx next experimental-analyze          # Bundle analysis

npx jest src/__tests__/phase3-notification-gating.test.ts --no-coverage
npx jest src/__tests__/phase4a-dialog-dynamic-imports.test.ts --no-coverage
npx jest src/__tests__/phase4b-subject-hierarchy-modal.test.ts --no-coverage
npx jest src/__tests__/phase5b-landing-server-components.test.ts --no-coverage
npx jest src/__tests__/phase3-5-master-verification.test.ts --no-coverage

npx jest --testPathPattern "phase3-5-master" --no-coverage
