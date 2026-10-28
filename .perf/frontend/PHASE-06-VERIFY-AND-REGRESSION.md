# Phase 06 — Verification and Regression

**Priority:** Required after every implementation phase  
**Risk:** Low–Medium  
**Goal:** Make sure changes produce a real improvement and preserve existing functionality.

## Required checks for each batch

1. Inspect the final diff and confirm only intended files changed.
2. Run the production build and require both compilation and TypeScript/type generation to pass.
3. Run relevant unit, integration, or E2E tests available in the repository.
4. Smoke-test the affected user journey manually.
5. Compare the relevant metric before and after when possible.
6. Record known limitations and exact commands/results.
7. If checks fail, fix or revert the current batch before starting another.

## Representative routes and flows

The agent should adapt this list to actual repository behavior:
- Public landing page and public enrollment routes.
- Admin dashboard and one data-heavy admin route.
- Educator dashboard/class workflow.
- Student portal and a data-heavy student route.
- Authentication bootstrap, refresh, and logout/login.
- Meeting join/leave, media toggles, remote media, and screen share.
- Navigation between routes and direct loading of nested routes.

## Metrics to collect when tooling permits

- Initial JavaScript transferred and parsed.
- Route-specific JavaScript chunks.
- Largest Contentful Paint (LCP).
- Interaction to Next Paint (INP), where field/lab data is available.
- Cumulative Layout Shift (CLS).
- Number and duration of API requests on first load.
- Time to interactive readiness for meeting routes.
- Build duration, recorded separately from runtime performance.

## Completion report format

For each phase, report:
- Files changed.
- Why each change was selected.
- Behavior intentionally preserved.
- Checks run and exact pass/fail results.
- Before/after measurements, or explicitly state that no measurement was available.
- Risks or follow-up items.
- Whether the phase is safe to proceed from.

## Exit criteria

No unresolved build/type errors. No known behavior regressions. Performance claims are measured or clearly labeled as unverified.
