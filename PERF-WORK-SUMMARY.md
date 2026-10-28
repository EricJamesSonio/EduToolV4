# Frontend Performance Work — Session Summary

## What was implemented

Two low-risk bundle-splitting batches (Phase 04) were applied. No other phases were touched.

### Phase 04A — Defer admin create dialogs (Zod)

Converted static imports of the create dialogs to `next/dynamic` (ssr: false) so the ~265KB raw Zod chunk leaves the initial entry for three admin routes.

Files changed:

- `frontend/src/app/admin/students/page.tsx` — `CreateStudentDialog`
- `frontend/src/app/admin/educators/page.tsx` — `CreateEducatorDialog`
- `frontend/src/app/admin/registrars/page.tsx` — `CreateRegistrarDialog`

Preserved: existing `{createOpen && ...}` conditional mount, all props/callbacks, validation, loading/error behavior.

### Phase 04B — Defer ReactFlow hierarchy modal

Converted the static import of `SubjectHierarchyModal` to `next/dynamic` in `SubjectCompletionPanel.tsx`, removing the ~180KB raw ReactFlow chunk from the initial `/admin/students/[id]` entry. The graph loads only when the hierarchy modal opens.

File changed:

- `frontend/src/components/admin/student/detail/SubjectCompletionPanel.tsx`

## What was NOT changed

- Meeting lifecycle code (`useAgoraRTC.ts`) — untouched.
- Socket.IO loading (`useMeetingSocket.ts`, role layouts) — untouched.
- Notification/query code — untouched.
- Assets, landing page, auth bootstrap — untouched.
- No config, dependency, or generated `.next` output changes.

## Verification status

A fresh production build could not be completed in this session (the build process hung at "Creating an optimized production build..."). Typecheck was also not re-run successfully.

Please run locally from `frontend/`:

- `npx tsc --noEmit --incremental false`
- `npm run lint`
- `npm test -- --runInBand`
- `npm run build`
- `npx next experimental-analyze`

Then compare `.next/server/app/**/page_client-reference-manifest.js` to confirm the Zod chunk (`03f0ywctsn4hn.js`) and ReactFlow chunk (`17.0z-20w_-mb.js`) left the targeted initial entries, and that dialogs/modal still open and validate correctly.

## Remaining phases (not implemented)

02A meeting lifecycle correctness, 02B lazy Socket.IO, 03 notification/query efficiency, 05A assets, 05B landing/auth boundary — require investigation and validation before changes.

## What's left to do (suggested next steps)

### 1. Verify the completed batches (required first)

- Run build/typecheck/lint/tests locally (commands above).
- Confirm targeted chunks left the initial entries; record before/after raw route totals.
- Smoke-test: open/close each create dialog (valid, invalid, server error, reopen); open hierarchy modal (nodes/edges/statuses/selection/close); direct + client-side navigation.

### 2. Phase 02A — Meeting lifecycle correctness (high risk, investigation first)

- File: `frontend/src/hooks/meeting/useAgoraRTC.ts`.
- Fix track ownership: close (not just stop) replaced camera tracks; close earlier camera track when screen sharing; restore camera on failure; single cleanup path for browser-native and app stop.
- No bundle claim. Requires two-participant manual testing (join/leave, camera/mic toggle, screen share start/stop, browser-native stop, camera restore, forced failure, navigate-away-during-init, rejoin, no device leaks, remote view).

### 3. Phase 02B — Lazy Socket.IO (medium risk)

- File: `frontend/src/hooks/meeting/useMeetingSocket.ts` (static `socket.io-client` import) + role layouts.
- Dynamically import `socket.io-client` inside the connection effect after tracing all consumers; preserve presence/chat/reconnect/cleanup. Confirm non-meeting educator/student routes no longer request the socket chunk.

### 4. Phase 03 — Notification polling (medium risk)

- Files: `frontend/src/hooks/useNotifications.ts`, `frontend/src/components/shared/NotificationDropdown.tsx`.
- Gate the infinite feed while the dropdown is closed (fetch on open); keep summary polling for the unread badge. Preserve query keys, invalidation, pagination.
- Record 60s request counts closed vs open before/after. Dashboard waterfall is optional and only with HAR evidence.

### 5. Phase 05A — Low-risk assets (low-medium risk)

- Resize logo to largest displayed size; add explicit width/height (or aspect-ratio) to hero images and priority where appropriate.
- Add video posters and suitable preload; do not autoplay large videos.
- Audit font weights (Kodchasan/JetBrains Mono/Plus Jakarta Sans) before trimming.
- Reference-check unused assets (`/badges/3-badge.png` ~2.27MB, `/edutool-yellow2.png`) before deleting.

### 6. Phase 05B — Landing client boundaries & auth gate (medium-high risk, hypothesis only)

- File: `frontend/src/app/page.tsx` + `frontend/src/components/landing/*`.
- Trace each section for hooks, browser APIs, context, event handlers before converting any to a server component.
- Investigate isolating the auth redirect into a small client boundary and avoiding blocking first paint on `/auth/refresh` for guests.
- Do not change auth bootstrap/refresh/logout/redirect/authorization semantics without full flow validation. No global removal of `"use client"`.

### 7. Phase 06 — Final verification

- Re-run all commands; record route totals, network journeys, and the known E2E baseline (15 pass / 1 fail at `e2e/admin-setup.spec.ts:1497`, HTTP 409). Report any change separately.
