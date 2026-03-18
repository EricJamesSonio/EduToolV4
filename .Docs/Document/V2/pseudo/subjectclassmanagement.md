# EduTool — Subject & Class Management
## Pseudo Code Reference

---

## SUBJECT — CREATE

```
function createSubject(orgId, schoolYearId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  if not payload.title:
    throw VALIDATION_ERROR("Subject title is required")
  if not payload.grade_year_level:
    throw VALIDATION_ERROR("Grade/Year level is required")
  if not payload.educator_id:
    throw VALIDATION_ERROR("Assigned educator is required")
  if not payload.grading_system_id:
    throw VALIDATION_ERROR("Grading system is required")

  // Validate all references belong to this org
  validateExists(DB.programs, payload.program_id, orgId)
  validateExists(DB.educators, payload.educator_id, orgId)
  validateExists(DB.grading_systems, payload.grading_system_id, orgId)

  if payload.course_id:
    validateExists(DB.courses, payload.course_id, orgId)

  subject = DB.subjects.insert({
    id:               generateUUID(),
    org_id:           orgId,
    school_year_id:   schoolYearId,
    program_id:       payload.program_id,
    course_id:        payload.course_id or null,
    grade_year_level: payload.grade_year_level,
    title:            payload.title,
    educator_id:      payload.educator_id,
    grading_system_id: payload.grading_system_id,
    is_locked:        false,
    created_at:       NOW()
  })

  // NOTE: No weekday or time here — that belongs on the class, not the subject
  return subject
```

---

## SUBJECT — LOCK (triggered by Admin when enrollment begins)

```
function lockSubject(orgId, subjectId):
  requireRole("admin")
  requireOrgMatch(orgId)

  subject = DB.subjects.findOne({ id: subjectId, org_id: orgId })
  if not subject:
    throw NOT_FOUND("Subject not found")
  if subject.is_locked:
    throw CONFLICT("Subject is already locked")

  DB.subjects.update(subjectId, {
    is_locked:  true,
    updated_at: NOW()
  })

  return { message: "Subject locked. No further edits allowed." }


function unlockSubjectForNewSchoolYear(orgId, subjectId):
  // Called automatically when a new school year's subjects are created
  DB.subjects.update(subjectId, {
    is_locked:  false,
    updated_at: NOW()
  })
```

---

## SUBJECT — EDIT (only while unlocked)

```
function updateSubject(orgId, subjectId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  subject = DB.subjects.findOne({ id: subjectId, org_id: orgId })
  if not subject:
    throw NOT_FOUND("Subject not found")
  if subject.is_locked:
    throw FORBIDDEN("Subject is locked and cannot be edited")

  DB.subjects.update(subjectId, {
    title:             payload.title or subject.title,
    educator_id:       payload.educator_id or subject.educator_id,
    grading_system_id: payload.grading_system_id or subject.grading_system_id,
    grade_year_level:  payload.grade_year_level or subject.grade_year_level,
    updated_at:        NOW()
  })

  return DB.subjects.findOne({ id: subjectId })
```

---

## GRADING SYSTEM — CREATE (per org, reusable)

```
function createGradingSystem(orgId, payload, createdByRole, createdById):
  requireOrgMatch(orgId)

  if payload.categories.length == 0:
    throw VALIDATION_ERROR("At least one category is required")

  // All category weights must sum to exactly 100
  totalWeight = payload.categories.reduce((sum, c) => sum + c.weight_percent, 0)
  if totalWeight != 100:
    throw VALIDATION_ERROR(
      "Category weights must total exactly 100%. Current total: " + totalWeight + "%"
    )

  system = DB.grading_systems.insert({
    id:               generateUUID(),
    org_id:           orgId,
    title:            payload.title,
    is_org_default:   payload.is_org_default or false,
    created_by_role:  createdByRole,   // "admin" or "educator"
    created_by_id:    createdById,
    created_at:       NOW()
  })

  // If this is set as org default, unset any previous default
  if payload.is_org_default:
    DB.grading_systems.updateAll(
      { org_id: orgId, id: { NOT: system.id }, is_org_default: true },
      { is_org_default: false }
    )

  for i, cat in enumerate(payload.categories):
    DB.grading_system_categories.insert({
      id:                generateUUID(),
      org_id:            orgId,
      grading_system_id: system.id,
      label:             cat.label,             // e.g. "Quizzes", "Exams"
      weight_percent:    cat.weight_percent,
      entry_type:        cat.entry_type,         // "assessment_linked" | "manual"
      assessment_type:   cat.assessment_type or null,
      sort_order:        i + 1
    })

  return system
```

---

## CLASS — CREATE

```
function createClass(orgId, schoolYearId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  // All required fields
  required = ["title", "subject_id", "semester_id", "term_id",
              "educator_id", "weekdays", "time_start"]
  for each field in required:
    if not payload[field]:
      throw VALIDATION_ERROR(field + " is required")

  // Validate all references
  validateExists(DB.subjects,   payload.subject_id,   orgId)
  validateExists(DB.semesters,  payload.semester_id,  orgId)
  validateExists(DB.terms,      payload.term_id,       orgId)
  validateExists(DB.educators,  payload.educator_id,  orgId)

  if payload.section_id:
    validateExists(DB.sections, payload.section_id, orgId)

  // Weekdays must be valid and not exceed 5
  VALID_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"]
  for each day in payload.weekdays:
    if day not in VALID_DAYS:
      throw VALIDATION_ERROR("Invalid weekday: " + day)
  if payload.weekdays.length > 5:
    throw VALIDATION_ERROR("Cannot schedule more than 5 days per week")

  // Schedule conflict check — runs across all active classes in org
  checkScheduleConflicts(orgId, schoolYearId, payload)

  newClass = DB.classes.insert({
    id:             generateUUID(),
    org_id:         orgId,
    school_year_id: schoolYearId,
    subject_id:     payload.subject_id,
    semester_id:    payload.semester_id,
    term_id:        payload.term_id,
    section_id:     payload.section_id or null,
    educator_id:    payload.educator_id,
    title:          payload.title,
    weekdays:       payload.weekdays,
    time_start:     payload.time_start,
    capacity_type:  payload.capacity_type or "unlimited",
    capacity_limit: payload.capacity_limit or null,
    is_archived:    false,
    deleted_at:     null,
    created_at:     NOW()
  })

  // Add educator to history log
  DB.class_educator_history.insert({
    id:            generateUUID(),
    org_id:        orgId,
    class_id:      newClass.id,
    educator_id:   payload.educator_id,
    assigned_from: NOW(),
    assigned_to:   null   // currently active
  })

  // Generate class sessions from schedule + calendar
  generateClassSessions(orgId, newClass.id)

  return newClass
```

---

## SCHEDULE CONFLICT CHECK

```
function checkScheduleConflicts(orgId, schoolYearId, payload):
  // Type 1 — same section cannot have two classes at same weekday + time
  if payload.section_id:
    for each day in payload.weekdays:
      conflict = DB.classes.findOne({
        org_id:         orgId,
        school_year_id: schoolYearId,
        section_id:     payload.section_id,
        time_start:     payload.time_start,
        weekdays:       { CONTAINS: day },
        deleted_at:     null,
        is_archived:    false
      })
      if conflict:
        throw CONFLICT(
          "Schedule conflict: Section already has a class on " +
          day + " at " + payload.time_start
        )

  // Type 2 — same educator cannot teach two classes at same weekday + time
  for each day in payload.weekdays:
    educatorConflict = DB.classes.findOne({
      org_id:         orgId,
      school_year_id: schoolYearId,
      educator_id:    payload.educator_id,
      time_start:     payload.time_start,
      weekdays:       { CONTAINS: day },
      deleted_at:     null,
      is_archived:    false
    })
    if educatorConflict:
      throw CONFLICT(
        "Schedule conflict: Educator is already teaching another class on " +
        day + " at " + payload.time_start
      )
```

---

## CLASS SESSIONS — GENERATE

```
function generateClassSessions(orgId, classId):
  classObj    = DB.classes.findOne({ id: classId, org_id: orgId })
  semester    = DB.semesters.findOne({ id: classObj.semester_id })
  eventDates  = DB.calendar_events
    .findAll({
      org_id:      orgId,
      event_type:  { IN: ["holiday", "no_class_day"] }
    })
    .map(e => e.date)

  sessionDate = semester.start_date
  weekNumber  = 1
  sessions    = []

  while sessionDate <= semester.end_date:
    // Find all matching weekdays in this calendar week
    matchingDays = classObj.weekdays
      .filter(day => dayOfWeek(sessionDate) == day
                     or isInSameCalendarWeek(sessionDate, day))
      .sortBy(weekdayOrder)

    subIndex = 1
    for each day in matchingDays:
      actualDate = getDateOfWeekday(sessionDate, day)   // exact date for that weekday
      if actualDate > semester.end_date:
        continue

      isSkipped = actualDate in eventDates

      weekLabel = classObj.weekdays.length == 1
        ? "Week " + weekNumber
        : "Week " + weekNumber + "." + subIndex

      DB.class_sessions.insert({
        id:           generateUUID(),
        org_id:       orgId,
        class_id:     classId,
        session_date: actualDate,
        week_label:   weekLabel,
        is_skipped:   isSkipped,
        created_at:   NOW()
      })

      if not isSkipped:
        subIndex++

    // Move to next calendar week
    sessionDate = nextMonday(sessionDate)
    if not isSkipped:
      weekNumber++

  return sessions
```

---

## CLASS CAPACITY OVERFLOW RESOLUTION

```
function resolveClassCapacityOverflow(orgId, studentId, classId, choice, newClassPayload):
  requireRole("admin")
  requireOrgMatch(orgId)

  if choice == "A":
    // Create a new parallel class with same settings, different schedule
    originalClass = DB.classes.findOne({ id: classId, org_id: orgId })

    if not newClassPayload.weekdays or not newClassPayload.time_start:
      throw VALIDATION_ERROR("New session requires weekdays and time")

    newClass = createClass(orgId, originalClass.school_year_id, {
      ...originalClass,
      weekdays:  newClassPayload.weekdays,
      time_start: newClassPayload.time_start,
      title:     originalClass.title + " (Section 2)"
    })

    // Enroll the overflow student in the new class
    addStudentEnrollment(orgId, studentId, newClass.id)

    logAdminAudit(orgId, "class_capacity_resolved_new_session", "class", classId, {
      new_class_id: newClass.id,
      student_id:   studentId
    })
    return { outcome: "new_class_created", new_class: newClass }

  else if choice == "B":
    // Mark student as pending enrollment for this subject
    DB.enrollments.insert({
      id:          generateUUID(),
      org_id:      orgId,
      class_id:    classId,
      student_id:  studentId,
      enrolled_by: getCurrentAdminId(),
      status:      "pending_enrollment",
      enrolled_at: NOW()
    })

    sendNotification({
      org_id:         orgId,
      recipient_role: "admin",
      recipient_id:   getCurrentAdminId(),
      trigger_type:   "enrollment_pending_capacity",
      message:        "Student " + getStudentName(studentId) +
                      " could not be enrolled in class " + getClassTitle(classId) +
                      " — class is at capacity."
    })

    logAdminAudit(orgId, "class_capacity_resolved_pending", "class", classId, {
      student_id: studentId
    })
    return { outcome: "student_pending_enrollment" }
```

---

## EDUCATOR REASSIGNMENT — MID SEMESTER

```
function reassignClassEducator(orgId, classId, newEducatorId, reason):
  requireRole("admin")
  requireOrgMatch(orgId)

  classObj = DB.classes.findOne({ id: classId, org_id: orgId })
  if not classObj:
    throw NOT_FOUND("Class not found")
  if classObj.is_archived:
    throw CONFLICT("Cannot reassign an archived class")

  newEducator = DB.educators.findOne({ id: newEducatorId, org_id: orgId })
  if not newEducator:
    throw NOT_FOUND("Educator not found")

  // Close current educator history record
  activeHistory = DB.class_educator_history.findOne({
    class_id:    classId,
    assigned_to: null   // currently active
  })
  DB.class_educator_history.update(activeHistory.id, {
    assigned_to: NOW()
  })

  // Open new educator history record
  DB.class_educator_history.insert({
    id:            generateUUID(),
    org_id:        orgId,
    class_id:      classId,
    educator_id:   newEducatorId,
    assigned_from: NOW(),
    assigned_to:   null,
    reason:        reason or null,
    created_at:    NOW()
  })

  // Update the class itself
  DB.classes.update(classId, {
    educator_id: newEducatorId,
    updated_at:  NOW()
  })

  // Notify the new educator
  sendNotification({
    org_id:         orgId,
    recipient_role: "educator",
    recipient_id:   newEducatorId,
    trigger_type:   "class_reassigned",
    message:        "You have been assigned to class: " + classObj.title
  })

  logAdminAudit(orgId, "educator_reassignment", "class", classId, {
    old_educator_id: activeHistory.educator_id,
    new_educator_id: newEducatorId,
    reason:          reason
  })

  // New educator inherits everything — no data migration needed
  // All lessons, assessments, grades, attendance remain on class_id
  // Attribution of past grades is preserved via class_educator_history
  return { message: "Class reassigned successfully" }
```

---

## CLASS — ARCHIVE

```
function archiveClass(orgId, classId):
  requireRole("admin")
  requireOrgMatch(orgId)

  classObj = DB.classes.findOne({ id: classId, org_id: orgId })
  if not classObj:
    throw NOT_FOUND("Class not found")
  if classObj.is_archived:
    throw CONFLICT("Class is already archived")

  // Ensure all grades are locked before archiving
  unlockedGrades = DB.term_grades.findAll({
    class_id:  classId,
    org_id:    orgId,
    is_locked: false
  })
  if unlockedGrades.length > 0:
    warnings.add(
      unlockedGrades.length + " term grade record(s) are not yet locked."
    )

  DB.classes.update(classId, {
    is_archived: true,
    deleted_at:  NOW(),    // soft delete — record stays in DB
    updated_at:  NOW()
  })

  // Close current educator history record
  activeHistory = DB.class_educator_history.findOne({
    class_id:    classId,
    assigned_to: null
  })
  if activeHistory:
    DB.class_educator_history.update(activeHistory.id, {
      assigned_to: NOW()
    })

  return { message: "Class archived. Records are preserved." }
```