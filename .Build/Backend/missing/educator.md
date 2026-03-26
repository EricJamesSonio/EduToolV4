================================================================================
  EDUTOOL — EDUCATOR FEATURE BUILD PLAN
================================================================================

CURRENT STATUS
--------------
✅ lesson       — built (lesson CRUD + concept extraction)
✅ assessment   — built (config, generation, questions, publishing)
✅ submission   — built (handled inside assessment module: submissions, grading, status)
✅ attendance   — built (sessions + records)
✅ grade        — built (educator grade view + computation + manual scores)


================================================================================
  MODULE 1: submission (COMPLETED - INTEGRATED)
================================================================================

PURPOSE
  Handles student submissions and educator grading.
  NOTE: This is already implemented inside the Assessment module
  (no separate module needed).

IMPLEMENTED ENDPOINTS (educator-facing via assessment module)
  GET    /classes/:classId/assessments/:id/submissions
         — list all submissions for an assessment

  PATCH  /classes/:classId/assessments/:id/submissions/:submissionId/status
         — update submission status (exempted/custom)

  PATCH  /classes/:classId/assessments/:id/submissions/:submissionId/grade
         — grade essay / manual scoring

IMPLEMENTED FEATURES
  - Submission storage per student per assessment
  - Status handling (draft, submitted, exempted, custom)
  - Manual grading for essay questions
  - Score + manual_score support
  - Educator submission management (status + grading)
  - Submission retrieval per assessment

NOTES
  - Student-side endpoints (submit/save/finish) can be added later if needed
  - Current system already supports grading and submission tracking
  - No need for a separate Submission module unless you want strict separation


================================================================================
  MODULE 2: attendance (COMPLETED)
================================================================================

PURPOSE
  Tracks per-session attendance for each class.
  Sessions are auto-generated from class schedules on class creation.
  Holiday/No Class Day sessions are automatically skipped.

FILES CREATED
  src/modules/attendance/
  ├─ attendance.controller.ts   ✅
  ├─ attendance.module.ts       ✅
  ├─ attendance.repository.ts   ✅
  ├─ attendance.service.ts      ✅
  ├─ dto/
  │   └─ attendance.dto.ts      ✅
  └─ entity/
      └─ attendance.entity.ts   ✅

ENDPOINTS IMPLEMENTED
  GET    /classes/:classId/attendance/sessions
         — list all sessions, grouped by week (optional ?weekNumber= filter)
  GET    /classes/:classId/attendance/sessions/:sessionId
         — get one session + all student records
  POST   /classes/:classId/attendance/sessions/:sessionId/records
         — bulk set attendance for all students in a session
  PATCH  /classes/:classId/attendance/sessions/:sessionId/records/:recordId
         — override a single student's attendance status

IMPLEMENTED FEATURES
  - Session auto-generation on class creation (fire-and-forget, non-blocking)
  - Walks semester start→end, creates one session per scheduled weekday
  - Skips dates that fall on AcademicCalendar holiday or no_class_day events
  - Sequential week numbering (ISO Monday-start), no gaps when days are skipped
  - sub_index tracks position of session within the week
  - Bulk upsert attendance records per session (validates active enrollment)
  - Single record override (educator can correct any record)
  - Auto-mark present from submission: when a student finishes an assessment,
    they are auto-marked present for that day's session (fire-and-forget)
  - Full audit log on bulk set + record override

PATCHES APPLIED
  - class.module.ts      — added AuditLogModule + AttendanceModule imports
  - class.service.ts     — injects AttendanceService, calls generateSessionsForClass()
                           after class creation
  - assessment.module.ts — added AttendanceModule import
  - assessment.service.ts — injects AttendanceService, exposes
                            onSubmissionFinished() to trigger auto-present
  - class-domain.module.ts — AttendanceModule registered                ✅

REMAINING WIRING
  - Call assessmentService.onSubmissionFinished() from SubmissionModule
    when a student's submission status transitions to 'submitted'       ← TODO


================================================================================
  MODULE 3: grade (COMPLETED)
================================================================================

PURPOSE
  Educator views and manages computed grades per term.
  Grade computation pulls scores from assessments + manual rubric entries.

FILES CREATED / UPDATED
  src/modules/grade/
  ├─ grade.controller.ts        ✅
  ├─ grade.module.ts            ✅
  ├─ grade.repository.ts        ✅
  ├─ grade.service.ts           ✅
  ├─ dto/
  │   └─ grade.dto.ts           ✅
  └─ entity/
      └─ grade.entity.ts        ✅

ENDPOINTS IMPLEMENTED
  GET    /classes/:classId/grades
         — get all student grades for the class, grouped by term

  GET    /classes/:classId/grades/:termId
         — get per-student grades for a specific term

  POST   /classes/:classId/grades/:termId/compute
         — trigger grade computation for all students in a term

  PATCH  /classes/:classId/grades/:termId/students/:studentId/manual
         — educator sets manual score for a rubric category

IMPLEMENTED FEATURES
  - Educator + admin role guard on all endpoints
  - assertEducatorOwnsClass guard (ForbiddenException if not owner)
  - Grade computation logic:
      · Pulls all submissions for assessments in the given term + class
      · Groups by rubric category via direct type match
        (quiz → quiz, exam → exam, activity → activity)
      · Manual-only categories (attendance, behavior) pulled from ManualScore table
      · Applies rubric weights; normalizes against total weight used
        (handles missing categories gracefully — no divide-by-zero)
      · Resolves final_grade string via GradingScale ranges
      · Upserts computed grade into Grade table per student
  - Grade display modes:
      · Default view: individual assessment scores per student (assessmentScores[])
      · Breakdown view: aggregated by rubric category (categoryBreakdown[])
  - Manual score entry per rubric category per student
      · Lock guard: blocked if grade is already locked
  - Full audit log on compute + manual score set
  - Prisma Json fields safely cast via `as unknown as T` pattern

SCHEMA ADDITIONS
  - ManualScore model added to schema.prisma                          ✅
  - Migration: npx prisma migrate dev --name add_manual_score         ✅

PATCHES APPLIED
  - grade.module.ts         — added GradeController, exports GradeService + GradeRepository
  - grade.service.ts        — backward-compat methods retained
                              (publishAllByClass, unlockAllByClass, computeAndSaveGrade,
                              getClassGrades)
  - assessment-domain.module.ts — GradeModule registered              ✅


================================================================================
  BUILD ORDER
================================================================================

  ✅ 1. attendance   — DONE
  ✅ 2. grade        — DONE


================================================================================
  AFTER THESE MODULES
================================================================================

  App module wiring — all modules registered via domain modules:
    - AttendanceModule → ClassDomainModule → AppModule               ✅
    - GradeModule      → AssessmentDomainModule → AppModule          ✅

  Existing modules confirmed wired correctly:
    - grade-lock.service.ts  — already calls gradeService.publishAllByClass ✅
    - notification           — already wired into lesson + assessment ✅
    - audit-log              — already wired into all modules ✅

  ONE remaining cross-module wiring task:
    - Call assessmentService.onSubmissionFinished() from SubmissionModule
      when a student's submission status transitions to 'submitted'   ← TODO

  Remaining features (separate effort, not blocking):
    - meeting    — Agora RTC, real-time
    - exports    — PDF + CSV


================================================================================
  EduTool • Educator Build Plan • v2.3
================================================================================