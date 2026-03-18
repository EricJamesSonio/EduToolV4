# EduTool — Grade Management
## Pseudo Code Reference

---

## GRADE COMPUTATION — COMPUTE TERM GRADE

```
function recomputeTermGrade(orgId, classId, studentId, termId):
  // Called whenever a score changes, is published, or an assessment is deleted

  classObj = DB.classes.findOne({ id: classId, org_id: orgId })
  gradingSystem = DB.grading_systems.findOne({ id: classObj.grading_system_id })
  categories = DB.grading_system_categories
    .findAll({ grading_system_id: gradingSystem.id })
    .orderBy("sort_order", ASC)

  categoryScores = []
  finalPercent   = 0

  for each category in categories:

    if category.entry_type == "assessment_linked":
      // Pull all submitted/customized/exempted assignments for this category type in this term
      assignments = DB.assessment_assignments
        .join(DB.assessments, "assessment_assignments.assessment_id = assessments.id")
        .findAll({
          "assessments.org_id":         orgId,
          "assessments.class_id":       classId,
          "assessments.term_id":        termId,
          "assessments.assessment_type": category.assessment_type,
          "assessments.deleted_at":     null,
          "assessment_assignments.student_id": studentId,
          "assessment_assignments.status": { IN: ["submitted","customized","exempted"] }
        })

      earned = 0
      total  = 0

      for each a in assignments:
        if a.status == "exempted":
          // Counts as perfect score — full max_score added to both sides
          earned += a.max_score
          total  += a.max_score
        else:
          earned += a.score or 0
          total  += a.max_score or 0

      categoryPercent = total > 0 ? (earned / total) * 100 : 0

    else:
      // Manual entry — educator has entered score directly
      catScore = DB.term_grade_category_scores.findOne({
        org_id:       orgId,
        category_id:  category.id,
        term_grade_id: getOrCreateTermGradeId(orgId, classId, studentId, termId)
      })
      earned          = catScore ? catScore.manual_score : 0
      total           = 100
      categoryPercent = earned

    // Weighted contribution
    weightedScore = categoryPercent * (category.weight_percent / 100)
    finalPercent += weightedScore

    categoryScores.push({
      category_id:    category.id,
      earned_points:  earned,
      total_points:   total,
      manual_score:   category.entry_type == "manual" ? earned : null
    })

  // Map finalPercent to grade value using grading scale
  gradeMapping = mapToGradingScale(orgId, classObj.program_id, finalPercent)

  // Upsert term_grade
  existingGrade = DB.term_grades.findOne({
    org_id:     orgId,
    class_id:   classId,
    student_id: studentId,
    term_id:    termId
  })

  if existingGrade:
    DB.term_grades.update(existingGrade.id, {
      computed_grade: finalPercent,
      grade_value:    gradeMapping.grade_value,
      remark:         gradeMapping.remark,
      updated_at:     NOW()
    })
    termGradeId = existingGrade.id
  else:
    newGrade = DB.term_grades.insert({
      id:               generateUUID(),
      org_id:           orgId,
      class_id:         classId,
      student_id:       studentId,
      term_id:          termId,
      grading_system_id: gradingSystem.id,
      computed_grade:   finalPercent,
      grade_value:      gradeMapping.grade_value,
      remark:           gradeMapping.remark,
      is_locked:        false,
      created_at:       NOW()
    })
    termGradeId = newGrade.id

  // Upsert category breakdown
  for each cs in categoryScores:
    existing = DB.term_grade_category_scores.findOne({
      term_grade_id: termGradeId,
      category_id:   cs.category_id
    })
    if existing:
      DB.term_grade_category_scores.update(existing.id, {
        earned_points: cs.earned_points,
        total_points:  cs.total_points,
        manual_score:  cs.manual_score,
        updated_at:    NOW()
      })
    else:
      DB.term_grade_category_scores.insert({
        id:            generateUUID(),
        org_id:        orgId,
        term_grade_id: termGradeId,
        category_id:   cs.category_id,
        earned_points: cs.earned_points,
        total_points:  cs.total_points,
        manual_score:  cs.manual_score,
        created_at:    NOW()
      })

  return DB.term_grades.findOne({ id: termGradeId })
```

---

## MANUAL CATEGORY SCORE — SAVE (for manual-entry rubric categories)

```
function saveManualCategoryScore(orgId, classId, studentId, termId, categoryId, score):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  termGradeId = getOrCreateTermGradeId(orgId, classId, studentId, termId)

  // Check grade is not locked
  termGrade = DB.term_grades.findOne({ id: termGradeId })
  if termGrade and termGrade.is_locked:
    throw FORBIDDEN("Cannot edit grades after locking")

  existing = DB.term_grade_category_scores.findOne({
    term_grade_id: termGradeId,
    category_id:   categoryId
  })

  if existing:
    DB.term_grade_category_scores.update(existing.id, {
      manual_score: score,
      updated_at:   NOW()
    })
  else:
    DB.term_grade_category_scores.insert({
      id:            generateUUID(),
      org_id:        orgId,
      term_grade_id: termGradeId,
      category_id:   categoryId,
      earned_points: score,
      total_points:  100,
      manual_score:  score,
      created_at:    NOW()
    })

  // Recompute after manual entry
  recomputeTermGrade(orgId, classId, studentId, termId)

  return { saved: true }
```

---

## SEMESTER GRADE — COMPUTE OVERALL SUBJECT GRADE

```
function recomputeSemesterGrade(orgId, classId, studentId, semesterId):
  // Called after all terms in a semester are locked

  terms = DB.terms.findAll({ semester_id: semesterId, org_id: orgId })
    .orderBy("sort_order", ASC)

  termGrades = []
  for each term in terms:
    tg = DB.term_grades.findOne({
      org_id:     orgId,
      class_id:   classId,
      student_id: studentId,
      term_id:    term.id
    })
    if tg:
      termGrades.push(tg.computed_grade)

  if termGrades.length == 0:
    return null

  // Default: simple average across all terms
  // (May be weighted per rubric config in future iterations)
  overallGrade = sum(termGrades) / termGrades.length

  classObj     = DB.classes.findOne({ id: classId, org_id: orgId })
  gradeMapping = mapToGradingScale(orgId, classObj.program_id, overallGrade)
  scale        = DB.grading_scales.findOne({ org_id: orgId, program_id: classObj.program_id })

  existing = DB.semester_grades.findOne({
    org_id:     orgId,
    class_id:   classId,
    student_id: studentId,
    semester_id: semesterId
  })

  payload = {
    computed_grade: overallGrade,
    grade_value:    gradeMapping.grade_value,
    remark:         gradeMapping.remark,
    is_passing:     overallGrade >= scale.passing_threshold,
    updated_at:     NOW()
  }

  if existing:
    DB.semester_grades.update(existing.id, payload)
  else:
    DB.semester_grades.insert({
      id:          generateUUID(),
      org_id:      orgId,
      class_id:    classId,
      student_id:  studentId,
      semester_id: semesterId,
      ...payload,
      created_at:  NOW()
    })
```

---

## GRADE SCALE — MAP SCORE TO VALUE

```
function mapToGradingScale(orgId, programId, scorePercent):
  scale = DB.grading_scales.findOne({
    org_id:     orgId,
    program_id: programId
  })
  if not scale:
    return { grade_value: null, remark: null }

  ranges = DB.grading_scale_ranges
    .findAll({ grading_scale_id: scale.id })
    .orderBy("score_min", DESC)

  for each range in ranges:
    if scorePercent >= range.score_min and scorePercent <= range.score_max:
      return {
        grade_value: range.grade_value,
        remark:      range.remark
      }

  return { grade_value: "INC", remark: "Incomplete" }
```

---

## GRADE VIEW — DEFAULT MODE (individual assessments per student)

```
function getGradeViewDefault(orgId, classId, termId):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  enrolledStudents = DB.enrollments
    .findAll({ org_id: orgId, class_id: classId, status: "active" })
    .map(e => DB.students.findOne({ id: e.student_id }))

  assessments = DB.assessments
    .findAll({
      org_id:     orgId,
      class_id:   classId,
      term_id:    termId,
      deleted_at: null
    })
    .orderBy("assessment_type", ASC)

  gradingSystem = getClassGradingSystem(orgId, classId)
  manualCategories = gradingSystem.categories.filter(c => c.entry_type == "manual")

  return enrolledStudents.map(student => {
    termGrade = DB.term_grades.findOne({
      org_id:     orgId,
      class_id:   classId,
      student_id: student.id,
      term_id:    termId
    })

    assessmentScores = assessments.map(a => {
      assignment = DB.assessment_assignments.findOne({
        assessment_id: a.id,
        student_id:    student.id
      })
      return {
        assessment_id:   a.id,
        title:           a.title,
        type:            a.assessment_type,
        score:           assignment ? assignment.score : null,
        max_score:       assignment ? assignment.max_score : null,
        status:          assignment ? assignment.status : "null",
        is_published:    assignment ? assignment.is_score_published : false
      }
    })

    manualScores = manualCategories.map(cat => {
      catScore = DB.term_grade_category_scores.findOne({
        term_grade_id: termGrade ? termGrade.id : null,
        category_id:   cat.id
      })
      return {
        category_id:   cat.id,
        label:         cat.label,
        score:         catScore ? catScore.manual_score : null,
        max_score:     100
      }
    })

    return {
      student_id:       student.id,
      student_name:     student.full_name,
      assessment_scores: assessmentScores,
      manual_scores:     manualScores,
      final_grade:       termGrade ? termGrade.computed_grade : null,
      grade_value:       termGrade ? termGrade.grade_value : null
    }
  })
```

---

## GRADE VIEW — CLEAN MODE (aggregated by category)

```
function getGradeViewClean(orgId, classId, termId):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  enrolledStudents = DB.enrollments
    .findAll({ org_id: orgId, class_id: classId, status: "active" })
    .map(e => DB.students.findOne({ id: e.student_id }))

  gradingSystem    = getClassGradingSystem(orgId, classId)
  categories       = gradingSystem.categories

  return enrolledStudents.map(student => {
    termGrade = DB.term_grades.findOne({
      org_id:     orgId,
      class_id:   classId,
      student_id: student.id,
      term_id:    termId
    })

    categoryScores = categories.map(cat => {
      catScore = DB.term_grade_category_scores.findOne({
        term_grade_id: termGrade ? termGrade.id : null,
        category_id:   cat.id
      })
      return {
        category_id:   cat.id,
        label:         cat.label,
        earned:        catScore ? catScore.earned_points : 0,
        total:         catScore ? catScore.total_points : 0,
        manual_score:  catScore ? catScore.manual_score : null
      }
    })

    return {
      student_id:      student.id,
      student_name:    student.full_name,
      category_scores: categoryScores,
      final_grade:     termGrade ? termGrade.computed_grade : null,
      grade_value:     termGrade ? termGrade.grade_value : null
    }
  })
```

---

## GRADE LOCK — OPEN LOCK WINDOW (Admin)

```
function openGradeLockWindow(orgId, schoolYearId, deadlineHours):
  requireRole("admin")
  requireOrgMatch(orgId)

  deadline = NOW().addHours(deadlineHours)

  // Store the lock deadline on the school year
  DB.school_years.update(schoolYearId, {
    grade_lock_deadline: deadline,
    updated_at:          NOW()
  })

  // Notify all educators in this org
  educators = DB.educators.findAll({ org_id: orgId, deleted_at: null })
  for each educator in educators:
    sendNotification({
      org_id:         orgId,
      recipient_role: "educator",
      recipient_id:   educator.id,
      trigger_type:   "grade_lock_window_opened",
      message:        "Grade lock window is now open. Deadline: " + formatDateTime(deadline)
    })
```

---

## GRADE LOCK — EDUCATOR LOCKS MANUALLY

```
function lockGrades(orgId, classId, termId):
  requireRole("educator")
  requireClassOwnership(orgId, classId)

  // Check for ungraded essays — warn but allow
  ungradedEssays = DB.assessment_assignments
    .join(DB.assessments, "assessment_assignments.assessment_id = assessments.id")
    .findAll({
      "assessments.class_id":       classId,
      "assessments.term_id":        termId,
      "assessments.deleted_at":     null,
      "assessment_assignments.status": "submitted"
    })
    .filter(a => {
      // Check if any question is essay with null is_correct (ungraded)
      hasUngradedEssay = DB.attempt_answers
        .join(DB.assessment_questions, "attempt_answers.question_id = assessment_questions.id")
        .findOne({
          "assessment_questions.assessment_id": a.assessment_id,
          "assessment_questions.question_type": "essay",
          "attempt_answers.is_correct":         null
        })
      return hasUngradedEssay != null
    })

  if ungradedEssays.length > 0:
    warnings.add(
      ungradedEssays.length + " essay item(s) are not yet graded. " +
      "Locking now will freeze these as incomplete. " +
      "Educator takes full responsibility. Confirm to proceed."
    )
    // Caller must pass confirmed: true

  enrolledStudents = DB.enrollments
    .findAll({ org_id: orgId, class_id: classId, status: "active" })
    .map(e => e.student_id)

  for each studentId in enrolledStudents:
    termGrade = DB.term_grades.findOne({
      org_id:     orgId,
      class_id:   classId,
      student_id: studentId,
      term_id:    termId
    })
    if termGrade:
      DB.term_grades.update(termGrade.id, {
        is_locked:  true,
        locked_at:  NOW(),
        locked_by:  getCurrentEducatorId(),
        updated_at: NOW()
      })

    // Auto-publish all unpublished scores for this student
    DB.assessment_assignments.updateAll(
      {
        org_id:             orgId,
        student_id:         studentId,
        is_score_published: false,
        // where assessment is in this class + term
      },
      { is_score_published: true, published_at: NOW() }
    )

    // Notify student
    sendNotification({
      org_id:         orgId,
      recipient_role: "student",
      recipient_id:   studentId,
      trigger_type:   "grades_locked",
      message:        "Your grades have been finalized. All scores are now visible."
    })

  // Recompute semester grade now that this term is locked
  recomputeSemesterGrade(orgId, classId, studentId, classObj.semester_id)

  logEducatorActivity(orgId, classId, "grade_locked", {
    term_id:   termId,
    locked_by: getCurrentEducatorId()
  })

  return { message: "Grades locked for all students in this term." }
```

---

## GRADE LOCK — AUTO LOCK ON DEADLINE (cron)

```
function processGradeLockDeadlines():
  now = NOW()

  overdueYears = DB.school_years.findAll({
    grade_lock_deadline: { LTE: now, NOT: null }
  })

  for each schoolYear in overdueYears:
    // Find all classes with unlocked grades in this school year
    unlocked = DB.term_grades
      .join(DB.classes, "term_grades.class_id = classes.id")
      .findAll({
        "classes.school_year_id": schoolYear.id,
        "term_grades.is_locked":  false
      })

    affectedClasses = unlocked.map(tg => tg.class_id).unique()

    for each classId in affectedClasses:
      affectedTerms = unlocked
        .filter(tg => tg.class_id == classId)
        .map(tg => tg.term_id)
        .unique()

      for each termId in affectedTerms:
        lockGrades(schoolYear.org_id, classId, termId)  // system-triggered lock

        // Notify the educator
        classObj = DB.classes.findOne({ id: classId })
        sendNotification({
          org_id:         schoolYear.org_id,
          recipient_role: "educator",
          recipient_id:   classObj.educator_id,
          trigger_type:   "auto_lock_applied",
          message:        "Grades for class " + classObj.title +
                          " were auto-locked at the deadline."
        })

        logEducatorActivity(schoolYear.org_id, classId, "grade_locked_auto", {
          term_id: termId
        })
```

---

## GRADE LOCK — ADMIN OVERRIDE UNLOCK

```
function adminUnlockGrade(orgId, classId, termId, studentId):
  requireRole("admin")
  requireOrgMatch(orgId)

  // No external approval needed — Admin has full authority
  termGrade = DB.term_grades.findOne({
    org_id:     orgId,
    class_id:   classId,
    student_id: studentId,
    term_id:    termId
  })
  if not termGrade:
    throw NOT_FOUND("Term grade not found")
  if not termGrade.is_locked:
    throw CONFLICT("Grade is not currently locked")

  DB.term_grades.update(termGrade.id, {
    is_locked:  false,
    locked_at:  null,
    locked_by:  null,
    updated_at: NOW()
  })

  logAdminAudit(orgId, "grade_lock_override", "term_grade", termGrade.id, {
    class_id:   classId,
    term_id:    termId,
    student_id: studentId,
    unlocked_by: getCurrentAdminId()
  })

  return { message: "Grade unlocked. Educator can now make changes." }
```

---

## STUDENT TRANSCRIPT VIEW

```
function getStudentTranscript(orgId, studentId):
  // Accessible by student (own data) or admin
  requireOrgMatch(orgId)

  if getSessionRole() == "student":
    requireStudentIdentity(studentId)
  else if getSessionRole() == "admin":
    requireOrgMatch(orgId)
  else:
    throw FORBIDDEN("Not authorized to view transcripts")

  schoolYears = DB.school_years
    .findAll({ org_id: orgId })
    .orderBy("created_at", ASC)

  transcript = schoolYears.map(year => {
    semesters = DB.semesters
      .join(DB.semester_settings, "semesters.semester_setting_id = semester_settings.id")
      .findAll({ "semester_settings.org_id": orgId })

    return {
      school_year: year.title,
      semesters: semesters.map(sem => {
        semesterGrades = DB.semester_grades
          .join(DB.classes, "semester_grades.class_id = classes.id")
          .join(DB.subjects, "classes.subject_id = subjects.id")
          .findAll({
            "semester_grades.org_id":     orgId,
            "semester_grades.student_id": studentId,
            "semester_grades.semester_id": sem.id
          })

        return {
          semester: sem.label,
          subjects: semesterGrades.map(sg => ({
            subject_title:  sg.subjects.title,
            computed_grade: sg.computed_grade,
            grade_value:    sg.grade_value,
            remark:         sg.remark,
            is_passing:     sg.is_passing,
            terms:          getTermBreakdown(orgId, sg.class_id, studentId, sem.id)
          }))
        }
      })
    }
  })

  return transcript


function getTermBreakdown(orgId, classId, studentId, semesterId):
  terms = DB.terms.findAll({
    semester_id: semesterId,
    org_id:      orgId
  })
  return terms.map(term => {
    tg = DB.term_grades.findOne({
      org_id:     orgId,
      class_id:   classId,
      student_id: studentId,
      term_id:    term.id
    })
    return {
      term:          term.label,
      grade:         tg ? tg.computed_grade : null,
      grade_value:   tg ? tg.grade_value : null,
      is_locked:     tg ? tg.is_locked : false
    }
  })
```