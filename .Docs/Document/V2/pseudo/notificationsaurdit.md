# EduTool — Notification System & Audit Logs
## Pseudo Code Reference

---

## NOTIFICATIONS

### SEND NOTIFICATION (internal helper — called throughout the system)

```
function sendNotification(payload):
  // Called from any service layer whenever a trigger event occurs

  if not payload.org_id:
    throw ERROR("org_id is required on all notifications")
  if not payload.recipient_role or not payload.recipient_id:
    throw ERROR("recipient_role and recipient_id are required")
  if not payload.trigger_type or not payload.message:
    throw ERROR("trigger_type and message are required")

  DB.notifications.insert({
    id:                  generateUUID(),
    org_id:              payload.org_id,
    recipient_role:      payload.recipient_role,  // "admin" | "educator" | "student"
    recipient_id:        payload.recipient_id,
    trigger_type:        payload.trigger_type,
    message:             payload.message,
    related_entity_type: payload.related_entity_type or null,
    related_entity_id:   payload.related_entity_id or null,
    created_at:          NOW(),
    archived_at:         null
  })
  // No email, no SMS — in-app only
  // No read/unread state — simple ordered list
```

---

### GET NOTIFICATIONS — FOR CURRENT USER

```
function getNotifications(orgId, recipientRole, recipientId):
  requireOrgMatch(orgId)

  // Only return active (non-archived) notifications for this recipient
  notifications = DB.notifications
    .findAll({
      org_id:         orgId,
      recipient_role: recipientRole,
      recipient_id:   recipientId,
      archived_at:    null           // exclude archived (90+ day old)
    })
    .orderBy("created_at", DESC)

  return notifications
```

---

### ARCHIVE OLD NOTIFICATIONS (cron — runs daily)

```
function archiveOldNotifications():
  cutoff = NOW().subtractDays(90)

  DB.notifications.updateAll(
    {
      archived_at: null,
      created_at:  { LT: cutoff }
    },
    {
      archived_at: NOW()
    }
  )
  // Archived notifications are NOT deleted — they stay in DB
  // They just disappear from active notification list queries
```

---

### ALL NOTIFICATION TRIGGER TYPES (reference)

```
NOTIFICATION_TRIGGERS = {

  // Educator receives
  "concept_extraction_complete":     "Concept extraction complete for lesson: {title}",
  "concept_extraction_failed":       "Concept extraction failed for lesson: {title}. Please retry.",
  "assessment_generation_complete":  "Assessment generation complete: {title}",
  "assessment_generation_failed":    "Generation failed for: {title}. Please retry.",
  "class_reassigned":                "You have been assigned to class: {title}",
  "grade_lock_window_opened":        "Grade lock window is now open. Deadline: {deadline}",
  "auto_lock_applied":               "Grades for class {title} were auto-locked at the deadline.",
  "student_added_to_class":          "New student {name} has been added to your class {title} by Admin.",
  "student_removed_from_class":      "Student {name} has been removed from your class {title} by Admin.",

  // Student receives
  "assessment_released":             "Assessment is now available: {title}",
  "assessment_deadline_approaching": "Reminder: {title} closes in {hours} hours.",
  "score_published":                 "Your score for {title} is now available.",
  "grades_locked":                   "Your grades have been finalized. All scores are now visible.",
  "meeting_created":                 "A meeting has been scheduled: {title} on {datetime}",
  "enrollment_confirmed":            "You have been enrolled in: {class_title}",

  // Admin receives
  "enrollment_pending_capacity":     "Student {name} could not be enrolled in {class_title} — class is at capacity."
}
```

---

## AUDIT LOGS

### LOG ADMIN AUDIT (internal helper — append only)

```
function logAdminAudit(orgId, actionType, targetEntityType, targetEntityId, details):
  // Called throughout admin-level operations
  // Uses a write-only DB connection — no SELECT/UPDATE/DELETE possible

  DB.admin_audit_log.insert({
    id:                 generateUUID(),
    org_id:             orgId,
    actor_id:           getCurrentAdminId(),
    action_type:        actionType,
    target_entity_type: targetEntityType,
    target_entity_id:   targetEntityId,
    details:            details,   // JSONB — old/new values, reasons, affected IDs
    created_at:         NOW()
  })
  // Never updated, never deleted — append only
```

---

### LOG EDUCATOR ACTIVITY (internal helper — append only)

```
function logEducatorActivity(orgId, classId, eventType, details):
  DB.educator_activity_log.insert({
    id:          generateUUID(),
    org_id:      orgId,
    class_id:    classId,
    educator_id: getCurrentEducatorId(),
    event_type:  eventType,
    details:     details,
    created_at:  NOW()
  })
```

---

### QUERY ADMIN AUDIT LOG

```
function getAdminAuditLog(orgId, filters):
  requireRole("admin")
  requireOrgMatch(orgId)

  query = DB.admin_audit_log
    .where({ org_id: orgId })
    .orderBy("created_at", DESC)

  if filters.date_from:
    query = query.where("created_at >= ?", [filters.date_from])
  if filters.date_to:
    query = query.where("created_at <= ?", [filters.date_to])
  if filters.action_type:
    query = query.where({ action_type: filters.action_type })
  if filters.target_entity_type:
    query = query.where({ target_entity_type: filters.target_entity_type })
  if filters.target_entity_id:
    query = query.where({ target_entity_id: filters.target_entity_id })

  return query.paginate(filters.page, filters.per_page or 50)
  // RLS ensures org_id scoping — no cross-org logs possible
```

---

### QUERY EDUCATOR ACTIVITY LOG

```
function getEducatorActivityLog(orgId, classId, filters):
  session = getSession()

  if session.role == "educator":
    // Educator sees only their own logs
    query = DB.educator_activity_log
      .where({
        org_id:      orgId,
        educator_id: session.id
      })
    if classId:
      query = query.where({ class_id: classId })

  else if session.role == "admin":
    // Admin can see all educator logs in their org
    requireOrgMatch(orgId)
    query = DB.educator_activity_log.where({ org_id: orgId })
    if classId:
      query = query.where({ class_id: classId })

  else:
    throw FORBIDDEN("Not authorized to view activity logs")

  if filters.event_type:
    query = query.where({ event_type: filters.event_type })
  if filters.date_from:
    query = query.where("created_at >= ?", [filters.date_from])

  return query.orderBy("created_at", DESC)
    .paginate(filters.page, filters.per_page or 50)
```

---

### ALL AUDIT LOG ACTION TYPES (reference)

```
ADMIN_AUDIT_ACTION_TYPES = [
  "student_created",
  "student_profile_changed",      // { field, old_value, new_value }
  "student_status_changed",       // { old_status, new_status }
  "section_assigned",
  "section_capacity_resolved_new_section",
  "section_capacity_resolved_pending",
  "enrollment_add",
  "enrollment_remove",
  "class_capacity_resolved_new_session",
  "class_capacity_resolved_pending",
  "educator_reassignment",        // { old_educator_id, new_educator_id, reason }
  "password_reset",               // { reset_by }
  "grade_lock_override",          // { class_id, term_id, student_id, unlocked_by }
  "calendar_event_created",
  "calendar_event_modified"
]

EDUCATOR_ACTIVITY_EVENT_TYPES = [
  "lesson_created",
  "lesson_updated",
  "concept_extraction_triggered",
  "concept_extraction_complete",
  "assessment_created",
  "assessment_generation_complete",
  "assessment_deleted",
  "score_published",
  "score_unpublished",
  "grade_locked",
  "grade_locked_auto",
  "meeting_created",
  "meeting_started",
  "meeting_ended",
  "student_enrolled",             // triggered when Admin adds student
  "student_removed"               // triggered by educator or Admin
]
```

---

## EXPORT — CLASS GRADES CSV

```
function exportClassGradesCSV(orgId, classId, termId):
  requireClassAccess(orgId, classId)

  classObj      = DB.classes.findOne({ id: classId, org_id: orgId })
  gradingSystem = getClassGradingSystem(orgId, classId)
  categories    = gradingSystem.categories
  students      = DB.enrollments
    .findAll({ class_id: classId, org_id: orgId, status: "active" })
    .map(e => DB.students.findOne({ id: e.student_id }))

  // Build CSV headers
  headers = ["Student Name", "Student ID"]
  for each cat in categories:
    headers.push(cat.label + " (earned)")
    headers.push(cat.label + " (total)")
  headers.push("Term Grade")
  headers.push("Grade Value")
  headers.push("Remark")
  headers.push("Passing")

  rows = students.map(student => {
    termGrade = DB.term_grades.findOne({
      org_id: orgId, class_id: classId,
      student_id: student.id, term_id: termId
    })
    row = [student.full_name, student.student_code]

    for each cat in categories:
      catScore = DB.term_grade_category_scores.findOne({
        term_grade_id: termGrade ? termGrade.id : null,
        category_id:   cat.id
      })
      row.push(catScore ? catScore.earned_points : 0)
      row.push(catScore ? catScore.total_points : 0)

    row.push(termGrade ? termGrade.computed_grade : "N/A")
    row.push(termGrade ? termGrade.grade_value : "N/A")
    row.push(termGrade ? termGrade.remark : "N/A")
    row.push(termGrade ? (termGrade.computed_grade >= getPassingThreshold(orgId, classObj.program_id) ? "Yes" : "No") : "N/A")
    return row
  })

  return buildCSV(headers, rows)
```

---

## EXPORT — STUDENT CLASS CARD PDF

```
function exportStudentClassCard(orgId, classId, studentId):
  requireClassAccess(orgId, classId)

  classObj  = DB.classes.findOne({ id: classId, org_id: orgId })
  subject   = DB.subjects.findOne({ id: classObj.subject_id })
  student   = DB.students.findOne({ id: studentId, org_id: orgId })
  org       = DB.organizations.findOne({ id: orgId })
  schoolYear = DB.school_years.findOne({ id: classObj.school_year_id })
  semester  = DB.semesters.findOne({ id: classObj.semester_id })

  // Get active educator at grade finalization time
  finalEducatorHistory = DB.class_educator_history
    .findAll({ class_id: classId })
    .sortBy("assigned_from", DESC)
    .first()
  educator = DB.educators.findOne({ id: finalEducatorHistory.educator_id })

  terms = DB.terms
    .findAll({ semester_id: semester.id, org_id: orgId })
    .orderBy("sort_order", ASC)

  termBreakdowns = terms.map(term => {
    termGrade = DB.term_grades.findOne({
      org_id: orgId, class_id: classId,
      student_id: studentId, term_id: term.id
    })
    categories = getClassGradingSystem(orgId, classId).categories
    catScores = categories.map(cat => {
      cs = DB.term_grade_category_scores.findOne({
        term_grade_id: termGrade ? termGrade.id : null,
        category_id: cat.id
      })
      return { label: cat.label, earned: cs ? cs.earned_points : 0,
               total: cs ? cs.total_points : 0 }
    })
    return {
      term_label:  term.label,
      cat_scores:  catScores,
      final_grade: termGrade ? termGrade.computed_grade : null,
      grade_value: termGrade ? termGrade.grade_value : null,
      remark:      termGrade ? termGrade.remark : null
    }
  })

  semesterGrade = DB.semester_grades.findOne({
    org_id: orgId, class_id: classId,
    student_id: studentId, semester_id: semester.id
  })

  cardData = {
    org_name:       org.name,
    school_year:    schoolYear.title,
    semester:       semester.label,
    student_name:   student.full_name,
    student_id:     student.student_code,
    subject:        subject.title,
    educator:       educator.full_name,
    term_grades:    termBreakdowns,
    overall_grade:  semesterGrade ? semesterGrade.computed_grade : null,
    grade_value:    semesterGrade ? semesterGrade.grade_value : null,
    remark:         semesterGrade ? semesterGrade.remark : null,
    is_passing:     semesterGrade ? semesterGrade.is_passing : null
  }

  return PDFGenerator.renderClassCard(cardData)
```