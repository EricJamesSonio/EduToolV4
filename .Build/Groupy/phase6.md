# Phase 6 — Backend: Meeting Hook

## Goal

"Start Meeting" from Groupy reuses existing meeting creation + roster-invite logic and posts a `system`-type message announcing it.

## Steps

1. **Investigate first.** Read `backend/src/modules/meeting/meeting.service.ts` and `meeting.controller.ts`. Find: (a) how a `Meeting` gets created, (b) how invites (`MeetingInvite` rows) get generated for a roster of students — specifically, is there already a "create meeting + invite everyone in this class" path, or does existing meeting creation only support manual/individual invite selection? Report findings before writing anything.

2. **Endpoint**: `POST /groupy/:classId/start-meeting` — educator only (`req.user.id === class.educator_id`). Reuses whatever creation/invite logic Step 1 found — call into the existing `MeetingService` rather than duplicating its logic. If existing meeting creation doesn't already support "invite the whole class roster automatically," extend it minimally to support that (or add a thin wrapper in `MeetingService` that fetches active enrollments for the class and creates one `MeetingInvite` per student) — do not fork a parallel meeting-creation code path in the `groupy` module.

3. On success: create a `GroupyMessage` with `type: 'system'`, `body` containing the meeting id/join reference (e.g. `{ meetingId }` — decide the exact shape based on what the frontend will need to render a "Join" button, covered in Phase 7/8). Broadcast via the existing gateway's `groupy:message:new` event, same as any other message — no new event type.

4. **No changes to the meeting room itself.** Do not touch `meeting.gateway.ts`, `ChatPanel.tsx`, or any in-meeting-room chat logic. A meeting started from Groupy behaves identically to any other meeting once joined — its own chat panel, if present, stays exactly as-is and is not connected to Groupy in any way.

## Acceptance check

- Only the class's educator can trigger `start-meeting` (403 for students)
- The created meeting auto-invites the currently active roster, using the existing invite mechanism (not a reimplementation)
- A system message appears in the chat in real time for all connected class members when a meeting starts

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Groupy messaging/gateway (Phase 2),
reactions (3), polls (4), gif/stickers (5) exist. There is an existing,
separate Meeting system (backend/src/modules/meeting/) already used elsewhere
in the app, entirely unrelated to Groupy.

Step 1 — investigate: read meeting.service.ts and meeting.controller.ts in
full. Report exactly how a Meeting is created and how MeetingInvite rows are
generated — specifically whether there's already a way to invite an entire
class's roster automatically, or whether existing invite creation is
per-student/manual. Do this before writing any new code.

Step 2: Add POST /groupy/:classId/start-meeting — only the class's educator
(req.user.id === class.educator_id) may call this, 403 otherwise. This must
call into the existing MeetingService to create the meeting — do not
duplicate meeting-creation logic inside the groupy module. If auto-inviting
the whole class roster isn't already supported by existing meeting creation,
add the minimal extension needed (e.g. a method that takes a classId, looks
up active Enrollment rows, and creates one MeetingInvite per student) inside
MeetingService itself, not as a parallel implementation in groupy.

Step 3: On success, create a GroupyMessage with type: 'system' referencing the
new meeting (decide the payload shape needed for a frontend "Join" button —
document your choice). Broadcast it via the existing gateway's
groupy:message:new event — same as any other message, no new event.

Step 4: Do not modify meeting.gateway.ts, any in-meeting chat component, or
any existing meeting-room behavior. Groupy and the meeting room's own chat
(if any) remain fully independent — no bridging, no shared state, in either
direction.

Show me your Step 1 findings first, then your implementation plan, then diffs.
```
