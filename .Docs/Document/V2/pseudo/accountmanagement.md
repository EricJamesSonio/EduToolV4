# EduTool — Account Management (Educators & Students)
## Pseudo Code Reference

---

## EDUCATOR ACCOUNT — CREATE

```
function createEducator(orgId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  if not payload.full_name or not payload.email:
    throw VALIDATION_ERROR("full_name and email are required")
  if not isValidEmail(payload.email):
    throw VALIDATION_ERROR("Invalid email format")

  // Email must be unique within this org
  existing = DB.educators.findOne({
    org_id: orgId,
    email:  payload.email
  })
  if existing:
    throw CONFLICT("An educator with this email already exists in this org")

  plain_password  = generatePassword(length: 10)
  educator_code   = generateEducatorCode(orgId)  // auto-generated, unique within org

  educator = DB.educators.insert({
    id:             generateUUID(),
    org_id:         orgId,
    educator_code:  educator_code,
    full_name:      payload.full_name,
    email:          payload.email,
    password_hash:  bcrypt.hash(plain_password),
    created_at:     NOW()
  })

  return {
    educator:       educator,
    plain_password: plain_password
  }
```

---

## EDUCATOR ACCOUNT — SEARCH

```
function searchEducators(orgId, filters):
  requireRole("admin")
  requireOrgMatch(orgId)

  query = DB.educators.where({
    org_id:     orgId,
    deleted_at: null
  })

  if filters.educator_code:
    query = query.where("educator_code ILIKE ?", ["%" + filters.educator_code + "%"])
  if filters.name:
    query = query.where("full_name ILIKE ?", ["%" + filters.name + "%"])

  return query.orderBy("full_name", ASC)
  // RLS ensures only this org's educators are returned regardless of filters
```

---

## EDUCATOR ACCOUNT — VIEW DETAIL

```
function getEducatorDetail(orgId, educatorId):
  requireRole("admin")
  requireOrgMatch(orgId)

  educator = DB.educators.findOne({
    id:         educatorId,
    org_id:     orgId,
    deleted_at: null
  })
  if not educator:
    throw NOT_FOUND("Educator not found")

  assignedClasses = DB.classes.findAll({
    org_id:      orgId,
    educator_id: educatorId,
    is_archived: false,
    deleted_at:  null
  })

  return { educator, assignedClasses }
```

---

## EDUCATOR ACCOUNT — REMOVE

```
function removeEducator(orgId, educatorId):
  requireRole("admin")
  requireOrgMatch(orgId)

  educator = DB.educators.findOne({ id: educatorId, org_id: orgId })
  if not educator:
    throw NOT_FOUND("Educator not found")

  // Block removal if active classes still exist
  activeClasses = DB.classes.findAll({
    org_id:      orgId,
    educator_id: educatorId,
    is_archived: false,
    deleted_at:  null
  })
  if activeClasses.length > 0:
    throw CONFLICT(
      "Cannot remove educator — " + activeClasses.length +
      " active class(es) still assigned. Reassign all classes first."
    )

  DB.educators.update(educatorId, {
    deleted_at: NOW()
  })

  return { message: "Educator removed successfully" }
```

---

## STUDENT ACCOUNT — CREATE

```
function createStudent(orgId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  // Required fields
  required = ["full_name", "email", "student_code",
              "program_id", "grade_year_level"]
  for each field in required:
    if not payload[field]:
      throw VALIDATION_ERROR(field + " is required")

  if not isValidEmail(payload.email):
    throw VALIDATION_ERROR("Invalid email format")

  // Uniqueness within org
  codeExists = DB.students.findOne({
    org_id:       orgId,
    student_code: payload.student_code
  })
  if codeExists:
    throw CONFLICT("Student ID " + payload.student_code + " already exists in this org")

  emailExists = DB.students.findOne({
    org_id: orgId,
    email:  payload.email
  })
  if emailExists:
    throw CONFLICT("A student with this email already exists in this org")

  // Validate program / course / section references exist in this org
  validateStudentProfileReferences(orgId, payload)

  plain_password = generatePassword(length: 10)

  student = DB.students.insert({
    id:               generateUUID(),
    org_id:           orgId,
    student_code:     payload.student_code,
    full_name:        payload.full_name,
    email:            payload.email,
    password_hash:    bcrypt.hash(plain_password),
    status:           "pending",   // always starts pending until section validated
    program_id:       payload.program_id,
    course_id:        payload.course_id or null,
    grade_year_level: payload.grade_year_level,
    section_id:       null,         // set after capacity check
    school_year_id:   payload.school_year_id,
    created_at:       NOW()
  })

  // Run section capacity check and resolve
  result = resolveStudentSection(orgId, student.id, payload.section_id)

  logAdminAudit(orgId, "student_created", "student", student.id, {
    student_code: payload.student_code,
    section_outcome: result.outcome
  })

  return {
    student:        DB.students.findOne({ id: student.id }),
    section_result: result,
    plain_password: plain_password
  }
```

---

## STUDENT PROFILE REFERENCES — VALIDATE

```
function validateStudentProfileReferences(orgId, payload):
  program = DB.programs.findOne({
    id:     payload.program_id,
    org_id: orgId
  })
  if not program:
    throw VALIDATION_ERROR("Program not found in this org")

  if payload.course_id:
    course = DB.courses.findOne({
      id:         payload.course_id,
      org_id:     orgId,
      program_id: payload.program_id
    })
    if not course:
      throw VALIDATION_ERROR("Course not found under this program in this org")

  // If section_id provided, ensure it belongs to the correct level/course
  if payload.section_id:
    section = DB.sections.findOne({
      id:               payload.section_id,
      org_id:           orgId,
      grade_year_level: payload.grade_year_level,
      course_id:        payload.course_id or null
    })
    if not section:
      throw VALIDATION_ERROR("Section not found for the specified level/course in this org")
```

---

## STUDENT SECTION — RESOLVE CAPACITY

```
function resolveStudentSection(orgId, studentId, requestedSectionId):
  if not requestedSectionId:
    // No section provided — student stays pending
    DB.students.update(studentId, {
      section_id: null,
      status:     "pending",
      updated_at: NOW()
    })
    return { outcome: "no_section_provided", status: "pending" }

  section = DB.sections.findOne({ id: requestedSectionId, org_id: orgId })
  atCapacity = isSectionAtCapacity(requestedSectionId, orgId)

  if not atCapacity:
    // Normal path — assign section and activate student
    DB.students.update(studentId, {
      section_id: requestedSectionId,
      status:     "active",
      updated_at: NOW()
    })
    logAdminAudit(orgId, "section_assigned", "student", studentId, {
      section_id: requestedSectionId
    })
    return { outcome: "assigned", status: "active" }

  // Capacity reached — prompt Admin for decision
  // This returns a choice prompt to the UI; Admin resolves interactively
  return {
    outcome:          "capacity_reached",
    section_id:       requestedSectionId,
    section_name:     section.name,
    current_count:    getSectionHeadcount(requestedSectionId, orgId),
    capacity:         section.capacity,
    options: [
      { key: "A", label: "Create a new section" },
      { key: "B", label: "Leave student with no section (Pending)" }
    ]
  }


function resolveCapacityChoice(orgId, studentId, choice, newSectionPayload):
  requireRole("admin")
  requireOrgMatch(orgId)

  student = DB.students.findOne({ id: studentId, org_id: orgId })
  if not student:
    throw NOT_FOUND("Student not found")

  if choice == "A":
    // Admin creates a new section — no auto-naming, Admin provides name
    if not newSectionPayload.name:
      throw VALIDATION_ERROR("Section name is required")

    newSection = DB.sections.insert({
      id:               generateUUID(),
      org_id:           orgId,
      school_year_id:   student.school_year_id,
      program_id:       student.program_id,
      course_id:        student.course_id,
      grade_year_level: student.grade_year_level,
      name:             newSectionPayload.name,
      capacity:         newSectionPayload.capacity,
      created_at:       NOW()
    })

    DB.students.update(studentId, {
      section_id: newSection.id,
      status:     "active",
      updated_at: NOW()
    })

    logAdminAudit(orgId, "section_capacity_resolved_new_section", "student", studentId, {
      new_section_id:   newSection.id,
      new_section_name: newSection.name
    })
    return { outcome: "new_section_created", section: newSection, student_status: "active" }

  else if choice == "B":
    // Leave student with no section — status remains pending
    DB.students.update(studentId, {
      section_id: null,
      status:     "pending",
      updated_at: NOW()
    })
    logAdminAudit(orgId, "section_capacity_resolved_pending", "student", studentId, {
      reason: "capacity_reached_deferred"
    })
    return { outcome: "student_pending", student_status: "pending" }

  else:
    throw VALIDATION_ERROR("Invalid choice. Must be 'A' or 'B'.")
```

---

## STUDENT ACCOUNT — UPDATE STATUS

```
function updateStudentStatus(orgId, studentId, newStatus):
  requireRole("admin")
  requireOrgMatch(orgId)

  VALID_STATUSES = ["active", "pending", "dropped", "transferred",
                    "suspended", "graduated"]
  if newStatus not in VALID_STATUSES:
    throw VALIDATION_ERROR("Invalid status")

  student = DB.students.findOne({ id: studentId, org_id: orgId })
  if not student:
    throw NOT_FOUND("Student not found")

  oldStatus = student.status

  // Irreversible status transitions — require explicit confirmation
  IRREVERSIBLE = ["dropped", "transferred", "graduated"]
  if oldStatus in IRREVERSIBLE and newStatus == "active":
    throw CONFIRMATION_REQUIRED(
      "Reversing " + oldStatus + " to active is irreversible action. " +
      "This will be logged. Please confirm."
    )
    // Caller must pass confirmed: true to proceed

  DB.students.update(studentId, {
    status:     newStatus,
    updated_at: NOW()
  })

  // Handle enrollment side effects
  if newStatus in ["dropped", "transferred"]:
    // Soft-remove all active enrollments
    DB.enrollments.updateAll(
      { student_id: studentId, org_id: orgId, deleted_at: null },
      { status: "dropped", deleted_at: NOW() }
    )

  logAdminAudit(orgId, "student_status_changed", "student", studentId, {
    old_status: oldStatus,
    new_status: newStatus
  })

  return DB.students.findOne({ id: studentId })
```

---

## STUDENT ENROLLMENT — ADD SUBJECT

```
function addStudentEnrollment(orgId, studentId, classId):
  requireRole("admin")
  requireOrgMatch(orgId)

  student = DB.students.findOne({
    id:     studentId,
    org_id: orgId,
    status: "active"   // only active students can be enrolled
  })
  if not student:
    throw VALIDATION_ERROR("Student not found or not active")

  targetClass = DB.classes.findOne({
    id:         classId,
    org_id:     orgId,
    deleted_at: null
  })
  if not targetClass:
    throw NOT_FOUND("Class not found")

  // Duplicate check — same subject, same semester
  duplicate = DB.enrollments.findOne({
    org_id:     orgId,
    student_id: studentId,
    deleted_at: null,
    class_id:   // any class for same subject + same semester
  })
  // More precisely:
  duplicate = DB.enrollments
    .join(DB.classes, "enrollments.class_id = classes.id")
    .findOne({
      "enrollments.org_id":     orgId,
      "enrollments.student_id": studentId,
      "enrollments.deleted_at": null,
      "classes.subject_id":     targetClass.subject_id,
      "classes.semester_id":    targetClass.semester_id
    })
  if duplicate:
    throw CONFLICT("Student is already enrolled in this subject for this semester")

  // Capacity check
  if targetClass.capacity_type == "limited":
    currentCount = DB.enrollments.count({
      class_id:   classId,
      org_id:     orgId,
      status:     "active",
      deleted_at: null
    })
    if currentCount >= targetClass.capacity_limit:
      return {
        outcome: "capacity_reached",
        options: [
          { key: "A", label: "Create a new parallel session" },
          { key: "B", label: "Leave student as Pending Enrollment" }
        ]
      }

  enrollment = DB.enrollments.insert({
    id:          generateUUID(),
    org_id:      orgId,
    class_id:    classId,
    student_id:  studentId,
    enrolled_by: getCurrentAdminId(),
    status:      "active",
    enrolled_at: NOW()
  })

  // Notify the educator
  sendNotification({
    org_id:         orgId,
    recipient_role: "educator",
    recipient_id:   targetClass.educator_id,
    trigger_type:   "student_added_to_class",
    message:        "New student " + student.full_name +
                    " has been added to your class " + targetClass.title +
                    " by Admin."
  })

  logAdminAudit(orgId, "enrollment_add", "enrollment", enrollment.id, {
    student_id: studentId,
    class_id:   classId
  })

  return enrollment
```

---

## STUDENT ENROLLMENT — REMOVE SUBJECT

```
function removeStudentEnrollment(orgId, studentId, enrollmentId):
  requireRole("admin")
  requireOrgMatch(orgId)

  enrollment = DB.enrollments.findOne({
    id:         enrollmentId,
    org_id:     orgId,
    student_id: studentId,
    deleted_at: null
  })
  if not enrollment:
    throw NOT_FOUND("Enrollment not found")

  // Check for existing grades or submissions — warn Admin
  hasSubmissions = DB.assessment_assignments.count({
    org_id:     orgId,
    student_id: studentId,
    status:     ["submitted", "customized", "exempted"]
  }) > 0

  hasGrades = DB.term_grades.count({
    org_id:     orgId,
    student_id: studentId,
    class_id:   enrollment.class_id
  }) > 0

  if hasSubmissions or hasGrades:
    warnings.add(
      "This student has existing submissions or grades. " +
      "Records will be archived (soft-deleted), not wiped. Confirm to proceed."
    )
    // Caller must pass confirmed: true

  // Soft-delete the enrollment
  DB.enrollments.update(enrollmentId, {
    status:     "dropped",
    dropped_at: NOW(),
    deleted_at: NOW()
  })

  targetClass = DB.classes.findOne({ id: enrollment.class_id })

  sendNotification({
    org_id:         orgId,
    recipient_role: "educator",
    recipient_id:   targetClass.educator_id,
    trigger_type:   "student_removed_from_class",
    message:        "Student " + getStudentName(studentId) +
                    " has been removed from your class " +
                    targetClass.title + " by Admin."
  })

  logAdminAudit(orgId, "enrollment_remove", "enrollment", enrollmentId, {
    student_id: studentId,
    class_id:   enrollment.class_id
  })

  return { message: "Enrollment removed. Records are archived." }
```

---

## PASSWORD RESET — BULK OR TARGETED

```
function resetPasswords(orgId, scope, targetIds):
  requireRole("admin")
  requireOrgMatch(orgId)

  // scope: "all_students" | "all_educators" | "both" | "selected"
  accounts = []

  if scope == "all_students" or scope == "both":
    accounts += DB.students.findAll({ org_id: orgId, deleted_at: null })
  if scope == "all_educators" or scope == "both":
    accounts += DB.educators.findAll({ org_id: orgId, deleted_at: null })
  if scope == "selected":
    if not targetIds or targetIds.length == 0:
      throw VALIDATION_ERROR("No accounts selected")
    accounts = DB.students.findAll({ id: { IN: targetIds }, org_id: orgId })
              + DB.educators.findAll({ id: { IN: targetIds }, org_id: orgId })

  results = []
  for each account in accounts:
    new_plain = generatePassword(length: 10)
    table = account.type == "student" ? DB.students : DB.educators

    table.update(account.id, {
      password_hash: bcrypt.hash(new_plain),
      updated_at:    NOW()
    })

    // Invalidate all active sessions for this account
    DB.sessions.deleteAll({ user_id: account.id })

    results.push({
      id:             account.id,
      full_name:      account.full_name,
      code:           account.student_code or account.educator_code,
      email:          account.email,
      plain_password: new_plain
    })

    logAdminAudit(orgId, "password_reset", account.type, account.id, {
      reset_by: getCurrentAdminId()
    })

  // Results are returned as CSV-downloadable data
  return generateCredentialsCSV(results)
```

---

## BULK STUDENT IMPORT

```
function bulkImportStudents(orgId, schoolYearId, csvFile):
  requireRole("admin")
  requireOrgMatch(orgId)

  rows = parseCSV(csvFile)
  validRows   = []
  errorRows   = []

  for i, row in enumerate(rows):
    errors = []

    // Required fields
    for field in ["full_name", "student_code", "email",
                  "program_type", "grade_year_level"]:
      if not row[field]:
        errors.push("Missing required field: " + field)

    if row.email and not isValidEmail(row.email):
      errors.push("Invalid email format")

    if row.student_code:
      duplicate = DB.students.findOne({
        org_id:       orgId,
        student_code: row.student_code
      })
      if duplicate:
        errors.push("Student ID " + row.student_code + " already exists")

    if row.email:
      emailDupe = DB.students.findOne({ org_id: orgId, email: row.email })
      if emailDupe:
        errors.push("Email " + row.email + " already exists")

    // Validate references exist in this org
    try:
      validateStudentProfileReferences(orgId, mapRowToPayload(row, schoolYearId))
    catch err:
      errors.push(err.message)

    if errors.length == 0:
      validRows.push(row)
    else:
      errorRows.push({ row_number: i + 1, data: row, errors })

  // Return validation report before creating any accounts
  report = {
    total:      rows.length,
    valid:      validRows.length,
    errors:     errorRows.length,
    error_list: errorRows
  }

  return { report, validRows, readyToImport: true }


function commitBulkImport(orgId, schoolYearId, validRows):
  requireRole("admin")
  requireOrgMatch(orgId)

  createdStudents = []

  for each row in validRows:
    payload = mapRowToPayload(row, schoolYearId)
    result  = createStudent(orgId, payload)   // runs full creation + capacity check
    createdStudents.push({
      student:        result.student,
      plain_password: result.plain_password,
      section_result: result.section_result
    })

  return generateCredentialsCSV(createdStudents)
```