================================================================================
  EDUTOOL — STUDENT FEATURE BUILD PLAN
================================================================================

CURRENT STATUS
--------------
❌ student-classes     — not built (student view of enrolled classes)
❌ student-lessons     — not built (student view of lessons)
❌ student-assessments — not built (student view + submission flow)
❌ student-grades      — not built (student view of own grades)
❌ student-transcript  — not built (full grade history)
❌ student-attendance  — not built (student view of own attendance)

NOTE: Submission flow (start/save/finish) is already built in SubmissionModule.
      Student-facing endpoints just need to be added to existing controllers
      OR the existing SubmissionController already handles it (it does — role: student).
      What's missing is READ endpoints: student viewing their own data.


================================================================================
  WHAT ALREADY EXISTS THAT STUDENTS CAN USE
================================================================================

  ✅ POST /assessments/:assessmentId/submit
     — student starts or resumes attempt (SubmissionController, role: student)

  ✅ PATCH /assessments/:assessmentId/submit/save
     — student auto-saves draft (SubmissionController, role: student)

  ✅ POST /assessments/:assessmentId/submit/finish
     — student final submits (SubmissionController, role: student)

  ✅ GET /notifications
     — student receives notifications (NotificationController, all roles)

  ✅ POST /auth/login
  ✅ POST /auth/logout
  ✅ POST /auth/refresh
  ✅ GET  /auth/me
     — auth works for students already


================================================================================
  WHAT IS MISSING — FULL GAP ANALYSIS
================================================================================

  GAP 1: Student cannot see their own enrolled classes
  GAP 2: Student cannot see lessons for their classes
  GAP 3: Student cannot see their assessments (list + detail before/after release)
  GAP 4: Student cannot see their own scores per assessment
  GAP 5: Student cannot see their term grades
  GAP 6: Student cannot see their final grade (only after lock)
  GAP 7: Student cannot see their attendance records
  GAP 8: Student cannot see their full transcript


================================================================================
  MODULE 1: student-class (student view of classes)
================================================================================

PURPOSE
  Student sees the classes they are actively enrolled in.
  Cannot see other students' classes. Cannot see unenrolled classes.

WHERE TO ADD
  Extend existing ClassController OR add to StudentModule.
  Recommended: add to ClassController with a new student-scoped route.
  No new module needed.

ENDPOINT TO ADD
  GET  /student/classes
       — returns all active enrollments for the logged-in student
       — includes class info: subject name, educator name, schedule, section
       — role: student

  GET  /student/classes/:classId
       — returns single class detail for a student (must be enrolled)
       — role: student

WHAT TO BUILD
  - ClassRepository: add findEnrolledClasses(studentId, orgId)
  - ClassService: add getStudentClasses(studentId, orgId)
  - ClassController: add student-scoped GET routes

SCHEMA
  No changes needed. Uses existing Class + Enrollment + Subject + Profile.


================================================================================
  MODULE 2: student-lesson (student view of lessons)
================================================================================

PURPOSE
  Student reads lessons for classes they are enrolled in.
  Lessons are always visible (no release gate).

WHERE TO ADD
  Extend existing LessonController with student-scoped routes.

ENDPOINTS TO ADD
  GET  /student/classes/:classId/lessons
       — list all lessons for a class (must be enrolled)
       — role: student

  GET  /student/classes/:classId/lessons/:lessonId
       — get single lesson detail
       — role: student

WHAT TO BUILD
  - LessonRepository: add findForStudent(classId, orgId) — same as educator
    but no educator ownership check
  - LessonService: add getStudentLessons / getStudentLesson
  - LessonController: add student-scoped routes

SCHEMA
  No changes needed.

NOTES
  - LessonConcept (AI-extracted content) is educator-only — do NOT expose to student.
  - Students see: title, description, detail, week_number, sub_index only.


================================================================================
  MODULE 3: student-assessment (student view of assessments)
================================================================================

PURPOSE
  Student sees assessments assigned to their class.
  Before release date: title visible, questions hidden.
  After release date: full assessment accessible.
  After submission: result visible only if score is published.

WHERE TO ADD
  Extend existing AssessmentController OR add dedicated student routes.
  Recommended: separate student routes in AssessmentController.

ENDPOINTS TO ADD
  GET  /student/classes/:classId/assessments
       — list all published assessments for the class (must be enrolled)
       — returns: id, type, title, release_date, end_date, submission status
       — hides questions if before release_date
       — role: student

  GET  /student/classes/:classId/assessments/:assessmentId
       — get assessment detail
       — if before release_date: returns metadata only, no questions
       — if after release_date: returns full assessment with questions
       — role: student

  GET  /student/classes/:classId/assessments/:assessmentId/result
       — get student's own submission result
       — score visible only if assessment score is published (is_published = true)
         OR if class grades are locked
       — role: student

WHAT TO BUILD
  - AssessmentRepository: add findPublishedForClass(classId, orgId)
  - AssessmentService: add student-scoped methods with enrollment check
  - Add student routes to AssessmentController (or new StudentAssessmentController)

SCHEMA
  No changes needed.

NOTES
  - is_published on Assessment controls score visibility per spec section 2.4
  - Student CANNOT see questions before release_date (spec section 2.1)
  - Student CANNOT reopen a submitted attempt (already enforced in SubmissionService)


================================================================================
  MODULE 4: student-grade (student view of grades)
================================================================================

PURPOSE
  Student sees their own term grades and final subject grade.
  Final grade is hidden until GradeLock is applied.
  On grade lock: ALL scores + final grade become visible simultaneously.

WHERE TO ADD
  Extend existing GradeController OR add student routes.
  Recommended: add student-scoped routes to GradeController.

ENDPOINTS TO ADD
  GET  /student/classes/:classId/grades
       — returns student's own grades for all terms in this class
       — term grades always visible (individual assessment scores follow
         is_published flag)
       — final_grade visible only if class GradeLock.is_locked = true
       — role: student

  GET  /student/transcript
       — returns full grade history across all school years/semesters/terms
       — organized as: SchoolYear → Semester → Term → Subject → Grade
       — role: student

WHAT TO BUILD
  - GradeRepository: add findStudentGrades(studentId, classId, orgId)
  - GradeRepository: add findStudentTranscript(studentId, orgId)
  - GradeService: add getStudentGrades / getStudentTranscript
  - GradeController: add student-scoped routes

SCHEMA
  No changes needed. Uses Grade + GradeLock + Submission + Assessment.

NOTES
  - final_grade must be HIDDEN until GradeLock.is_locked = true (spec section 3)
  - On lock: all scores auto-published — enforce this in GradeLockService
    (already wired: grade-lock calls gradeService.publishAllByClass ✅)
  - Transcript accessible even for graduated/dropped accounts (read-only)


================================================================================
  MODULE 5: student-attendance (student view of own attendance)
================================================================================

PURPOSE
  Student sees their own attendance records per class.
  Cannot see other students' records.

WHERE TO ADD
  Extend existing AttendanceController with student-scoped routes.

ENDPOINTS TO ADD
  GET  /student/classes/:classId/attendance
       — returns all attendance records for the logged-in student in this class
       — grouped by week (same structure as educator view)
       — role: student

WHAT TO BUILD
  - AttendanceRepository: add findRecordsByStudent(classId, studentId, orgId)
  - AttendanceService: add getStudentAttendance(classId, studentId, orgId)
  - AttendanceController: add student-scoped route

SCHEMA
  No changes needed.


================================================================================
  ROUTING STRATEGY
================================================================================

  All student-facing read endpoints use the /student prefix to cleanly
  separate them from educator/admin routes on the same resources.

  Student routes                          Source module
  ─────────────────────────────────────── ──────────────────────
  GET /student/classes                    ClassModule
  GET /student/classes/:id                ClassModule
  GET /student/classes/:id/lessons        LessonModule
  GET /student/classes/:id/lessons/:lid   LessonModule
  GET /student/classes/:id/assessments    AssessmentModule
  GET /student/classes/:id/assessments/:aid               AssessmentModule
  GET /student/classes/:id/assessments/:aid/result        AssessmentModule
  GET /student/classes/:id/grades         GradeModule
  GET /student/classes/:id/attendance     AttendanceModule
  GET /student/transcript                 GradeModule

  Options:
    A) Add all student routes directly to existing controllers (simpler,
       less files, roles guard separates access)
    B) Create a dedicated StudentDashboardModule / StudentDashboardController
       that imports all needed services (cleaner separation, more files)

  RECOMMENDATION: Option A — extend existing controllers.
  Each controller already has the service + repo. Just add student routes
  with @Roles('student') and replace educator ownership checks with
  enrollment checks.


================================================================================
  SHARED GUARD NEEDED: enrollmentGuard (or inline check)
================================================================================

  Every student endpoint must verify:
    1. Student is actively enrolled in the requested classId
    2. Student's account status is 'active'

  Implementation options:
    A) Inline enrollment check in each service method (assertStudentEnrolled)
    B) Custom EnrollmentGuard that reads classId from params

  RECOMMENDATION: Option A — add assertStudentEnrolled() as a private
  helper in each service, same pattern as assertEducatorOwnsClass().

  Helper shape:
    private async assertStudentEnrolled(classId: string, studentId: string, orgId: string) {
      const enrollment = await db.enrollment.findFirst({
        where: { class_id: classId, student_id: studentId, org_id: orgId, status: 'active' }
      });
      if (!enrollment) throw new ForbiddenException('Not enrolled in this class.');
    }


================================================================================
  BUILD ORDER
================================================================================

  1. student-class      — simplest, no new schema, foundation for others
  2. student-lesson     — depends on class enrollment check
  3. student-assessment — depends on class + submission data
  4. student-grade      — depends on grade lock state
  5. student-attendance — independent, simple read
  6. student-transcript — depends on grade, broadest query


================================================================================
  SCHEMA CHANGES NEEDED
================================================================================

  NONE. All required data is already in the schema:
    - Class, Enrollment, Subject, Profile        → student-class
    - Lesson                                     → student-lesson
    - Assessment, Question, Submission           → student-assessment
    - Grade, GradeLock, ManualScore              → student-grade
    - AttendanceSession, AttendanceRecord        → student-attendance


================================================================================
  AFTER THESE MODULES
================================================================================

  Wire student domain into app via existing domain modules — no new domain
  module needed since all student routes live inside existing modules.

  Remaining features (separate effort, not blocking):
    - meeting    — Agora RTC (student participates, send join request)
    - exports    — PDF transcript download


================================================================================
  EduTool • Student Feature Build Plan • v1.0
================================================================================