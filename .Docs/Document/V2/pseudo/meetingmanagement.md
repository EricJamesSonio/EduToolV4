# EduTool — Meeting Management
## Pseudo Code Reference

---

## MEETING — CREATE

```
function createMeeting(orgId, classId, payload):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  if not payload.title:
    throw VALIDATION_ERROR("Meeting title is required")
  if not payload.scheduled_at:
    throw VALIDATION_ERROR("Start date/time is required")

  // Check if the scheduled date falls on a calendar event day
  eventOnDay = DB.calendar_events.findOne({
    org_id:      orgId,
    date:        dateOnly(payload.scheduled_at),
    event_type:  { IN: ["holiday", "no_class_day"] }
  })
  if eventOnDay:
    warnings.add(
      "Scheduled date falls on a " + eventOnDay.event_type +
      ". Meeting notifications will be suppressed."
    )

  meeting = DB.meetings.insert({
    id:           generateUUID(),
    org_id:       orgId,
    class_id:     classId,
    educator_id:  getCurrentEducatorId(),
    title:        payload.title,
    description:  payload.description or null,
    scheduled_at: payload.scheduled_at,
    started_at:   null,
    ended_at:     null,
    deleted_at:   null,
    created_at:   NOW()
  })

  // Determine invited students
  enrolledStudents = DB.enrollments
    .findAll({ org_id: orgId, class_id: classId, status: "active" })
    .map(e => e.student_id)

  inviteTargets = payload.invite_all
    ? enrolledStudents
    : payload.student_ids.filter(id => id in enrolledStudents)

  for each studentId in inviteTargets:
    DB.meeting_invitations.insert({
      id:          generateUUID(),
      org_id:      orgId,
      meeting_id:  meeting.id,
      student_id:  studentId,
      invite_type: "invited",
      created_at:  NOW()
    })

    // Suppress notification if it's a holiday/no class day
    if not eventOnDay:
      sendNotification({
        org_id:         orgId,
        recipient_role: "student",
        recipient_id:   studentId,
        trigger_type:   "meeting_created",
        message:        "A meeting has been scheduled: " + meeting.title +
                        " on " + formatDateTime(meeting.scheduled_at)
      })

  logEducatorActivity(orgId, classId, "meeting_created", {
    meeting_id:   meeting.id,
    invited_count: inviteTargets.length
  })

  return { meeting, warnings }
```

---

## MEETING — START (room opens at scheduled time)

```
// Called by the scheduler or when educator manually starts
function startMeeting(orgId, meetingId):
  requireRole("educator")

  meeting = DB.meetings.findOne({
    id:         meetingId,
    org_id:     orgId,
    deleted_at: null
  })
  if not meeting:
    throw NOT_FOUND("Meeting not found")
  requireClassOwnership(orgId, meeting.class_id)

  if meeting.started_at != null:
    throw CONFLICT("Meeting has already started")

  DB.meetings.update(meetingId, {
    started_at: NOW(),
    updated_at: NOW()
  })

  logEducatorActivity(orgId, meeting.class_id, "meeting_started", {
    meeting_id: meetingId
  })

  return { message: "Meeting started", meeting_id: meetingId }
```

---

## MEETING — STUDENT JOIN (invited)

```
function joinMeeting(orgId, meetingId, studentId):
  requireRole("student")
  requireStudentIdentity(studentId)

  meeting = DB.meetings.findOne({
    id:         meetingId,
    org_id:     orgId,
    started_at: { NOT: null },
    ended_at:   null,
    deleted_at: null
  })
  if not meeting:
    throw NOT_FOUND("Meeting not found or has not started")

  invitation = DB.meeting_invitations.findOne({
    meeting_id: meetingId,
    student_id: studentId
  })

  if not invitation:
    throw FORBIDDEN("You are not invited to this meeting")

  if invitation.invite_type == "declined":
    throw FORBIDDEN("Your join request was declined")

  if invitation.invite_type not in ["invited", "admitted"]:
    throw FORBIDDEN("You are not admitted to this meeting")

  return { message: "Joined meeting", meeting_id: meetingId }
```

---

## MEETING — NON-INVITED STUDENT REQUEST TO JOIN

```
function requestToJoinMeeting(orgId, meetingId, studentId):
  requireRole("student")
  requireStudentIdentity(studentId)

  meeting = DB.meetings.findOne({
    id:         meetingId,
    org_id:     orgId,
    started_at: { NOT: null },
    ended_at:   null
  })
  if not meeting:
    throw NOT_FOUND("Meeting not found or not active")

  // Verify student is enrolled in the class (can see meeting exists)
  enrollment = DB.enrollments.findOne({
    org_id:     orgId,
    class_id:   meeting.class_id,
    student_id: studentId,
    status:     "active"
  })
  if not enrollment:
    throw FORBIDDEN("You are not enrolled in this class")

  existing = DB.meeting_invitations.findOne({
    meeting_id: meetingId,
    student_id: studentId
  })
  if existing:
    throw CONFLICT("A join request already exists for you")

  DB.meeting_invitations.insert({
    id:          generateUUID(),
    org_id:      orgId,
    meeting_id:  meetingId,
    student_id:  studentId,
    invite_type: "requested",
    created_at:  NOW()
  })

  return { message: "Join request sent. Waiting for educator to admit you." }
```

---

## MEETING — EDUCATOR ADMITS OR DECLINES REQUEST

```
function resolveJoinRequest(orgId, meetingId, studentId, decision):
  requireRole("educator")

  meeting = DB.meetings.findOne({ id: meetingId, org_id: orgId })
  requireClassOwnership(orgId, meeting.class_id)

  if decision not in ["admitted", "declined"]:
    throw VALIDATION_ERROR("Decision must be 'admitted' or 'declined'")

  invitation = DB.meeting_invitations.findOne({
    meeting_id:  meetingId,
    student_id:  studentId,
    invite_type: "requested"
  })
  if not invitation:
    throw NOT_FOUND("No pending join request from this student")

  DB.meeting_invitations.update(invitation.id, {
    invite_type: decision,
    updated_at:  NOW()
  })

  return { decision, student_id: studentId }
```

---

## MEETING — END

```
function endMeeting(orgId, meetingId):
  requireRole("educator")

  meeting = DB.meetings.findOne({
    id:         meetingId,
    org_id:     orgId,
    deleted_at: null
  })
  if not meeting:
    throw NOT_FOUND("Meeting not found")
  requireClassOwnership(orgId, meeting.class_id)

  if meeting.ended_at != null:
    throw CONFLICT("Meeting has already ended")
  if meeting.started_at == null:
    throw CONFLICT("Meeting has not started yet")

  DB.meetings.update(meetingId, {
    ended_at:   NOW(),
    updated_at: NOW()
  })

  logEducatorActivity(orgId, meeting.class_id, "meeting_ended", {
    meeting_id: meetingId,
    duration:   NOW() - meeting.started_at
  })

  // No recording saved — meetings are live only, no playback
  return { message: "Meeting ended. No recording is saved." }
```

---

## MEETING — SOFT DELETE

```
function deleteMeeting(orgId, meetingId):
  requireRole("educator")

  meeting = DB.meetings.findOne({
    id:         meetingId,
    org_id:     orgId,
    deleted_at: null
  })
  if not meeting:
    throw NOT_FOUND("Meeting not found")
  requireClassOwnership(orgId, meeting.class_id)

  if meeting.started_at != null:
    throw CONFLICT("Cannot delete a meeting that has already started")

  DB.meetings.update(meetingId, { deleted_at: NOW() })

  return { message: "Meeting deleted." }
```

---

## MEETING — LESSON PRESENTATION MODE (in-room)

```
function setLessonPresentation(orgId, meetingId, lessonId, currentPage):
  requireRole("educator")

  meeting = DB.meetings.findOne({
    id:         meetingId,
    org_id:     orgId,
    started_at: { NOT: null },
    ended_at:   null
  })
  if not meeting:
    throw NOT_FOUND("Active meeting not found")
  requireClassOwnership(orgId, meeting.class_id)

  lesson = DB.lessons.findOne({
    id:         lessonId,
    org_id:     orgId,
    class_id:   meeting.class_id,
    deleted_at: null
  })
  if not lesson:
    throw NOT_FOUND("Lesson not found in this class")

  // Broadcast current page to all connected participants via WebSocket
  websocket.broadcast(meetingId, {
    event:       "lesson_navigation",
    lesson_id:   lessonId,
    lesson_title: lesson.title,
    current_page: currentPage
    // All participants receive this and their view updates in real time
  })

  return { broadcasted: true }
```

---

## MEETING — EDUCATOR IN-ROOM CONTROLS

```
function muteParticipant(meetingId, targetStudentId):
  requireRole("educator")
  // Sends a mute signal to the target student's WebSocket connection
  websocket.sendTo(meetingId, targetStudentId, {
    event: "force_mute"
  })

function toggleRaiseHand(meetingId, studentId):
  requireRole("student")
  // Broadcasts raise-hand state to the room
  websocket.broadcast(meetingId, {
    event:      "raise_hand",
    student_id: studentId
  })

function sendChatMessage(orgId, meetingId, senderId, senderRole, message):
  if not message or message.trim() == "":
    throw VALIDATION_ERROR("Message cannot be empty")

  // Broadcast to all participants in the room
  websocket.broadcast(meetingId, {
    event:       "chat_message",
    sender_id:   senderId,
    sender_role: senderRole,
    message:     message.trim(),
    sent_at:     NOW()
  })
  // Chat is in-session only — not persisted after meeting ends
```

---

## MEETING LIST — FOR STUDENT VIEW

```
function getMeetingsForStudent(orgId, studentId):
  requireRole("student")
  requireStudentIdentity(studentId)

  // Get all class IDs the student is enrolled in
  classIds = DB.enrollments
    .findAll({ org_id: orgId, student_id: studentId, status: "active" })
    .map(e => e.class_id)

  // Get all meetings in those classes — both invited and non-invited
  meetings = DB.meetings
    .findAll({
      org_id:     orgId,
      class_id:   { IN: classIds },
      deleted_at: null
    })
    .orderBy("scheduled_at", DESC)

  return meetings.map(meeting => {
    invitation = DB.meeting_invitations.findOne({
      meeting_id: meeting.id,
      student_id: studentId
    })
    return {
      meeting_id:   meeting.id,
      title:        meeting.title,
      scheduled_at: meeting.scheduled_at,
      status:       meeting.ended_at ? "ended"
                    : meeting.started_at ? "live"
                    : "upcoming",
      invite_status: invitation ? invitation.invite_type : "not_invited"
      // "not_invited" students can see it and request to join
    }
  })
```