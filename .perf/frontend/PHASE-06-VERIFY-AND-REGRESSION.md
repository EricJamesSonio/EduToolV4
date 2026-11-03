# Phase 06 — Verification and Regression

**Priority:** Required after every implementation batch  
**Risk:** Low to medium  
**Goal:** Prove that a batch produces a real improvement and preserves existing behavior.

Run the relevant checks after each batch. Phase 06 is not only a final step.

## Required commands

From `frontend/`:

```bash
npx tsc --noEmit --incremental false
npm run lint
npm test -- --runInBand
npm run build
npx next experimental-analyze
```

Run commands only during the appropriate execution phase. Record actual output and exit codes. Do not present historical results as newly executed checks.

## Measurement rules

- Capture a fresh baseline before the first implementation batch.
- Compare raw route-entry JS from generated manifests before and after each bundle-related batch.
- Inspect initial entry chunks separately from dynamically loaded chunks.
- Use the browser Network panel to confirm runtime chunk requests and API request counts.
- Raw manifest size and compressed browser transfer size are different measurements. Report which one is being used.
- Do not claim a size improvement from a dynamic import unless the targeted chunk actually leaves the intended entry or runtime path.

## Required regression checks

### Every batch

1. Inspect the diff; confirm only intended files changed.
2. Run typecheck, lint, relevant unit tests, and a fresh production build.
3. Record the exact commands and results.
4. Check for new warnings.
5. Confirm no generated `.next` file was edited manually.

### Admin routes

- Open `/admin/students`, `/admin/educators`, and `/admin/registrars`.
- Confirm initial route manifests no longer contain the Zod chunk after Phase 04A.
- Open each create dialog.
- Submit valid data.
- Submit invalid data and confirm validation messages.
- Simulate a server error.
- Check loading states.
- Close and reopen.
- Confirm list invalidation after success.

### Student hierarchy

- Open `/admin/students/[id]`.
- Confirm ReactFlow is absent from the initial entry after Phase 04B.
- Open the completion tab and hierarchy modal.
- Confirm the graph chunk loads on open.
- Verify nodes, edges, statuses, selection, and close behavior.
- Test direct and client-side navigation.

### Meetings

- Join and leave repeatedly.
- Toggle camera and microphone.
- Start and stop screen sharing.
- Stop sharing with the browser-native control.
- Confirm camera restoration.
- Force a screen-share failure and check recovery.
- Navigate away during initialization and while sharing.
- Rejoin.
- Confirm all owned tracks are closed.
- Verify chat, presence, reconnect, and authentication behavior if Socket.IO loading changed.
- Confirm non-meeting educator/student routes do not request the Socket.IO chunk.

### Notifications

- Record request counts with the dropdown closed and open for at least 60 seconds.
- Confirm unread count updates.
- Confirm mark-read and mark-all-read.
- Confirm pagination still works.
- Confirm no cross-user or cross-organization cache leakage.

### Landing and assets

- Measure guest landing load, including the `/auth/refresh` request.
- Test returning users with valid and expired sessions.
- Check LCP, CLS, initial JS, and responsive layouts.
- Confirm images, logos, and video posters render correctly.
- Confirm videos play, pause, and stop.
- Verify no 404s.

### Authentication and authorization

- First load with no token.
- First load with a persisted token.
- Valid refresh session.
- Expired refresh session.
- Login.
- Logout.
- Direct access to a protected route.
- Role-specific redirects.
- Organization isolation for cached queries.

## Known E2E baseline

The recorded E2E run has **15 passing tests and 1 failure**:

- File: `frontend/e2e/admin-setup.spec.ts`
- Location: line 1497
- Test: Phase 7b enrollment wizard
- Failure: class creation returned HTTP `409` instead of `201`

Record this baseline before implementation. If it changes, report the change separately from performance results. Do not describe it as a newly introduced performance regression unless the evidence shows otherwise.

## Completion report format

For each batch, report:

- Files changed.
- Why each change was selected.
- Behavior intentionally preserved.
- Exact checks run and pass/fail results.
- Fresh build duration and route totals.
- Before/after measurements, or an explicit statement that no measurement was available.
- Whether the target chunk left the initial entry.
- Known limitations and follow-up items.
- Whether the batch is safe to proceed from.

## Exit criteria

- No unresolved build or type errors.
- No known behavior regressions.
- Performance claims are measured or clearly labeled as unverified hypotheses.
- The known E2E baseline is documented consistently.
- The diff contains only the intended changes.
