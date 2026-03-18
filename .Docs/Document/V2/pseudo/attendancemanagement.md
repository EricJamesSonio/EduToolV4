# EduTool — Attendance Management
## Pseudo Code Reference

---

## AUTO-ATTENDANCE FROM ASSESSMENT SUBMISSION

```
// Called automatically at the end of submitAssessment()
function autoMarkAttendance(orgId, classId, studentId, sessionDate):
  // Find the class session that matches today's date
  session = DB.class_sessions.findOne({
    org_id:       orgId,
    class_id:     classId,
    session_date: sessionDate,
    is_skipped:   false
  })

  if not session:
    // No session today (possibly not a scheduled day or it was skipped)
    return

  existing = DB.attendance_records.findOne({
    org_id:     orgId,
    session_id: session.id,
    student_id: studentId
  })

  if existing:
    // Manual record already set by educator — do NOT overwrite
    if existing.source == "manual":
      return
    // Auto record already present — update it
    DB.attendance_records.update(existing.id, {
      status:     "present",
      updated_at: NOW()
    })
    return

  // No record yet — create auto-present
  DB.attendance_records.insert({
    id:          generateUUID(),
    org_id:      orgId,
    session_id:  session.id,
    student_id:  studentId,
    class_id:    classId,
    status:      "present",
    source:      "auto",
    recorded_by: null,
    created_at:  NOW()
  })
```

---

## MANUAL ATTENDANCE — SET OR OVERRIDE

```
function setAttendance(orgId, classId, sessionId, studentId, status):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  VALID_STATUSES = ["present", "absent", "late", "excused"]
  if status not in VALID_STATUSES:
    throw VALIDATION_ERROR("Invalid status. Must be: present, absent, late, or excused")

  // Cannot edit after grades are locked
  classObj = DB.classes.findOne({ id: classId, org_id: orgId })
  if classObj.grades_locked:
    throw FORBIDDEN("Cannot edit attendance after grades are locked")

  session = DB.class_sessions.findOne({
    id:       sessionId,
    org_id:   orgId,
    class_id: classId
  })
  if not session:
    throw NOT_FOUND("Session not found")
  if session.is_skipped:
    throw FORBIDDEN("Cannot record attendance for a skipped session (Holiday / No Class Day)")

  // Verify student is enrolled in this class
  enrollment = DB.enrollments.findOne({
    org_id:     orgId,
    class_id:   classId,
    student_id: studentId,
    status:     "active",
    deleted_at: null
  })
  if not enrollment:
    throw VALIDATION_ERROR("Student is not enrolled in this class")

  existing = DB.attendance_records.findOne({
    org_id:     orgId,
    session_id: sessionId,
    student_id: studentId
  })

  if existing:
    // Override any previous record (auto or manual)
    DB.attendance_records.update(existing.id, {
      status:      status,
      source:      "manual",
      recorded_by: getCurrentEducatorId(),
      updated_at:  NOW()
    })
    return DB.attendance_records.findOne({ id: existing.id })

  // Create new manual record
  record = DB.attendance_records.insert({
    id:          generateUUID(),
    org_id:      orgId,
    session_id:  sessionId,
    student_id:  studentId,
    class_id:    classId,
    status:      status,
    source:      "manual",
    recorded_by: getCurrentEducatorId(),
    created_at:  NOW()
  })

  return record
```

---

## BULK ATTENDANCE — SET ENTIRE SESSION AT ONCE

```
function setBulkAttendance(orgId, classId, sessionId, entries):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  // entries = [ { student_id, status }, ... ]
  results = []
  for each entry in entries:
    result = setAttendance(orgId, classId, sessionId, entry.student_id, entry.status)
    results.push(result)

  return results
```

---

## GET ATTENDANCE VIEW — WEEKLY LAYOUT

```
function getAttendanceView(orgId, classId):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  sessions = DB.class_sessions
    .findAll({ org_id: orgId, class_id: classId })
    .orderBy("session_date", ASC)

  enrolledStudents = DB.enrollments
    .findAll({ org_id: orgId, class_id: classId, status: "active", deleted_at: null })
    .map(e => DB.students.findOne({ id: e.student_id }))

  // Group sessions by calendar week
  weekGroups = groupBy(sessions, s => extractWeekNumber(s.week_label))

  return weekGroups.map(group => ({
    week_number: group.key,
    sessions: group.sessions.map(session => ({
      session_id:   session.id,
      session_date: session.session_date,
      week_label:   session.week_label,
      is_skipped:   session.is_skipped,
      attendance:   session.is_skipped
        ? []
        : enrolledStudents.map(student => {
            record = DB.attendance_records.findOne({
              org_id:     orgId,
              session_id: session.id,
              student_id: student.id
            })
            return {
              student_id:   student.id,
              student_name: student.full_name,
              status:       record ? record.status : null,   // null = not yet marked
              source:       record ? record.source : null
            }
          })
    }))
  }))
```

---

## GET ATTENDANCE — SINGLE SESSION

```
function getSessionAttendance(orgId, classId, sessionId):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  session = DB.class_sessions.findOne({
    id:       sessionId,
    org_id:   orgId,
    class_id: classId
  })
  if not session:
    throw NOT_FOUND("Session not found")

  if session.is_skipped:
    return { session, is_skipped: true, attendance: [] }

  enrolledStudents = DB.enrollments
    .findAll({ org_id: orgId, class_id: classId, status: "active" })
    .map(e => DB.students.findOne({ id: e.student_id }))

  attendance = enrolledStudents.map(student => {
    record = DB.attendance_records.findOne({
      org_id:     orgId,
      session_id: sessionId,
      student_id: student.id
    })
    return {
      student_id:   student.id,
      student_name: student.full_name,
      status:       record ? record.status : null,
      source:       record ? record.source : null
    }
  })

  return { session, attendance }
```

---

## CALENDAR EVENT — AUTO SKIP SESSIONS ON EVENT DAYS

```
// Called when Admin creates a Holiday or No Class Day event
function skipSessionsOnEventDay(orgId, schoolYearId, eventDate):
  affectedSessions = DB.class_sessions.findAll({
    org_id:       orgId,
    session_date: eventDate,
    is_skipped:   false
  })

  for each session in affectedSessions:
    DB.class_sessions.update(session.id, {
      is_skipped: true,
      updated_at: NOW()
    })
    // Remove any auto-created attendance records for this session
    DB.attendance_records.deleteAll({
      session_id: session.id,
      source:     "auto"
    })
    // Manual records are preserved with a warning

  // Recalculate week labels for affected classes
  affectedClassIds = affectedSessions.map(s => s.class_id).unique()
  for each classId in affectedClassIds:
    recalculateWeekLabels(classId, orgId)
```

---

## WEEK LABEL RECALCULATION (after skip)

```
function recalculateWeekLabels(classId, orgId):
  classObj = DB.classes.findOne({ id: classId, org_id: orgId })
  activeSessions = DB.class_sessions
    .findAll({ class_id: classId, org_id: orgId, is_skipped: false })
    .orderBy("session_date", ASC)

  weekNumber = 1
  subIndex   = 1

  for each session in activeSessions:
    if classObj.weekdays.length == 1:
      newLabel = "Week " + weekNumber
      weekNumber++
    else:
      newLabel = "Week " + weekNumber + "." + subIndex
      subIndex++
      if subIndex > classObj.weekdays.length:
        subIndex = 1
        weekNumber++

    DB.class_sessions.update(session.id, {
      week_label: newLabel,
      updated_at: NOW()
    })
    // Also update lessons that reference this week_label
    DB.lessons.updateAll(
      { class_id: classId, org_id: orgId, week_label: session.week_label },
      { week_label: newLabel }
    )
```

---

## ATTENDANCE SUMMARY — FOR GRADE RUBRIC (manual input)

```
// Attendance category in rubric is manual-entry — educator inputs summary score
// Raw session records are for reference only (future: may be auto-computed)
function getAttendanceSummaryForGrading(orgId, classId, studentId):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  totalSessions = DB.class_sessions.count({
    org_id:     orgId,
    class_id:   classId,
    is_skipped: false
  })

  records = DB.attendance_records.findAll({
    org_id:     orgId,
    class_id:   classId,
    student_id: studentId
  })

  summary = {
    total_sessions: totalSessions,
    present:  records.filter(r => r.status == "present").length,
    absent:   records.filter(r => r.status == "absent").length,
    late:     records.filter(r => r.status == "late").length,
    excused:  records.filter(r => r.status == "excused").length,
    unmarked: totalSessions - records.length
  }

  // This summary is shown to educator for reference when manually
  // entering the attendance score in the grade rubric
  return summary
```