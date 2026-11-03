# Phase 02 — Meeting Dependencies

**Priority:** After Phase 04  
**Risk:** Medium to high  
**Goal:** Preserve reliable meeting behavior while removing meeting-only code from routes that do not need it.

This phase is split into two independent batches:

- **Phase 02A — Meeting lifecycle correctness:** fix track/client cleanup and screen-share restoration.
- **Phase 02B — Lazy Socket.IO loading:** defer the socket client until a meeting connection is actually needed.

Do not attempt 02B while 02A is unresolved.

## Phase 02A — Meeting lifecycle correctness

### Review findings

Inspect the current source before editing; line numbers may drift. The reviewed code in `frontend/src/hooks/meeting/useAgoraRTC.ts` has these reported problems:

- When screen sharing starts, the camera track is stopped with `cameraTrack.stop()` but is not closed.
- After screen sharing ends, a new camera track is created, but the previous stopped track may remain unclosed.
- Effect cleanup closes only the track currently stored in `localVideoRef`; if that is a screen track, an earlier camera track may leak.
- If screen-share publishing or track creation fails after the camera has been unpublished, the camera may remain unpublished or not be restored.
- Cancellation checks exist, but a failed restoration path only logs the error.

These are correctness issues, not merely bundle-size issues. They affect device ownership, privacy indicators, rejoin behavior, and long-session stability.

### Required behavior

- Every owned track must be closed exactly once when no longer needed.
- Replacing a camera track with a screen track, or the reverse, must not orphan the replaced track.
- Browser-native “Stop sharing” and the application’s stop action must converge on the same cleanup path.
- A failed screen-share start must leave the meeting in a usable state with the camera restored where possible.
- Unmounting during SDK import, join, publish, or screen-share initialization must not leave devices or listeners behind.
- Leaving and rejoining must not reuse stale tracks, clients, or callbacks.
- Do not change Agora subscription or screen-sharing semantics unless required by the bug fix.

### Tests

Before and after the change, exercise:

1. Join and leave a meeting.
2. Toggle camera and microphone.
3. Start and stop screen sharing.
4. Stop sharing with the browser-native control.
5. Confirm the camera returns after screen sharing ends.
6. Force a screen-share failure and confirm recovery.
7. Navigate away during initialization and while sharing.
8. Rejoin after leaving.
9. Confirm all owned tracks are closed and no device indicators remain.
10. Confirm remote participants still see the expected camera, screen, audio, and presence state.

Use two participants where the behavior requires a remote view. Record any test that cannot be run locally.

### Acceptance criteria

- No track/device leak is observed in repeated join/share/leave cycles.
- Camera and microphone toggles remain correct.
- Screen share starts, ends, and restores the camera reliably.
- Navigation away and rejoin do not throw unhandled errors.
- Production build and typecheck pass.
- No bundle-size claim is made for this subphase.

## Phase 02B — Lazy Socket.IO loading

### Review findings

The original assumption that meeting dependencies are already fully deferred is incorrect.

- `frontend/src/hooks/meeting/useMeetingSocket.ts` statically imports `socket.io-client`.
- `frontend/src/app/educator/layout.tsx` and `frontend/src/app/student/layout.tsx` use `next/dynamic` for the meeting provider.
- The provider loader chunk still requests a chunk containing Socket.IO and meeting context after hydration.
- The reviewed Socket.IO-related chunk was approximately **47.5 KB raw**.
- Agora is already deferred behind meeting credentials; preserve that behavior.

### Investigation

Before changing the import:

1. Trace every consumer of `useMeetingSocket` and the meeting context.
2. Confirm whether Socket.IO is used outside meeting routes.
3. Identify the exact conditions under which a connection is required: meeting ID, token, role, and any room/join state.
4. Confirm present behavior for presence, chat, reconnect, authentication, and disconnect cleanup.
5. Decide between:
   - dynamically importing `socket.io-client` inside the connection effect; or
   - gating the meeting provider so it is only mounted when a meeting is active.

Prefer the smallest boundary that removes the chunk from non-meeting routes while preserving the existing provider/context contract. Do not move the whole meeting UI into a delayed boundary merely to hide the import.

### Rules

- Do not assume socket usage is meeting-only; verify it.
- Preserve authentication, presence, chat, reconnect, and cleanup semantics.
- Preserve Agora’s existing deferred import.
- Do not create duplicate sockets or change reconnection policy without evidence.
- Do not suppress errors or weaken types to make the change compile.
- Keep the change reversible.

### Validation

- Fresh build and typecheck pass.
- Non-meeting educator and student routes do not request the Socket.IO chunk.
- Meeting routes still connect, exchange chat/presence, reconnect, and disconnect cleanly.
- Repeat join/leave and navigation between routes.
- Record the before/after runtime chunk request, not only the static manifest.

### Exit criteria

- 02A lifecycle checks pass.
- Socket.IO is absent from non-meeting route loading, or a documented investigation explains why it cannot be removed safely.
- Meeting functionality is unchanged.
- The improvement is measured in the browser network panel and supported by a fresh build.
