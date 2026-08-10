# Groupy — Project Overview

## What this is

A persistent, per-`Class` group chat for the educator + their currently-enrolled students only. Text messages, fixed-set reactions, polls, GIFs (Giphy), a static sticker pack, and a "start a meeting from here" shortcut. Private to that class — **no admin or registrar visibility, ever, by design.** Do not build any admin-facing viewing surface for this feature, in any phase.

## Data model

**`GroupyMessage`** — `id, org_id, class_id, sender_account_id, sender_role, sender_name, type (text|gif|sticker|poll|system), body, gif_url, sticker_id, poll_id, created_at`. `body` holds text content for `text` type; `gif_url`/`sticker_id` populate for those types; `poll_id` links to `GroupyPoll` for poll-type messages; `system` type is for things like "meeting started" announcements. Deletion is **hard delete** — the row is actually removed, no recovery path, no soft-delete flag. Any sender can delete their own message; nobody can delete someone else's (symmetric, Messenger-style).

**`GroupyReaction`** — `id, org_id, message_id, account_id, reaction_type (like|love|laugh|wow|sad), created_at`. Unique `(message_id, account_id)` — one reaction per person per message; reacting again with a different type updates it in place (upsert), doesn't create a second row.

**`GroupyPoll`** — `id, org_id, class_id, message_id (unique), created_by, question, closes_at (nullable), is_closed Boolean, created_at`
**`GroupyPollOption`** — `id, poll_id, label, order_index`
**`GroupyPollVote`** — `id, poll_id, option_id, account_id, voted_at`, unique `(poll_id, account_id)` — enforces single choice; changing a vote is an upsert on that same unique key, not a new row. A poll's _effective_ closed state is `is_closed || (closes_at !== null && now > closes_at)` — computed at read time, no scheduled job needed for this.

**Membership**: derived **live** from `Enrollment.status = 'active'` for that `class_id`, plus the `Class.educator_id`. No separate membership table. A dropped/removed student loses access immediately and completely, including message history — this is intentional (locked in earlier), not an oversight.

## Real-time transport

New Socket.IO gateway, `class-chat.gateway.ts`, room-keyed `class:{classId}`. **Do not build this from scratch** — `meeting.gateway.ts` already solves the same underlying problem (authenticated socket connection, room join/leave, broadcast to room members) for a different use case. Phase 2 requires reading that file first and mirroring its auth handshake and room/broadcast patterns. This is plumbing reuse only — Groupy's chat data is completely separate from `MeetingChatMessage`/meeting-room chat, and the two are never bridged or synced. A meeting started from Groupy still has its own independent in-meeting chat panel (unchanged, untouched) — Groupy doesn't suppress it or replace it, the two just coexist without talking to each other.

## GIFs and stickers

- **GIFs**: Giphy integration. Backend proxies search requests (`GIPHY_API_KEY` stays server-side, never exposed to the client). Sending a GIF message just stores the chosen result's CDN URL — no downloading/re-hosting.
- **Stickers**: a static, bundled sticker pack shipped with the frontend (a manifest file + asset folder). No upload/management UI, no admin involvement, no backend model beyond storing which `sticker_id` was sent.

## Meeting hook

"Start Meeting" in the chat header reuses existing `Meeting` creation + roster-invite logic — **investigate what that logic actually is first** (Phase 6 requires this) rather than assuming its shape. Auto-invites the class's active roster the same way meetings already get invited elsewhere in the system. On success, posts a `system`-type `GroupyMessage` announcing it, broadcast to the room like any other message.

## Explicitly out of scope for this pass

- Message editing (send + delete only)
- Any admin/registrar visibility into any class's Groupy chat
- Custom/uploadable sticker packs
- Syncing or bridging Groupy chat with in-meeting chat

## Phase map

| Phase | Layer    | Delivers                                                                                                      |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------- |
| 1     | Backend  | Schema + migration                                                                                            |
| 2     | Backend  | Core messaging (send/list/delete text) + membership helper + real-time gateway (mirrors `meeting.gateway.ts`) |
| 3     | Backend  | Reactions (add/change/remove, broadcast via Phase 2's gateway)                                                |
| 4     | Backend  | Polls (create/vote/close, broadcast via same gateway)                                                         |
| 5     | Backend  | GIF search proxy + sticker manifest + extending send-message to these types                                   |
| 6     | Backend  | Meeting hook (investigate + reuse existing meeting/invite logic, system message)                              |
| 7     | Frontend | Chat UI — message list, send box, reactions, real-time subscribe                                              |
| 8     | Frontend | Polls UI, GIF picker, sticker picker, meeting button, nav wiring (educator + student)                         |

Every phase from 3 onward builds on the gateway established in Phase 2 — none of them re-implement socket plumbing.
