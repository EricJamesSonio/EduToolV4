=========================
MEETING MODULE (EDUCATOR)
Base: /classes/:classId/meetings
=========================
14. CREATE Meeting

POST /classes/:classId/meetings

Request:
{
"title": "string",
"description": "string (optional)",
"startTime": "ISO date",
"invitedStudentIds": ["uuid"] (optional)
}

Response:
{
"id": "uuid",
"title": "string",
"startTime": "date",
"status": "scheduled"
}

Notes:

If invitedStudentIds is empty → ALL students invited
Triggers notifications automatically
15. GET Meetings (Educator)

GET /classes/:classId/meetings

Response:
[
{
"id": "uuid",
"title": "string",
"startTime": "date",
"status": "scheduled" | "ended"
}
]

16. GET Single Meeting

GET /classes/:classId/meetings/:id

Response:
{
"id": "uuid",
"title": "string",
"description": "string",
"startTime": "date",
"status": "scheduled" | "ended"
}

17. UPDATE Meeting

PATCH /classes/:classId/meetings/:id

Notes:

Cannot update if status = ended
18. DELETE Meeting

DELETE /classes/:classId/meetings/:id

19. END Meeting

POST /classes/:classId/meetings/:id/end

Response:
{
"success": true,
"message": "Meeting ended."
}

Notes:

Locks meeting permanently
Cannot be reopened
=========================
MEETING (STUDENT SIDE)
Base: /student/classes/:classId/meetings
=========================
20. GET My Meetings

GET /student/classes/:classId/meetings

Response:
[
{
"id": "uuid",
"title": "string",
"startTime": "date",
"status": "scheduled",
"isInvited": boolean,
"joinRequest": {
"id": "uuid",
"status": "pending"
} | null
}
]

Notes:

isInvited controls JOIN button
joinRequest controls pending state UI
21. REQUEST Join

POST /meetings/:id/join-request

Response:
{
"id": "uuid",
"status": "pending"
}

Notes:

Only for non-invited students
22. RESPOND to Join Request (Educator)

PATCH /meetings/:id/join-request/:reqId

Request:
{
"status": "accepted" | "declined"
}

Notes:

If accepted → student becomes invited
=========================
AGORA TOKEN (REALTIME VIDEO)
=========================
23. GET Meeting Token

GET /meetings/:id/token

Response:
{
"token": "string",
"channel": "meeting_<id>",
"appId": "string",
"uid": number,
"warning": "optional"
}

Notes:

Required before joining video call
warning appears in dev mode only
Use channel + token + uid for Agora SDK

MEETING FLOW
Educator creates meeting
Students:
invited → can join
not invited → request access
Educator accepts/declines
Use /token to join call
Educator ends meeting → final state

Frontend must:

Handle invitation vs request state
Disable actions if meeting ended
Always fetch token before joining