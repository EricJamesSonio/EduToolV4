# EduTool — Lesson Management
## Pseudo Code Reference

---

## LESSON — CREATE

```
function createLesson(orgId, classId, payload):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  if not payload.title:
    throw VALIDATION_ERROR("Lesson title is required")

  // Week label is either provided or auto-computed from next available
  weekLabel = payload.week_label or getNextWeekLabel(orgId, classId)

  lesson = DB.lessons.insert({
    id:          generateUUID(),
    org_id:      orgId,
    class_id:    classId,
    educator_id: getCurrentEducatorId(),
    title:       payload.title,
    description: payload.description or null,
    week_label:  weekLabel,
    detail:      payload.detail or null,
    deleted_at:  null,
    created_at:  NOW()
  })

  logEducatorActivity(orgId, classId, "lesson_created", {
    lesson_id: lesson.id,
    title:     lesson.title
  })

  // If detail has 10+ words on creation, trigger concept extraction immediately
  if payload.detail and wordCount(payload.detail) >= 10:
    triggerConceptExtraction(orgId, lesson.id)

  return lesson
```

---

## LESSON — UPDATE

```
function updateLesson(orgId, lessonId, payload):
  requireRole("educator")

  lesson = DB.lessons.findOne({
    id:         lessonId,
    org_id:     orgId,
    deleted_at: null
  })
  if not lesson:
    throw NOT_FOUND("Lesson not found")

  requireClassOwnership(orgId, lesson.class_id)

  oldDetail        = lesson.detail
  newDetail        = payload.detail or oldDetail
  detailChanged    = newDetail != oldDetail
  meetsMinLength   = wordCount(newDetail) >= 10

  DB.lessons.update(lessonId, {
    title:       payload.title or lesson.title,
    description: payload.description or lesson.description,
    week_label:  payload.week_label or lesson.week_label,
    detail:      newDetail,
    updated_at:  NOW()
  })

  logEducatorActivity(orgId, lesson.class_id, "lesson_updated", {
    lesson_id: lessonId
  })

  // First-time detail save — auto-trigger extraction
  activeBuild = DB.concept_builds.findOne({
    lesson_id: lessonId,
    is_active: true
  })
  if not activeBuild and meetsMinLength:
    triggerConceptExtraction(orgId, lessonId)
    return {
      lesson:  DB.lessons.findOne({ id: lessonId }),
      message: "Concept extraction triggered automatically."
    }

  // Detail updated after a build already exists — do NOT auto-re-extract
  // Educator must manually trigger re-extraction
  if activeBuild and detailChanged:
    return {
      lesson:  DB.lessons.findOne({ id: lessonId }),
      message: "Detail updated. Existing concept build preserved. " +
               "Trigger re-extraction manually when ready."
    }

  return DB.lessons.findOne({ id: lessonId })
```

---

## LESSON — DELETE (soft)

```
function deleteLesson(orgId, lessonId):
  requireRole("educator")

  lesson = DB.lessons.findOne({
    id:         lessonId,
    org_id:     orgId,
    deleted_at: null
  })
  if not lesson:
    throw NOT_FOUND("Lesson not found")

  requireClassOwnership(orgId, lesson.class_id)

  // Check if assessments are linked to this lesson
  linkedAssessments = DB.assessments.findAll({
    lesson_id:  lessonId,
    org_id:     orgId,
    deleted_at: null
  })
  if linkedAssessments.length > 0:
    warnings.add(
      linkedAssessments.length + " assessment(s) are linked to this lesson. " +
      "They will also be soft-deleted."
    )

  DB.lessons.update(lessonId, { deleted_at: NOW() })

  // Soft-delete linked assessments
  for each assessment in linkedAssessments:
    DB.assessments.update(assessment.id, { deleted_at: NOW() })

  return { message: "Lesson and linked assessments soft-deleted." }
```

---

## CONCEPT EXTRACTION — TRIGGER

```
function triggerConceptExtraction(orgId, lessonId):
  // Called automatically on first save or manually by educator for re-extraction

  lesson = DB.lessons.findOne({ id: lessonId, org_id: orgId })
  if not lesson:
    throw NOT_FOUND("Lesson not found")
  if not lesson.detail or wordCount(lesson.detail) < 10:
    throw VALIDATION_ERROR("Lesson detail must be at least 10 words")

  // Deactivate any existing concept build for this lesson
  DB.concept_builds.updateAll(
    { lesson_id: lessonId, is_active: true },
    { is_active: false }
  )

  // Create a new pending build
  build = DB.concept_builds.insert({
    id:         generateUUID(),
    org_id:     orgId,
    lesson_id:  lessonId,
    is_active:  true,
    status:     "pending",
    created_at: NOW()
  })

  // Dispatch to background job queue — non-blocking
  jobQueue.dispatch("concept_extraction", {
    build_id:    build.id,
    lesson_id:   lessonId,
    org_id:      orgId,
    lesson_text: lesson.detail
  })

  logEducatorActivity(orgId, lesson.class_id, "concept_extraction_triggered", {
    lesson_id: lessonId,
    build_id:  build.id
  })

  return { message: "Concept extraction started in background.", build_id: build.id }
```

---

## CONCEPT EXTRACTION — BACKGROUND JOB HANDLER

```
function handleConceptExtractionJob(job):
  build_id    = job.build_id
  lesson_text = job.lesson_text
  org_id      = job.org_id

  DB.concept_builds.update(build_id, { status: "processing" })

  try:
    // Call AI service to extract concepts from lesson text
    aiResult = AIService.extractConcepts(lesson_text)
    // Returns: [ { label: "Stack", item_count: 5 }, { label: "Queue", item_count: 6 }, ... ]

    if not aiResult or aiResult.length == 0:
      throw ERROR("AI returned no concepts")

    // Save each extracted concept section
    for each concept in aiResult:
      DB.concept_sections.insert({
        id:               generateUUID(),
        org_id:           org_id,
        concept_build_id: build_id,
        label:            concept.label,
        available_items:  concept.item_count
      })

    DB.concept_builds.update(build_id, {
      status:       "completed",
      completed_at: NOW()
    })

    // Notify the educator
    lesson = DB.lessons.findOne({ id: job.lesson_id })
    sendNotification({
      org_id:         org_id,
      recipient_role: "educator",
      recipient_id:   lesson.educator_id,
      trigger_type:   "concept_extraction_complete",
      message:        "Concept extraction complete for lesson: " + lesson.title
    })

    logEducatorActivity(org_id, lesson.class_id, "concept_extraction_complete", {
      lesson_id: job.lesson_id,
      build_id:  build_id
    })

  catch error:
    DB.concept_builds.update(build_id, {
      status: "failed"
    })
    // Notify educator of failure so they can retry
    sendNotification({
      org_id:         org_id,
      recipient_role: "educator",
      recipient_id:   lesson.educator_id,
      trigger_type:   "concept_extraction_failed",
      message:        "Concept extraction failed for lesson: " + lesson.title +
                      ". Please try again."
    })
```

---

## LESSON — GET ALL FOR CLASS (weekly view)

```
function getLessonsForClass(orgId, classId):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  lessons = DB.lessons
    .findAll({
      org_id:     orgId,
      class_id:   classId,
      deleted_at: null
    })
    .orderBy("week_label", ASC)

  return lessons.map(lesson => {
    activeBuild = DB.concept_builds.findOne({
      lesson_id: lesson.id,
      is_active: true
    })

    return {
      ...lesson,
      has_concept_build:  activeBuild != null,
      concept_build_status: activeBuild ? activeBuild.status : null,
      concept_sections: activeBuild
        ? DB.concept_sections.findAll({ concept_build_id: activeBuild.id })
        : []
    }
  })
  // Grouped by week_label for calendar display
```

---

## WEEK LABEL COMPUTATION

```
function getNextWeekLabel(orgId, classId):
  classObj = DB.classes.findOne({ id: classId, org_id: orgId })

  lastLesson = DB.lessons
    .findAll({ class_id: classId, org_id: orgId, deleted_at: null })
    .sortBy("week_label", DESC)
    .first()

  if not lastLesson:
    // First lesson
    return classObj.weekdays.length == 1 ? "Week 1" : "Week 1.1"

  // Parse last week label and increment
  return incrementWeekLabel(lastLesson.week_label, classObj.weekdays.length)


function incrementWeekLabel(currentLabel, weekdaysCount):
  if weekdaysCount == 1:
    // "Week N" → "Week N+1"
    n = parseInt(currentLabel.replace("Week ", ""))
    return "Week " + (n + 1)
  else:
    // "Week N.S" → next sub-index, rollover to next week
    parts  = currentLabel.split(".")      // ["Week N", "S"]
    week   = parseInt(parts[0].replace("Week ", ""))
    subIdx = parseInt(parts[1])

    if subIdx < weekdaysCount:
      return "Week " + week + "." + (subIdx + 1)
    else:
      return "Week " + (week + 1) + ".1"
```

---

## MIDDLEWARE — EDUCATOR CLASS OWNERSHIP

```
middleware requireClassOwnership(orgId, classId):
  session = getSession()

  if session.role == "admin":
    // Admin can access any class in their org
    requireOrgMatch(orgId)
    return next()

  if session.role != "educator":
    throw FORBIDDEN("Educator role required")

  classObj = DB.classes.findOne({
    id:          classId,
    org_id:      orgId,
    educator_id: session.id,
    deleted_at:  null
  })
  if not classObj:
    throw FORBIDDEN("You are not assigned to this class")

  return next()
```