# Phase 4 — Backend: Polls

## Goal

Educator creates a poll (becomes a `poll`-type `GroupyMessage`), students vote (single-choice, changeable until closed), educator can manually close it.

## Steps

1. **Endpoint**: `POST /groupy/:classId/polls` — `{ question, options: string[] }` (2+ options required, validate). **Educator only** — check `req.user.id === class.educator_id`, not just general membership (students cannot create polls). In one transaction: create `GroupyPoll` + its `GroupyPollOption` rows + a `GroupyMessage` with `type: 'poll'` and `poll_id` set. Broadcast via the existing gateway as a normal new-message event (`groupy:message:new`) — the poll rides on the same message stream, no separate event type needed for creation.

2. **Endpoint**: `POST /groupy/polls/:pollId/vote` — `{ optionId }`. Membership-checked. Reject with a clear error if the poll's effective closed state is true (`is_closed || (closes_at && now > closes_at)`) — compute this at request time, don't trust a stale client-side flag. Upsert on `(poll_id, account_id)` — this is what makes "change your vote" work, same mechanism as reactions in Phase 3.

3. **Endpoint**: `PATCH /groupy/polls/:pollId/close` — **educator (poll creator) only**, sets `is_closed: true`.

4. **Endpoint**: `GET /groupy/polls/:pollId/results` — vote counts per option, membership-checked. Decide and document in your response whether to show individual voter names or counts only (this wasn't specified — default to **counts only**, consistent with a lightweight classroom poll rather than an accountability tool, unless told otherwise).

5. **Gateway**: emit `groupy:poll:vote-updated` (payload: `pollId, resultsSummary`) after each vote, and `groupy:poll:closed` (payload: `pollId`) after close, to the class room.

## Acceptance check

- A student cannot create a poll (403)
- Voting twice with different options updates the same vote, doesn't create two `GroupyPollVote` rows
- Voting on a poll past its `closes_at` is rejected even if `is_closed` was never manually set to true

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Groupy core messaging + gateway
exist (Phase 2), reactions exist (Phase 3).

Task:
1. POST /groupy/:classId/polls — { question, options: string[] } (require
   at least 2 options). Check req.user.id === class.educator_id specifically
   (not just isClassMember — students must not be able to create polls).
   In a single Prisma transaction: create GroupyPoll, its GroupyPollOption
   rows, and a GroupyMessage with type: 'poll' and poll_id set to the new
   poll's id. Broadcast this exactly like a normal new message
   (groupy:message:new via the existing gateway) — no new event type for
   creation.

2. POST /groupy/polls/:pollId/vote — { optionId }, isClassMember-checked.
   Compute effective closed state at request time: is_closed === true OR
   (closes_at !== null AND now > closes_at) — reject the vote if either is
   true, with a clear error message. Otherwise upsert on the (poll_id,
   account_id) unique constraint so re-voting changes the existing vote
   rather than creating a new row.

3. PATCH /groupy/polls/:pollId/close — only the poll's created_by can call
   this (403 otherwise) — sets is_closed: true.

4. GET /groupy/polls/:pollId/results — vote counts per option,
   isClassMember-checked. Return counts only, not individual voter identity,
   unless you find an existing convention in this codebase suggesting
   otherwise (check similar aggregate-result endpoints if any exist) — if
   genuinely undecided, default to counts-only and note that choice in your
   response.

5. Add to the existing groupy.gateway.ts: emit 'groupy:poll:vote-updated'
   (pollId, resultsSummary) after each vote, 'groupy:poll:closed' (pollId)
   after close — broadcast to the class room, reusing the existing gateway.

Show me diffs before applying.
```
