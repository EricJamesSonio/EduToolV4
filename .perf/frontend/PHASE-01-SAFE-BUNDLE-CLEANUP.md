# Phase 01 — Safe Bundle Cleanup

**Priority:** High after baseline  
**Risk:** Low  
**Goal:** Verify that development-only tooling is already excluded from production, without introducing speculative provider refactors.

## Current state

The review confirmed that `frontend/src/app/providers.tsx` already:

- imports `ReactQueryDevtools` through `next/dynamic`;
- imports `DevDebugPanel` through `next/dynamic`;
- renders both only when `process.env.NODE_ENV === "development"`;
- keeps `QueryClientProvider`, `AuthProvider`, and the application tree eager.

The production manifest reportedly contains only an approximately 0.3 KB devtools stub. The meeting and notification work must not be mixed into this phase.

## Verification tasks

1. Inspect the current `frontend/src/app/providers.tsx` before changing anything.
2. Run a fresh production build.
3. Inspect the new production route manifests and chunks for dev-only tooling.
4. Confirm that no full React Query Devtools or debug-panel implementation is shipped to production.
5. Run the app in development and confirm:
   - React Query Devtools still appear;
   - the debug panel still appears;
   - provider ordering and behavior are unchanged.
6. Confirm that failed verification is the only reason to modify providers.

## Rules

- Do not refactor providers merely to change their structure.
- Do not move authentication or query initialization into a delayed component.
- Do not lazy-load tiny components without evidence that it helps.
- Do not introduce additional cleanup in this phase without a measured reason.
- Preserve provider ordering unless source tracing proves a change is safe.
- Check SSR/client-only constraints before using `ssr: false`.

## Validation

- Fresh production build and typecheck pass.
- Development tools work in development.
- Production output contains no full dev-tool implementation.
- The diff is limited to verification-related changes, if any.

## Exit criteria

- Dev-only tooling is confirmed absent from production.
- Development tooling still works.
- Any bundle-size claim is supported by the fresh build output.
- No broad provider or dependency cleanup was performed without evidence.
