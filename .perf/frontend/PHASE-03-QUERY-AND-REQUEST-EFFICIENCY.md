# Phase 03 — Query and Request Efficiency

**Priority:** High when duplicate requests or slow data loading are observed  
**Risk:** Medium  
**Goal:** Reduce unnecessary network traffic and loading waterfalls without changing freshness or correctness.

## Audit candidates

- `src/lib/query-client.config.ts`
- `src/hooks/useAppQuery.ts` and query-key factories, if present.
- `src/hooks/useAuthProfile.ts` and auth bootstrap logic.
- Repeated API calls from parent and child components.
- Queries that refetch on every mount or focus without a product reason.
- Mutations that invalidate too broadly, too narrowly, or multiple times.
- Components that fetch data sequentially when requests are independent.
- Large list queries without appropriate pagination or server-side filtering.

## Required analysis before edits

For every proposed change, identify:
- The query key and every known caller.
- Current `staleTime`, `gcTime`, retry, refetch, and `enabled` behavior.
- Whether the data is user-specific, organization-scoped, role-specific, or sensitive.
- Which mutations invalidate or update the query.
- Whether a stale result could display incorrect enrollment, grading, attendance, or organization data.
- Whether the request is already deduplicated by TanStack Query.

## Rules

- Do not set a global long `staleTime` merely to reduce requests.
- Do not change authentication bootstrap semantics without tracing refresh, logout, expired-token, and first-load flows.
- Do not change query keys casually; they are cache identity.
- Preserve organization/user isolation in keys and invalidations.
- Prefer removing demonstrated duplicate work over speculative cache tuning.
- Do not hide loading or error states to make the UI appear faster.

## Validation

- Build and relevant unit tests pass.
- Use browser network inspection or existing instrumentation to compare request counts and waterfalls.
- Test first load, revisit, refresh, logout/login, and switching organizations/users where supported.
- Verify mutations refresh all affected UI and do not expose cached data from another account or organization.

## Exit criteria

Each change has an evidence-based reason, correct invalidation, and a tested request/UX improvement.
