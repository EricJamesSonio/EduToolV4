# Phase 2 — Backend: Core Messaging + Real-Time Gateway

## Goal

Send/list/delete text messages, a reusable membership-check helper, and the Socket.IO gateway everything else builds on.

## Steps

1. **Investigate first.** Read `backend/src/modules/meeting/meeting.gateway.ts` in full. Report: how it authenticates a socket connection, how it joins/scopes a room, and how it broadcasts events to room members. This phase's gateway must mirror that pattern — same auth approach, same general shape — not reinvent it.

2. **Module**: `backend/src/modules/groupy/` — `groupy.module.ts`, `groupy.controller.ts`, `groupy.service.ts`, `groupy.repository.ts`, `groupy.gateway.ts`, `dto/groupy.dto.ts`.

3. **Membership helper** (`groupy.service.ts` or a shared util within the module): `isClassMember(accountId, classId, orgId): Promise<boolean>` — true if `accountId === class.educator_id`, or if there's an `Enrollment` row for that account+class with `status: 'active'`. Every endpoint and gateway event in this entire feature (this phase and all later ones) must call this before allowing read or write access. No exceptions.

4. **Endpoints**:
   - `GET /groupy/:classId/messages` — cursor-paginated (not offset — chat history should paginate backward from most recent), membership-checked, includes reactions per message
   - `POST /groupy/:classId/messages` — `{ type: 'text', body }` for this phase (other types added in later phases via the same endpoint, extending the DTO) — membership-checked, `sender_account_id`/`sender_role`/`sender_name` from `req.user`, never client-supplied
   - `DELETE /groupy/messages/:id` — only if `message.sender_account_id === req.user.id`, else `ForbiddenException`. Hard delete.

5. **Gateway** (`groupy.gateway.ts`): room `class:{classId}`. On connection, verify membership via the same helper before allowing the socket to join the room — reject the join if not a member. Emit `groupy:message:new` on send, `groupy:message:deleted` on delete (payload: just the message id, so clients can remove it from their local state).

## Acceptance check

- A student not enrolled (or dropped) in a class cannot list, send, or receive real-time events for that class's chat — verify via the membership helper being called in all three paths (REST list, REST send, gateway join)
- Deleting your own message removes it for everyone in real time; attempting to delete someone else's message is rejected

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma + Socket.IO). Groupy schema exists
(Phase 1). This is a per-class group chat, educator + actively-enrolled
students only, no admin access.

Step 1 — investigate: read backend/src/modules/meeting/meeting.gateway.ts in
full. Report back its socket auth pattern, room-join pattern, and broadcast
pattern before writing any new gateway code — the new gateway in this phase
must mirror that approach.

Step 2: Build backend/src/modules/groupy/ (module, controller, service,
repository, gateway, dto) following this codebase's standard module structure
(check a comparable existing module like meeting/ for the exact file
breakdown).

Step 3: Implement isClassMember(accountId, classId, orgId) — returns true if
accountId matches the class's educator_id, or if an Enrollment row exists for
that account+class with status 'active'. This must be called by every
endpoint and every gateway connection/event in this module, in this phase and
all future Groupy phases — no path skips this check.

Step 4: Implement:
- GET /groupy/:classId/messages — cursor-based pagination (most recent first,
  paginate backward), include each message's reactions, membership-checked
- POST /groupy/:classId/messages — body { type: 'text', body: string } for
  now (the DTO should allow extension for other types added in later phases
  without breaking this endpoint's contract), membership-checked, sender
  fields taken from req.user only
- DELETE /groupy/messages/:id — only the message's own sender can delete it
  (403 otherwise), hard delete (actual row removal)

Step 5: Implement the gateway with a room per class_id (e.g. `class:${classId}`).
Reject socket room-join if the connecting user fails the membership check.
Emit 'groupy:message:new' on send and 'groupy:message:deleted' (with just the
message id) on delete, to everyone in that class's room.

Show me the meeting.gateway.ts findings first, then your planned file
structure, then diffs.
```
