# EduTool — Assessment Management
## Pseudo Code Reference

---

## ASSESSMENT — CREATE TEMPLATE + TRIGGER GENERATION

```
function createAssessment(orgId, classId, payload):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  if not payload.lesson_id:
    throw VALIDATION_ERROR("Lesson is required")
  if not payload.total_items or payload.total_items < 1:
    throw VALIDATION_ERROR("Total items must be at least 1")
  if not payload.item_ranges or payload.item_ranges.length == 0:
    throw VALIDATION_ERROR("At least one item range is required")

  // Lesson must have an active, completed concept build
  activeBuild = DB.concept_builds.findOne({
    lesson_id: payload.lesson_id,
    org_id:    orgId,
    is_active: true,
    status:    "completed"
  })
  if not activeBuild:
    throw VALIDATION_ERROR(
      "This lesson has no completed concept build. " +
      "Concept extraction must complete before generating an assessment."
    )

  // Validate item ranges cover all items 1 to total_items exactly
  validateItemRanges(payload.item_ranges, payload.total_items)

  // Validate each range can be fulfilled by the selected concept sections
  for each range in payload.item_ranges:
    validateRangeFulfillment(orgId, activeBuild.id, range)

  assessment = DB.assessments.insert({
    id:                  generateUUID(),
    org_id:              orgId,
    class_id:            classId,
    lesson_id:           payload.lesson_id,
    concept_build_id:    activeBuild.id,
    educator_id:         getCurrentEducatorId(),
    title:               payload.title,
    assessment_type:     payload.assessment_type,  // "quiz"|"activity"|"exam"|"custom"
    total_items:         payload.total_items,
    release_date:        payload.release_date or null,
    end_date:            payload.end_date or null,
    is_questions_locked: false,
    deleted_at:          null,
    created_at:          NOW()
  })

  // Dispatch background generation job — non-blocking
  jobQueue.dispatch("assessment_generation", {
    assessment_id: assessment.id,
    org_id:        orgId,
    build_id:      activeBuild.id,
    item_ranges:   payload.item_ranges
  })

  logEducatorActivity(orgId, classId, "assessment_created", {
    assessment_id: assessment.id
  })

  return {
    assessment: assessment,
    message:    "Assessment generation started in background."
  }


function validateItemRanges(ranges, totalItems):
  // Ranges must cover items 1 to totalItems with no gaps and no overlaps
  covered = new Set()
  for each range in ranges:
    for i in range(range.item_from, range.item_to + 1):
      if i in covered:
        throw VALIDATION_ERROR("Item " + i + " is covered by more than one range")
      if i < 1 or i > totalItems:
        throw VALIDATION_ERROR("Item " + i + " is out of bounds (1–" + totalItems + ")")
      covered.add(i)
  if covered.size != totalItems:
    throw VALIDATION_ERROR("Item ranges do not cover all " + totalItems + " items")


function validateRangeFulfillment(orgId, buildId, range):
  rangeCount = range.item_to - range.item_from + 1
  totalAvailable = 0

  for each sectionId in range.concept_section_ids:
    section = DB.concept_sections.findOne({
      id:               sectionId,
      concept_build_id: buildId
    })
    if not section:
      throw VALIDATION_ERROR("Concept section not found in this build")
    totalAvailable += section.available_items

  if totalAvailable < rangeCount:
    throw VALIDATION_ERROR(
      "Not enough items available from selected concept sections. " +
      "Need " + rangeCount + ", have " + totalAvailable + "."
    )
```

---

## ASSESSMENT GENERATION — BACKGROUND JOB HANDLER

```
function handleAssessmentGenerationJob(job):
  assessment = DB.assessments.findOne({ id: job.assessment_id })

  try:
    questionNumber = 1

    for each range in job.item_ranges:
      rangeCount = range.item_to - range.item_from + 1

      // Get the lesson text for this concept section (for AI context)
      sections = DB.concept_sections.findAll({
        id: { IN: range.concept_section_ids }
      })

      for i in range(rangeCount):
        conceptSection = pickConceptSection(sections, i)

        aiQuestion = AIService.generateQuestion({
          type:           range.question_type,
          concept_label:  conceptSection.label,
          lesson_text:    getLessonTextForSection(conceptSection)
        })

        DB.assessment_questions.insert({
          id:                generateUUID(),
          org_id:            job.org_id,
          assessment_id:     job.assessment_id,
          question_number:   questionNumber,
          question_type:     range.question_type,
          question_text:     aiQuestion.text,
          correct_answer:    aiQuestion.correct_answer or null,
          choices:           aiQuestion.choices or null,
          concept_section_id: conceptSection.id,
          created_at:        NOW()
        })
        questionNumber++

    // Notify educator that generation is complete
    sendNotification({
      org_id:         job.org_id,
      recipient_role: "educator",
      recipient_id:   assessment.educator_id,
      trigger_type:   "assessment_generation_complete",
      message:        "Assessment generation complete: " + assessment.title
    })

    logEducatorActivity(job.org_id, assessment.class_id,
      "assessment_generation_complete", { assessment_id: job.assessment_id })

  catch error:
    sendNotification({
      org_id:         job.org_id,
      recipient_role: "educator",
      recipient_id:   assessment.educator_id,
      trigger_type:   "assessment_generation_failed",
      message:        "Generation failed for: " + assessment.title + ". Please retry."
    })
```

---

## ASSESSMENT QUESTIONS — EDIT (before release date only)

```
function updateQuestion(orgId, assessmentId, questionId, payload):
  requireRole("educator")

  assessment = DB.assessments.findOne({
    id:         assessmentId,
    org_id:     orgId,
    deleted_at: null
  })
  if not assessment:
    throw NOT_FOUND("Assessment not found")

  requireClassOwnership(orgId, assessment.class_id)

  if assessment.is_questions_locked:
    throw FORBIDDEN("Questions are locked after the release date. No edits allowed.")

  question = DB.assessment_questions.findOne({
    id:            questionId,
    assessment_id: assessmentId
  })
  if not question:
    throw NOT_FOUND("Question not found")

  DB.assessment_questions.update(questionId, {
    question_text:  payload.question_text or question.question_text,
    correct_answer: payload.correct_answer or question.correct_answer,
    choices:        payload.choices or question.choices,
    updated_at:     NOW()
  })

  return DB.assessment_questions.findOne({ id: questionId })
```

---

## ASSESSMENT — ASSIGN TO STUDENTS

```
function assignAssessmentToStudents(orgId, assessmentId, studentIds):
  requireRole("educator")

  assessment = DB.assessments.findOne({
    id:         assessmentId,
    org_id:     orgId,
    deleted_at: null
  })
  if not assessment:
    throw NOT_FOUND("Assessment not found")
  requireClassOwnership(orgId, assessment.class_id)

  enrolledStudents = DB.enrollments
    .findAll({ class_id: assessment.class_id, org_id: orgId, status: "active" })
    .map(e => e.student_id)

  targets = studentIds == "all" ? enrolledStudents : studentIds

  for each studentId in targets:
    if studentId not in enrolledStudents:
      throw VALIDATION_ERROR("Student " + studentId + " is not enrolled in this class")

    existing = DB.assessment_assignments.findOne({
      assessment_id: assessmentId,
      student_id:    studentId
    })
    if existing:
      continue   // already assigned — skip, no duplicate

    DB.assessment_assignments.insert({
      id:                 generateUUID(),
      org_id:             orgId,
      assessment_id:      assessmentId,
      student_id:         studentId,
      status:             "null",       // default — not yet submitted
      is_score_published: false,
      created_at:         NOW()
    })

  return { message: "Assessment assigned to " + targets.length + " students" }
```

---

## ASSESSMENT — RELEASE DATE TRIGGER (cron / scheduler)

```
// Runs as a scheduled job — checks every minute
function processAssessmentReleases():
  due = DB.assessments.findAll({
    release_date:        { LTE: NOW() },
    is_questions_locked: false,
    deleted_at:          null
  })

  for each assessment in due:
    DB.assessments.update(assessment.id, {
      is_questions_locked: true,
      updated_at:          NOW()
    })

    // Notify all assigned students
    assignments = DB.assessment_assignments.findAll({
      assessment_id: assessment.id,
      status:        { NOT: "null" }
    })
    for each a in assignments:
      sendNotification({
        org_id:         assessment.org_id,
        recipient_role: "student",
        recipient_id:   a.student_id,
        trigger_type:   "assessment_released",
        message:        "Assessment is now available: " + assessment.title
      })
```

---

## ASSESSMENT ATTEMPT — OPEN / RESUME

```
function openAssessment(orgId, assessmentId, studentId):
  requireRole("student")
  requireStudentIdentity(studentId)

  assessment = DB.assessments.findOne({
    id:         assessmentId,
    org_id:     orgId,
    deleted_at: null
  })
  if not assessment:
    throw NOT_FOUND("Assessment not found")

  // Check student is assigned
  assignment = DB.assessment_assignments.findOne({
    assessment_id: assessmentId,
    student_id:    studentId
  })
  if not assignment or assignment.status == "null":
    throw FORBIDDEN("You are not assigned to this assessment")
  if assignment.status == "submitted":
    throw FORBIDDEN("You have already submitted this assessment")

  // Check for already-active attempt — resume instead of creating new
  existing = DB.assessment_attempts.findOne({
    assessment_id: assessmentId,
    student_id:    studentId,
    status:        "active"
  })
  if existing:
    // Resume existing attempt — restore progress
    questions = DB.assessment_questions
      .findAll({ assessment_id: assessmentId })
      .orderBy("question_number", ASC)

    return {
      attempt:   existing,
      questions: questions,
      progress:  existing.progress,   // previously auto-saved answers
      resumed:   true
    }

  // No active attempt — create a new one
  attempt = DB.assessment_attempts.insert({
    id:             generateUUID(),
    org_id:         orgId,
    assessment_id:  assessmentId,
    student_id:     studentId,
    assignment_id:  assignment.id,
    status:         "active",
    progress:       {},
    started_at:     NOW()
  })

  // Update assignment status to draft
  DB.assessment_assignments.update(assignment.id, {
    status:     "draft",
    updated_at: NOW()
  })

  questions = DB.assessment_questions
    .findAll({ assessment_id: assessmentId })
    .orderBy("question_number", ASC)

  return { attempt, questions, progress: {}, resumed: false }
```

---

## ASSESSMENT ATTEMPT — AUTO SAVE

```
function autoSaveProgress(orgId, attemptId, studentId, answers):
  requireRole("student")

  attempt = DB.assessment_attempts.findOne({
    id:         attemptId,
    org_id:     orgId,
    student_id: studentId,
    status:     "active"
  })
  if not attempt:
    throw NOT_FOUND("Active attempt not found")

  DB.assessment_attempts.update(attemptId, {
    progress:   answers,   // full current answer state as JSONB
    updated_at: NOW()
  })

  return { saved: true }
```

---

## ASSESSMENT ATTEMPT — SUBMIT

```
function submitAssessment(orgId, attemptId, studentId, finalAnswers):
  requireRole("student")

  attempt = DB.assessment_attempts.findOne({
    id:         attemptId,
    org_id:     orgId,
    student_id: studentId,
    status:     "active"
  })
  if not attempt:
    throw NOT_FOUND("No active attempt found")

  assessment = DB.assessments.findOne({ id: attempt.assessment_id })
  if NOW() > assessment.end_date:
    throw FORBIDDEN("Assessment deadline has passed")

  questions = DB.assessment_questions.findAll({
    assessment_id: attempt.assessment_id
  })

  totalScore  = 0
  maxScore    = questions.length

  for each question in questions:
    answer = finalAnswers[question.id] or ""
    isCorrect = null

    if question.question_type != "essay":
      isCorrect = evaluateAnswer(question, answer)
      if isCorrect: totalScore++

    DB.attempt_answers.insert({
      id:          generateUUID(),
      org_id:      orgId,
      attempt_id:  attemptId,
      question_id: question.id,
      answer_text: answer,
      is_correct:  isCorrect,
      created_at:  NOW()
    })

  // Close the attempt
  DB.assessment_attempts.update(attemptId, {
    status:       "submitted",
    submitted_at: NOW()
  })

  // Update assignment record
  assignment = DB.assessment_assignments.findOne({ id: attempt.assignment_id })
  DB.assessment_assignments.update(assignment.id, {
    status:     "submitted",
    score:      totalScore,
    max_score:  maxScore,
    updated_at: NOW()
  })

  // Auto-mark attendance for this session date
  autoMarkAttendance(orgId, assessment.class_id, studentId, TODAY())

  return { score: totalScore, max_score: maxScore }


function evaluateAnswer(question, studentAnswer):
  if question.question_type == "multiple_choice":
    return studentAnswer.trim() == question.correct_answer.trim()
  if question.question_type == "true_or_false":
    return studentAnswer.trim().toLowerCase() == question.correct_answer.trim().toLowerCase()
  if question.question_type == "identification":
    return studentAnswer.trim().toLowerCase() == question.correct_answer.trim().toLowerCase()
  if question.question_type == "enumeration":
    expected = question.correct_answer.split(",").map(a => a.trim().toLowerCase()).sort()
    given    = studentAnswer.split(",").map(a => a.trim().toLowerCase()).sort()
    return JSON.stringify(expected) == JSON.stringify(given)
  // essay — always null, manual grading
  return null
```

---

## ASSESSMENT END DATE — AUTO CLOSE DRAFTS (cron)

```
function processAssessmentDeadlines():
  expired = DB.assessments.findAll({
    end_date:   { LTE: NOW() },
    deleted_at: null
  })

  for each assessment in expired:
    // Close all still-active attempts
    DB.assessment_attempts.updateAll(
      { assessment_id: assessment.id, status: "active" },
      { status: "closed", closed_at: NOW() }
    )
    // Close all draft assignments
    DB.assessment_assignments.updateAll(
      { assessment_id: assessment.id, status: "draft" },
      { status: "null", updated_at: NOW() }
      // "null" — treated as missed since deadline passed without submission
    )
```

---

## SCORE PUBLISHING

```
function publishScores(orgId, assessmentId, scope, studentIds):
  requireRole("educator")

  assessment = DB.assessments.findOne({
    id:         assessmentId,
    org_id:     orgId,
    deleted_at: null
  })
  if not assessment:
    throw NOT_FOUND("Assessment not found")
  requireClassOwnership(orgId, assessment.class_id)

  if scope == "all":
    targets = DB.assessment_assignments.findAll({
      assessment_id: assessmentId,
      status:        { NOT: "null" }
    })
  else:
    targets = DB.assessment_assignments.findAll({
      assessment_id: assessmentId,
      student_id:    { IN: studentIds }
    })

  for each assignment in targets:
    DB.assessment_assignments.update(assignment.id, {
      is_score_published: true,
      published_at:       NOW()
    })

    sendNotification({
      org_id:         orgId,
      recipient_role: "student",
      recipient_id:   assignment.student_id,
      trigger_type:   "score_published",
      message:        "Your score for " + assessment.title + " is now available."
    })

  return { published: targets.length }


function unpublishScores(orgId, assessmentId, studentIds):
  requireRole("educator")
  // Identical to publishScores but sets is_score_published = false
  // Only allowed before grade lock
  classObj = DB.classes.findOne({
    id:     DB.assessments.findOne({ id: assessmentId }).class_id,
    org_id: orgId
  })
  if classObj.grades_locked:
    throw FORBIDDEN("Cannot unpublish scores after grades are locked")

  DB.assessment_assignments.updateAll(
    { assessment_id: assessmentId, student_id: { IN: studentIds } },
    { is_score_published: false, published_at: null }
  )
```

---

## ASSESSMENT — SOFT DELETE

```
function deleteAssessment(orgId, assessmentId):
  requireRole("educator")

  assessment = DB.assessments.findOne({
    id:         assessmentId,
    org_id:     orgId,
    deleted_at: null
  })
  if not assessment:
    throw NOT_FOUND("Assessment not found")
  requireClassOwnership(orgId, assessment.class_id)

  hasSubmissions = DB.assessment_assignments.count({
    assessment_id: assessmentId,
    status:        "submitted"
  }) > 0

  if hasSubmissions:
    warnings.add(
      "WARNING: Students have submitted this assessment. " +
      "Deleting will wipe all their scores. " +
      "Final grade will recompute without this assessment. " +
      "This cannot be undone. Confirm to proceed."
    )
    // Caller must pass confirmed: true

  DB.assessments.update(assessmentId, { deleted_at: NOW() })

  // Trigger grade recomputation for all affected students
  affectedStudentIds = DB.assessment_assignments
    .findAll({ assessment_id: assessmentId })
    .map(a => a.student_id)

  for each studentId in affectedStudentIds:
    recomputeTermGrade(orgId, assessment.class_id, studentId, assessment.term_id)

  logEducatorActivity(orgId, assessment.class_id, "assessment_deleted", {
    assessment_id: assessmentId
  })

  return { message: "Assessment soft-deleted. Grade recomputed for affected students." }
```