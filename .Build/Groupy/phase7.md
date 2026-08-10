# Phase 7 — Frontend: Chat UI

## Goal

The core reusable chat surface — message list, send box, reactions, real-time subscription. Shared between educator and student mounts (both see/use the same component; permissions like poll-creation and meeting-start are gated inside it based on role, not via two separate components).

## Steps

1. **API layer**: `frontend/src/api/shared/groupy.api.ts` (new shared location, since this is genuinely used by both roles unlike the earlier student-only Concern Center) — calls for: list messages (cursor pagination), send text message, delete message, add/remove reaction.

2. **Socket hook**: `frontend/src/hooks/groupy/useGroupySocket.ts` — mirrors whatever pattern `hooks/meeting/useMeetingSocket.ts` already establishes for connecting, joining a room, and subscribing to events (investigate that file first, same reuse principle as the backend gateway). Subscribes to `groupy:message:new`, `groupy:message:deleted`, `groupy:reaction:updated`, `groupy:reaction:removed` and updates local/query cache accordingly (optimistic UI: new messages/reactions should feel instant, not wait on a query refetch).

3. **Components** — `frontend/src/components/shared/groupy/`:
   - `GroupyChatFeature.tsx` — top-level container: message list + send box, takes `classId` and the current user's role as props
   - `MessageList.tsx` — reverse-infinite-scroll (load older on scroll-up), renders each message by `type` (text/gif/sticker/poll/system — poll and gif/sticker rendering come in Phase 8, stub those message types with a simple placeholder for now so the list doesn't break)
   - `MessageBubble.tsx` — single message: sender name, timestamp, body, reaction bar, delete option (visible only when `senderAccountId === currentUserId`)
   - `ReactionBar.tsx` — the fixed five reactions (like/love/laugh/wow/sad), tap to react/change/remove
   - `SendBox.tsx` — text input + send button for this phase (GIF/sticker/poll triggers added in Phase 8)

4. **Do not mount this anywhere yet** — no page wiring, no nav links. That's Phase 8, once the poll/GIF/sticker/meeting pieces exist too, so the feature isn't shipped half-finished behind a visible nav item.

## Acceptance check

- Two browser sessions (or a session + incognito) in the same class chat see each other's messages and reactions appear in real time without a manual refresh
- Deleting your own message removes it live in the other session too
- Scrolling up loads older history via cursor pagination, not by refetching everything

---

## AI Prompt

```
Context: EduTool frontend (Next.js + React + TanStack Query + Socket.IO
client). Backend from Phases 2-6 exists: message CRUD, reactions, polls,
gif/sticker support, meeting hook, all behind a Socket.IO gateway broadcasting
groupy:message:new / groupy:message:deleted / groupy:reaction:updated /
groupy:reaction:removed events on a class:{classId} room.

Step 1 — investigate: read frontend/src/hooks/meeting/useMeetingSocket.ts to
see how this codebase already handles connecting to a socket, joining a room,
and subscribing to events from a React hook. Mirror that pattern for the new
hook in this phase rather than building socket-handling from scratch.

Step 2: Build frontend/src/api/shared/groupy.api.ts — list messages (cursor
pagination), send text message, delete message, add/remove reaction.

Step 3: Build frontend/src/hooks/groupy/useGroupySocket.ts per the Step 1
findings — subscribes to the four events listed above, updates local state /
TanStack Query cache so new messages, deletions, and reaction changes appear
instantly without needing a manual refetch.

Step 4: Build these under frontend/src/components/shared/groupy/:
- GroupyChatFeature.tsx (container, takes classId + current user role as props)
- MessageList.tsx (reverse-infinite-scroll, renders by message type — for
  'gif', 'sticker', and 'poll' types, render a simple text placeholder like
  "[GIF]" / "[Sticker]" / "[Poll]" for now, since their real rendering is
  built in the next phase — do not skip these types or crash on them)
- MessageBubble.tsx (sender, timestamp, body, reaction bar, delete option
  visible only if the message's sender is the current user)
- ReactionBar.tsx (fixed five reactions: like, love, laugh, wow, sad)
- SendBox.tsx (text input + send button only — no GIF/sticker/poll triggers
  yet, those come in the next phase)

Step 5: Do NOT create any page file or nav link mounting this component yet —
that happens in the next phase once the feature is complete enough to expose.

Show me your findings from Step 1, then the file structure you plan to build,
then diffs.
```
