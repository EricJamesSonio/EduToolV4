# Remaining Phases — Analysis of Suggested Fixes

## Phase 02A — Meeting lifecycle correctness (`useAgoraRTC.ts`)

Suggested fix (track close/restore, screen-share failure recovery) is **directionally correct but high-risk**.

Evidence of real issues in source:
- `shareScreen()` calls `cameraTrack.stop()` but never `cameraTrack.close()` before unpublishing (line ~240), orphaning the camera track.
- On browser-native "track-ended", a new camera track is created and published, but the old (stopped) camera track may remain unclosed.
- Effect cleanup only closes `localVideoRef.current`; if that holds a screen track, an earlier camera track leaks.
- On screen-share failure after `client.unpublish(cameraTrack)`, recovery only logs; camera may stay unpublished.
- Cancellation checks exist but failure paths only `console.error`.

Verdict: fix is correct in intent. Confidence medium (need runtime device-leak validation). Risk high (device ownership, privacy indicators, rejoin). Do not change Agora subscription/screen-share semantics beyond cleanup. Requires two-participant manual testing; not implementable safely without validation infra.

## Phase 02B — Lazy Socket.IO

Suggested fix (dynamic import of `socket.io-client` inside connection effect, or gate provider mount) is **correct and feasible**.

Evidence:
- `useMeetingSocket.ts` line 2: `import { io, Socket } from "socket.io-client"` (static).
- Role layouts use `next/dynamic` for MeetingProvider, but loader chunk still pulls socket chunk (~47.5KB) at hydration.
- Socket is only used inside `useMeetingSocket`, which is consumed by meeting components; meeting provider is mounted on every portal route.

Verdict: prefer dynamic import inside the connection effect (smallest boundary) rather than gating the whole provider, to preserve context contract. Must trace all consumers first. Risk medium (presence/chat/reconnect). Confidence high for feasibility, medium for safety.

## Phase 03 — Notification polling

Suggested fix (gate feed while dropdown closed; keep summary polling for badge) is **correct**.

Evidence:
- `NotificationDropdown.tsx` calls both `useNotificationFeed()` and `useNotificationSummary()` unconditionally.
- Both poll every 30s (`POLL_MS`); feed is an infinite query so polling refetches all loaded pages.
- Summary also has `refetchOnWindowFocus: true`.
- Dropdown mounted globally via navbar/AppShell.

Verdict: gate the feed (disable polling while closed; fetch on open) while keeping summary polling for unread badge. Preserve query keys, invalidation, pagination. Risk medium (unread freshness). Confidence high.

Dashboard waterfall (optional): evidence present in `admin/dashboard/page.tsx` (school years → active year effect → analytics gates). Backend can resolve active year when omitted. Only proceed with HAR evidence; not bundled with notification fix.

## Phase 05A — Assets

Suggested fixes are **mostly correct but sizes are review findings until verified**.

Evidence:
- `public/badges/3-badge.png` is 2.27MB (confirmed).
- Videos: 10 files, ~124MB total (confirmed, top file 14MB).
- Landing sections use raw `<img>`? Need to verify per component; plan says hero uses raw img without dimensions/priority. Cannot confirm without reading each section.
- Logo 87KB at 2000×2000 displayed ~44px (per plan; verify).
- Fonts: 3 families, 13 weights in root layout (confirmed).

Verdict: resize logo, add image dimensions/priority, video posters + preload, font weight audit, and reference-check unused assets before deletion. Risk low-medium. Confidence medium (verify references before deleting).

## Phase 05B — Landing client boundaries & auth gate

Suggested fix (convert static sections to server components; isolate auth redirect) is **a hypothesis, not yet confirmed**.

Evidence:
- `page.tsx` is `"use client"` and imports all 12 landing sections eagerly.
- Blocks rendering on `isLoading` (auth bootstrap); guest triggers `/auth/refresh` which fails before loading ends.
- All 11 section files start with `"use client"` (confirmed).

Verdict: cannot convert sections to server components without tracing each for hooks, browser APIs, context, event handlers. The plan correctly labels this as investigation-first. Risk medium-high (auth semantics, SEO, no flash of protected content). Do not change auth bootstrap/refresh without full flow validation.

## Overall conclusion

- 04A/04B (done): correct and low-risk.
- 02B and 03: correct approach, medium risk, implement after tracing.
- 02A: correct intent, high risk, requires device/rejoin testing.
- 05A: correct, but verify asset references and image usage first.
- 05B: hypothesis only; trace before any conversion.