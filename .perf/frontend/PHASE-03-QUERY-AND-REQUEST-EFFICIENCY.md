# Phase 03 — Query and Request Efficiency

**Priority:** After Phase 02  
**Risk:** Medium  
**Goal:** Remove demonstrated unnecessary request work without changing cache correctness, authorization, or data freshness semantics.

The first target is notification polling. The dashboard waterfall is optional and must be justified with captured requests before any change.

## Priority finding — global notification polling

### Evidence

- `frontend/src/components/shared/NotificationDropdown.tsx` calls both `useNotificationFeed()` and `useNotificationSummary()` unconditionally.
- The dropdown is mounted through `frontend/src/components/layout/PortalNavbar.tsx` and `AppShell.tsx`, so it exists on every portal route.
- `frontend/src/hooks/useNotifications.ts` configures 30-second polling for both the summary and the infinite feed.
- The feed is an infinite query; a polling refetch can refetch all pages already loaded.
- The summary hook also has `refetchOnWindowFocus: true`.

This means a user who never opens the notification dropdown still causes recurring background requests while the portal tab is active.

### Investigation

1. Confirm the exact query keys, `enabled` conditions, and polling behavior in the current source.
2. Trace every caller of the summary and feed hooks.
3. Determine whether the unread badge can remain accurate with summary-only polling while the dropdown is closed.
4. Decide whether the feed should:
   - be disabled while closed and fetched on open; or
   - poll only while open; or
   - use a smaller polling policy that preserves current product behavior.
5. Verify that read, read-all, pagination, and cache invalidation still update the visible UI.

### Constraints

- Preserve unread-count freshness and existing read/read-all behavior.
- Preserve infinite-feed pagination and cache identity.
- Do not remove polling entirely without a product decision.
- Do not change global query presets or retry settings to compensate.
- Do not hide loading or error states.

### Validation

- Record the request count with the dropdown closed and open for at least 60 seconds before and after.
- Confirm the unread count updates after a simulated new notification.
- Confirm mark-read and mark-all-read update the list and badge.
- Confirm pagination still works after the feed has been gated.
- Fresh build and typecheck pass.

## Optional finding — dashboard request waterfall

### Evidence

`frontend/src/app/admin/dashboard/page.tsx`:

- loads school years first;
- selects the active year in an effect after the list resolves;
- only then enables analytics overview and enrollment queries;
- additionally gates both analytics queries on the organization query.

The backend can resolve the active school year when `schoolYearId` is omitted (`analytics.service.ts`), so an optimization may be possible.

### Rules before changing this

- Capture a HAR/network trace and confirm the waterfall is material.
- Trace query keys and callers if attempting to use the backend default.
- Avoid causing a duplicate request when the selected-year query key changes.
- Do not change the user-visible selected-year behavior.
- This is optional work and must not be bundled with the notification fix.

If the measurement does not show a meaningful delay, document the decision and leave the current behavior unchanged.

## Organization query clarification

The admin layout and the dashboard both call a query with the same organization-detail key. TanStack Query deduplicates this work. This is redundant caller code, not a confirmed duplicate network request. Do not count it as a performance win without a network trace.

## Out of scope

Authentication bootstrap and guest `/auth/refresh` behavior are investigated in Phase 05B. Do not change auth refresh, logout, expired-token, redirect, or authorization semantics here.

## Exit criteria

- Notification polling change is evidence-backed and preserves unread/read/pagination behavior.
- Before/after request counts are recorded.
- Any dashboard change is supported by a captured waterfall and does not introduce duplicate requests.
- No broad cache-preset, retry, query-key, or invalidation changes were made.
