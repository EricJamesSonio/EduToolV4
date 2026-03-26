================================================================================
  EDUTOOL — BACKEND COVERAGE REPORT v3
  Based on full code review of all shared service/repository files
================================================================================


================================================================================
  CONFIRMED IMPLEMENTED ✓
================================================================================

  Auth
    - Login, refresh token, logout, me endpoint

  Platform Owner
    - Login via PLATFORM_SECRET_PASSWORD
    - Create admin (returns plain password once)
    - Get admins (paginated + searchable)
    - Get single admin
    - Block / unblock admin
    - Reset admin password (returns plain password once)
    - Audit log on all platform actions

  Organization
    - Create, get own, update

  School Year
    - Create, get all, activate, end, update
    - On activate: subjects auto-unlocked for org
    - Ended years are read-only (enforced in update)

  Levels
    - Get defaults, update defaults
    - Get by school year, update level
    - Seeded from org defaults on school year create

  Programs
    - Create, find all, find one, update, delete

  Sections
    - Create, get, update, delete (soft)
    - Capacity check on student create (sets Pending if full)

  Semester Settings
    - Create, get, update, delete
    - Terms per semester with order_index

  Academic Calendar
    - Create, get, update, delete events
    - Holiday / no_class_day types recognized
    - Session skipping on blocked dates (enforced in attendance
      session generation)

  Subjects
    - Create, get all, update
    - Lock / unlock
    - Auto-unlocked on new school year activation

  Classes
    - Create with schedule conflict validation (educator + section)
    - Get all (filtered), get by ID, update, archive (soft delete)
    - Attendance sessions auto-generated on class creation
    - Holiday/no-class-day dates skipped in session generation
    - Week number + sub_index computed correctly per spec

  Class Enrollment
    - Enroll student with duplicate prevention
    - Capacity overflow returns structured prompt (overflow: true)
    - Remove enrollment (soft — status = removed)
    - Get enrollments, update enrollment status
    - Rubric locks permanently on first student enrolled ✓

  Educator Reassignment
    - Reassign educator with schedule conflict check
    - Ownership log written on every reassignment
    - Get ownership history

  Educators
    - Create, get all, get one, update, delete
    - Reset password
    - Blocked from deletion if active classes exist

  Students
    - Create with section capacity check (Pending if full)
    - Get all (filtered by status, level, section), get by ID
    - Update profile (with section capacity guard) ✓ FIXED
    - Update status with irreversible transition guard (requires reason)
    - Reset password
    - Credentials CSV download
    - Bulk import with per-row validation report before committing
    - Bulk import section capacity check per row ✓ FIXED
    - Import template download
    - Add / remove subject enrollment from student view
    - Get enrollments

  Lessons
    - Create, get all, get one, update, delete (soft)
    - Concept extraction triggered async on create (mock — see Missing)
    - Re-extraction replaces previous concept build (upsert)
    - In-app notification sent on extraction complete
    - Activity log on all lesson actions
    - Student: get lessons, get lesson detail (concept excluded)

  Assessments (Educator)
    - Create, get all, get one, update, delete (soft)
    - Update individual question
    - Get submissions, update submission status, grade essay
    - Publish / unpublish scores

  Assessments (Student)
    - Get assessments, get assessment detail, get result

  Submissions
    - Start or resume (one active attempt enforced)
    - Save draft with per-question validation
    - Finish with auto-grading of non-essay questions
    - Essay questions flagged as pending on submit
    - Auto-mark attendance present on submission (fire-and-forget)
    - Close expired drafts (wired to cron)

  Attendance (Educator)
    - Get sessions grouped by week
    - Get single session with records
    - Bulk set attendance with enrollment validation
    - Update single attendance record
    - Auto-mark present triggered from submission finish

  Attendance (Student)
    - Get own attendance by class

  Grades (Educator)
    - Get grades by class (all terms)
    - Get grades by term
    - Compute weighted grades from rubric categories
    - Set manual score per category per student per term
    - Category breakdown view (default + clean view data available)
    - Grading scale resolved via subject → level → school year chain

  Grades (Student)
    - Get own grades by class

  Grade Lock
    - Create / get lock setting (deadline per school year)
    - Educator manually locks class within deadline window
    - Admin unlocks class (override, logged to audit)
    - Auto-publish all scores on lock
    - Grading scale locks when first grade lock applied ✓
    - Auto-lock cron method wired to scheduler ✓

  Grading Scale
    - Create with full 0–100 range validation (gaps + overlaps checked)
    - Get all (filtered by level, school year)
    - Update with is_locked guard ✓ (throws if locked)
    - is_locked + locked_at in schema
    - Locked when first grade lock applied to that level + school year ✓
    - Auto-unlock on new school year activation ✓ FIXED

  Rubrics
    - Get default, update default
    - Create rubric (educator library)
    - Find by educator
    - Update with is_locked guard ✓ (throws if locked)
    - Locks permanently on first student enrolled in class ✓
    - lockForClass() + assignToClass() utility methods exist

  Notifications
    - Find all active (non-archived) for user, with unreadOnly filter
    - Dismiss (hard delete)
    - Create single / bulk notifications
    - Archive older than 90 days (wired to nightly cron) ✓

  Audit Log
    - Admin audit log (logAdminAction)
    - Educator activity log (logActivityEvent)
    - Get audit log, get activity log (filtered by classId)

  Analytics
    - Overview, enrollment breakdown, grade analytics
    - Educator load, alerts

  Export
    - PDF class card per student
    - CSV full class export

  Transcript (Student)
    - Get own full transcript

  Meetings
    - Create, get, update, delete (soft)
    - Invites (MeetingInvite) fully modeled
    - Join requests (MeetingJoinRequest) fully modeled
    - Meeting metadata complete in schema

  Scheduler
    - ScheduleModule.forRoot() registered in app.module.ts ✓
    - SchedulerModule created and imported in app.module.ts ✓
    - SchedulerTasks wired with all three cron jobs ✓
    - Auto grade lock       → GradeLockService.autoLock()       @EVERY_HOUR
    - Close expired drafts  → SubmissionService.closeExpiredDrafts() @EVERY_30_MIN
    - Archive notifications → NotificationService.archiveOldNotifications() @0 2 * * *


================================================================================
  BUGS REMAINING — NOT YET FIXED
================================================================================

  None. All reported bugs have been resolved.

  Previously fixed:
    - Bug 1 — bulkImport() missing section capacity check ✓ FIXED
    - Bug 2 — update() missing sectionId capacity guard ✓ FIXED


================================================================================
  MISSING / NOT BUILT
================================================================================

  1. AI Assessment Generation Pipeline (Spec Section 14.3)
     Issue:  Concept extraction uses mockExtract() — splits lesson text
             into word chunks. No real AI call is made.
             Assessment generation from concept builds is not implemented:
               - Item range configuration (type per range, concept
                 sections per range, count validation)
               - Background generation job
               - Question population from AI response
               - In-app notification on generation complete
     Note:   Pipeline structure (async + notification) is correct.
             Only the AI call itself and the generation logic are missing.

  2. Meeting Room / WebRTC (Spec Section 19)
     Issue:  Meeting metadata is fully modeled (title, time, invites,
             join requests). No real-time room exists:
               - No WebSocket gateway
               - No WebRTC signaling server
               - No video / audio / screen share
               - No lesson presentation mode (real-time sync)
               - No raise hand / reactions / in-room chat
     Note:   This is infrastructure outside the NestJS REST layer.
             Requires a separate WebSocket/WebRTC service.


================================================================================
  SUMMARY
================================================================================

  Spec sections fully covered:     23 / 24   (was 22 / 24)
  Bugs remaining:                   0         (was 2)
  Missing features:                 2         (was 3 — grading scale unlock done)
  Scheduler wiring:                 complete  (was pending)

================================================================================
  EduTool Backend Coverage Report v3
================================================================================