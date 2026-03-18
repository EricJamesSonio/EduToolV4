# EduTool — Organization & School Year Management
## Pseudo Code Reference

---

## ADMIN LOGIN + ORG CONTEXT SETUP

```
function adminLogin(email, password):
  admin = DB.platform_admins.findOne({ email })
  if not admin:
    throw NOT_FOUND("Account does not exist")
  if admin.is_blocked:
    throw FORBIDDEN("This account has been blocked")
  if not bcrypt.verify(password, admin.password_hash):
    throw UNAUTHORIZED("Invalid credentials")

  org = DB.organizations.findOne({ admin_id: admin.id })

  session = createSession({
    role:   "admin",
    id:     admin.id,
    org_id: org ? org.id : null   // null if org not yet created
  })

  // Set DB session variable for Row Level Security
  DB.execute("SET app.current_org_id = ?", [session.org_id])
  DB.execute("SET app.current_role = 'admin'")

  return { session, org_exists: org != null }
```

---

## CREATE ORGANIZATION (first login only)

```
function createOrganization(adminId, payload):
  requireRole("admin")

  // Enforce one org per admin at DB level (unique constraint on admin_id)
  existing = DB.organizations.findOne({ admin_id: adminId })
  if existing:
    throw CONFLICT("Organization already exists for this admin")

  if not payload.name:
    throw VALIDATION_ERROR("Organization name is required")

  org = DB.organizations.insert({
    id:         generateUUID(),
    admin_id:   adminId,
    name:       payload.name,
    description: payload.description or "",
    created_at: NOW()
  })

  // Update session to include the new org_id
  updateSession({ org_id: org.id })
  DB.execute("SET app.current_org_id = ?", [org.id])

  return org
```

---

## LEVEL DEFAULTS — CREATE PROGRAM DEFAULT

```
// Called during initial org setup or when adding a new program type
function createLevelDefault(orgId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  levelDefault = DB.level_defaults.insert({
    id:            generateUUID(),
    org_id:        orgId,
    program_type:  payload.program_type,   // "elementary" | "high_school" | "senior_high" | "college" | "custom"
    program_label: payload.program_label,  // e.g. "TESDA Programs"
    created_at:    NOW()
  })

  return levelDefault
```

---

## LEVEL DEFAULTS — ADD DEFAULT COURSE (for college / senior high / custom)

```
function addDefaultCourse(orgId, levelDefaultId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  course = DB.level_default_courses.insert({
    id:               generateUUID(),
    org_id:           orgId,
    level_default_id: levelDefaultId,
    title:            payload.title,        // e.g. "BSCS", "STEM", "TechVoc"
    description:      payload.description,
    max_years:        payload.max_years,    // e.g. 4
    created_at:       NOW()
  })

  return course
```

---

## LEVEL DEFAULTS — ADD DEFAULT SECTION

```
function addDefaultSection(orgId, levelDefaultId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  section = DB.level_default_sections.insert({
    id:               generateUUID(),
    org_id:           orgId,
    level_default_id: levelDefaultId,
    course_id:        payload.course_id or null,
    grade_year_level: payload.grade_year_level,  // e.g. "Grade 3", "Year 2"
    name:             payload.name,              // e.g. "A", "Narra"
    default_capacity: payload.capacity,
    created_at:       NOW()
  })

  return section
```

---

## LEVEL DEFAULTS — UPDATE

```
// Updating defaults only affects future school years — never past ones
function updateDefaultSection(orgId, sectionId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  existing = DB.level_default_sections.findOne({
    id:     sectionId,
    org_id: orgId
  })
  if not existing:
    throw NOT_FOUND("Default section not found")

  DB.level_default_sections.update(sectionId, {
    name:             payload.name or existing.name,
    default_capacity: payload.capacity or existing.default_capacity,
    updated_at:       NOW()
  })

  // NOTE: This does NOT propagate to any existing school_year's sections
  // Past and active years keep their own independent copies
  return { message: "Default updated. Existing school years are unaffected." }
```

---

## CREATE SCHOOL YEAR

```
function createSchoolYear(orgId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  if not payload.title:
    throw VALIDATION_ERROR("Title is required")

  // Cannot have two active years simultaneously
  if payload.status == "active":
    activeExists = DB.school_years.findOne({
      org_id: orgId,
      status: "active"
    })
    if activeExists:
      throw CONFLICT("An active school year already exists")

  schoolYear = DB.school_years.insert({
    id:         generateUUID(),
    org_id:     orgId,
    title:      payload.title,
    status:     payload.status or "pending",
    created_at: NOW()
  })

  // Copy level defaults into this school year as a live independent copy
  copyLevelDefaultsToSchoolYear(orgId, schoolYear.id)

  return schoolYear


function copyLevelDefaultsToSchoolYear(orgId, schoolYearId):
  defaults = DB.level_defaults.findAll({ org_id: orgId })

  for each default in defaults:
    program = DB.programs.insert({
      id:             generateUUID(),
      org_id:         orgId,
      school_year_id: schoolYearId,
      program_type:   default.program_type,
      program_label:  default.program_label,
      created_at:     NOW()
    })

    defaultCourses = DB.level_default_courses.findAll({
      level_default_id: default.id
    })

    for each dc in defaultCourses:
      course = DB.courses.insert({
        id:             generateUUID(),
        org_id:         orgId,
        program_id:     program.id,
        school_year_id: schoolYearId,
        title:          dc.title,
        description:    dc.description,
        max_years:      dc.max_years,
        created_at:     NOW()
      })

      defaultSections = DB.level_default_sections.findAll({
        level_default_id: default.id,
        course_id:        dc.id
      })

      for each ds in defaultSections:
        DB.sections.insert({
          id:               generateUUID(),
          org_id:           orgId,
          school_year_id:   schoolYearId,
          program_id:       program.id,
          course_id:        course.id,
          grade_year_level: ds.grade_year_level,
          name:             ds.name,
          capacity:         ds.default_capacity,
          created_at:       NOW()
        })

    // Also copy non-course sections (elementary / high school)
    nonCourseSections = DB.level_default_sections.findAll({
      level_default_id: default.id,
      course_id:        null
    })
    for each ds in nonCourseSections:
      DB.sections.insert({
        id:               generateUUID(),
        org_id:           orgId,
        school_year_id:   schoolYearId,
        program_id:       program.id,
        course_id:        null,
        grade_year_level: ds.grade_year_level,
        name:             ds.name,
        capacity:         ds.default_capacity,
        created_at:       NOW()
      })
```

---

## ACTIVATE SCHOOL YEAR

```
function activateSchoolYear(orgId, schoolYearId):
  requireRole("admin")
  requireOrgMatch(orgId)

  targetYear = DB.school_years.findOne({ id: schoolYearId, org_id: orgId })
  if not targetYear:
    throw NOT_FOUND("School year not found")
  if targetYear.status == "active":
    throw CONFLICT("Already active")
  if targetYear.status == "ended":
    throw VALIDATION_ERROR("Cannot reactivate an ended school year")

  // End any currently active year first
  currentActive = DB.school_years.findOne({ org_id: orgId, status: "active" })
  if currentActive:
    DB.school_years.update(currentActive.id, {
      status:     "ended",
      updated_at: NOW()
    })

  DB.school_years.update(schoolYearId, {
    status:     "active",
    updated_at: NOW()
  })

  return { message: "School year is now active" }
```

---

## GET SCHOOL YEAR HISTORY

```
function getSchoolYears(orgId):
  requireRole("admin")
  requireOrgMatch(orgId)

  years = DB.school_years
    .findAll({ org_id: orgId })
    .orderBy("created_at", DESC)

  return years.map(y => ({
    id:     y.id,
    title:  y.title,
    status: y.status   // "pending" | "active" | "ended"
  }))
  // Past years are included but their data is read-only
  // The UI enforces read-only on status = "ended"
```

---

## SECTION MANAGEMENT

```
function createSection(orgId, schoolYearId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  if not payload.name:
    throw VALIDATION_ERROR("Section name is required")
  if not payload.capacity or payload.capacity < 1:
    throw VALIDATION_ERROR("Capacity must be at least 1")

  section = DB.sections.insert({
    id:               generateUUID(),
    org_id:           orgId,
    school_year_id:   schoolYearId,
    program_id:       payload.program_id,
    course_id:        payload.course_id or null,
    grade_year_level: payload.grade_year_level,
    name:             payload.name,       // always custom — no auto-naming
    capacity:         payload.capacity,
    created_at:       NOW()
  })

  return section


function getSectionHeadcount(sectionId, orgId):
  // Count only active students assigned to this section
  count = DB.students.count({
    org_id:     orgId,
    section_id: sectionId,
    status:     "active",
    deleted_at: null
  })
  return count


function isSectionAtCapacity(sectionId, orgId):
  section = DB.sections.findOne({ id: sectionId, org_id: orgId })
  headcount = getSectionHeadcount(sectionId, orgId)
  return headcount >= section.capacity
```

---

## ACADEMIC CALENDAR MANAGEMENT

```
function createCalendarEvent(orgId, schoolYearId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  VALID_TYPES = ["holiday", "no_class_day", "exam_week", "special_event"]
  if payload.event_type not in VALID_TYPES:
    throw VALIDATION_ERROR("Invalid event type")
  if not payload.date:
    throw VALIDATION_ERROR("Date is required")

  // Check if a session already exists on this date that would be affected
  affectedSessions = DB.class_sessions.findAll({
    org_id:       orgId,
    session_date: payload.date,
    is_skipped:   false
  })

  isRetroactive = payload.date < TODAY()
  if isRetroactive and affectedSessions.count > 0:
    // Warn admin — past records may need manual review
    warnings.add("This event is retroactive. " + affectedSessions.count +
                 " existing session records may need manual review.")

  event = DB.calendar_events.insert({
    id:             generateUUID(),
    org_id:         orgId,
    school_year_id: schoolYearId,
    event_type:     payload.event_type,
    title:          payload.title,
    date:           payload.date,
    notes:          payload.notes or null,
    created_at:     NOW()
  })

  // Auto-skip sessions on holiday or no_class_day
  if payload.event_type in ["holiday", "no_class_day"]:
    for each session in affectedSessions:
      DB.class_sessions.update(session.id, {
        is_skipped: true,
        updated_at: NOW()
      })
    // Recalculate week labels for affected classes
    for each classId in affectedSessions.map(s => s.class_id).unique():
      recalculateWeekLabels(classId, orgId)

  return { event, warnings }
```

---

## SEMESTER SETTINGS

```
function createSemesterSetting(orgId, payload):
  requireRole("admin")
  requireOrgMatch(orgId)

  if not payload.title:
    throw VALIDATION_ERROR("Title is required")
  if payload.semesters.length < 1 or payload.semesters.length > 3:
    throw VALIDATION_ERROR("Must have between 1 and 3 semesters")

  // Validate no overlapping date ranges
  sortedSems = payload.semesters.sortBy("start_date")
  for i in range(1, sortedSems.length):
    prev = sortedSems[i - 1]
    curr = sortedSems[i]
    if curr.start_date <= prev.end_date:
      throw VALIDATION_ERROR("Semester date ranges must not overlap")

  setting = DB.semester_settings.insert({
    id:         generateUUID(),
    org_id:     orgId,
    title:      payload.title,
    created_at: NOW()
  })

  for i, sem in enumerate(sortedSems):
    semester = DB.semesters.insert({
      id:                   generateUUID(),
      org_id:               orgId,
      semester_setting_id:  setting.id,
      label:                sem.label,
      start_date:           sem.start_date,
      end_date:             sem.end_date,
      sort_order:           i + 1,
      created_at:           NOW()
    })

    // Create terms within this semester
    for j, term in enumerate(sem.terms):
      DB.terms.insert({
        id:          generateUUID(),
        org_id:      orgId,
        semester_id: semester.id,
        label:       term.label,    // e.g. "Prelim", "Midterm"
        sort_order:  j + 1,
        created_at:  NOW()
      })

  return setting
```

---

## MIDDLEWARE — ORG SCOPE ENFORCEMENT

```
middleware requireOrgMatch(requestedOrgId):
  session = getSession()
  if session.role != "admin":
    throw FORBIDDEN("Admin role required")
  if session.org_id != requestedOrgId:
    throw FORBIDDEN("You do not have access to this organization")
  // Set RLS context for this request
  DB.execute("SET app.current_org_id = ?", [session.org_id])
  return next()
```