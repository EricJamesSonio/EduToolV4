# Phase 02 — Meeting-Only Dependencies

**Priority:** High if meeting code contributes to initial load  
**Risk:** Medium–High  
**Goal:** Keep real-time meeting SDK code off routes that do not use meetings while preserving reliable join/leave and media behavior.

## Known candidates

- `src/hooks/meeting/useAgoraRTC.ts`
- `src/hooks/meeting/useMeetingSocket.ts`
- Meeting components and their import chains, to be discovered from the repository.

The shared `useAgoraRTC.ts` version dynamically imports `agora-rtc-sdk-ng` when meeting credentials are available. The latest version must be verified against the installed SDK typings and actual meeting flows before it is considered complete.

## Audit first

Trace where meeting hooks and components are imported. A dynamic import inside a hook does not necessarily remove every meeting-related component or dependency from every route if those modules are statically imported elsewhere.

Determine whether `socket.io-client` is loaded globally or only when a meeting feature is mounted. Do not change it until its import graph and lifecycle are understood.

## Lifecycle and correctness requirements

- Handle missing credentials without loading the SDK or joining a channel.
- Handle unmount/re-render during SDK import, join, track creation, publish, and subscribe.
- Ensure cleanup does not leak tracks, clients, listeners, sockets, or media devices.
- Avoid double `leave()`/`close()` operations where they cause errors or races.
- Avoid publishing a screen track after the meeting has already been torn down.
- Restore the camera correctly after screen sharing ends, and close replaced tracks when safe.
- Keep remote audio/video subscriptions and user-left/unpublished state correct.
- Preserve microphone/camera toggles, screen-share stop behavior, and existing DOM playback targets.
- Avoid stale callbacks mutating a later meeting session.
- Use actual SDK types; do not invent broad casts solely to suppress TypeScript errors.

## Suggested implementation order

1. Fix and validate the current `useAgoraRTC.ts` TypeScript/build errors first.
2. Smoke-test joining, local camera/mic, remote media, screen sharing, stopping screen sharing, and leaving.
3. Inspect the route/component import graph for meeting-only modules.
4. Only then consider lazy-loading meeting UI at the route or interaction boundary.
5. Consider dynamically importing the socket client only if measurement/import tracing shows it is useful.

## Validation

- Production build and TypeScript pass.
- Join and leave repeatedly without stale UI or device-lock problems.
- Camera/mic toggles work.
- At least two participants can exchange audio/video.
- Screen share starts and ends; camera returns correctly.
- Navigating away during SDK initialization does not leak or throw unhandled errors.
- Routes that never open meetings do not eagerly load the heavy meeting SDK, if the implementation claims this result.

## Exit criteria

All lifecycle and meeting checks pass. Bundle improvement is verified rather than assumed.
