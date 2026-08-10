# Phase 3 — Backend: Reactions

## Goal

Add/change/remove a reaction on a message, broadcast via the Phase 2 gateway. No new socket infrastructure — this phase only adds events to the existing gateway.

## Steps

1. **Endpoint**: `PUT /groupy/messages/:id/reaction` — `{ reactionType: 'like'|'love'|'laugh'|'wow'|'sad' }`. Membership-checked (via the same `isClassMember` helper — resolve the message's `class_id` first, then check). Upsert on the `(message_id, account_id)` unique constraint from Phase 1's schema — reacting again with a different type updates the existing row, does not create a duplicate.

2. **Endpoint**: `DELETE /groupy/messages/:id/reaction` — removes the caller's own reaction on that message, if any. No-op (not an error) if they hadn't reacted.

3. **Gateway**: emit `groupy:reaction:updated` (payload: `messageId, accountId, reactionType`) on upsert, `groupy:reaction:removed` (payload: `messageId, accountId`) on delete, to the message's class room.

## Acceptance check

- Reacting twice with different types on the same message results in one `GroupyReaction` row, not two
- Removing a reaction that never existed doesn't error
- Non-members can't react (same membership check as Phase 2)

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Groupy core messaging + gateway
exist (Phase 2), including isClassMember() and the class:{classId} socket room.

Task:
1. Add PUT /groupy/messages/:id/reaction — { reactionType }. Look up the
   message's class_id first, then run isClassMember. Upsert on the
   (message_id, account_id) unique constraint — use Prisma's upsert, not a
   manual find-then-create/update.

2. Add DELETE /groupy/messages/:id/reaction — removes the caller's own
   reaction if it exists; if it doesn't exist, return success anyway (this is
   not an error case).

3. In the existing groupy.gateway.ts, add two emit points: 'groupy:reaction:updated'
   (messageId, accountId, reactionType) after the upsert, and
   'groupy:reaction:removed' (messageId, accountId) after the delete — both
   broadcast to the message's class room. Do not create a new gateway or new
   room structure — reuse what Phase 2 already built.

Show me diffs before applying.
```
