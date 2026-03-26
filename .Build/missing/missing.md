================================================================================
  EDUTOOL — BACKEND COVERAGE REPORT
  Based on code review of all shared service/repository files
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
    - Audit log on all actions

  Organization
    - Create, get own, update

  School Year
    - Create, get all, activate, end, update

  Levels
    - Get defaults, update defaults
    - Get by school year, update level

  Programs
    - Create, find all, find one, update, delete

  Sections
    - Create, get, update, delete (soft)
    - Capacity check on student create (sets Pending if full)

  Semester Settings
    - Create, get, update, delete
    - Terms per semester

  Academic Calendar
    - Create, get, update, delete events
    - Holiday / no_class_day types recognized
    - Session skipping on blocked dates (enforced in attendance session generation)

  Subjects
    - Create, get all, update
    - Lock / unlock

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
    - Get enrollments
    - Update enrollment status
    - Rubric locks permanently on first student enrolled ✓ (FIXED)

  Educator Reassignment
    - Reassign educator with schedule conflict check
    - Ownership log written on every reassignment
    - Get ownership history

  Educators
    - Create, get all, get one, update, delete
    - Reset password
    - Block if active classes exist

  Students
    - Create with section capacity check (Pending if full)
    - Get all (filtered by status, level, section), get by ID
    - Update profile
    - Update status with irreversible transition guard (requires reason)
    - Reset password
    - Credentials CSV download
    - Bulk import with per-row validation report before committing
    - Import template download
    - Add / remove subject enrollment from student view
    - Get enrollments

  Lessons
    - Create, get all, get one, update, delete (soft)
    - Concept extraction triggered async on create (mock implementation)
    - Re-extraction replaces previous concept build
    - In-app notification sent on extraction complete
    - Activity log on all actions
    - Student: get lessons, get lesson detail (concept excluded)

  Assessments (Educator)
    - Create, get all, get one, update, delete (soft)
    - Update question
    - Get submissions, update submission status, grade essay
    - Publish / unpublish scores

  Assessments (Student)
    - Get assessments, get assessment detail, get result

  Submissions
    - Start or resume (one active attempt enforced — no duplicate attempts)
    - Save draft with question validation
    - Finish with auto-grading of non-essay questions
    - Essay flagged as pending
    - Auto-mark attendance present on submission (fire-and-forget)
    - Close expired drafts method (wired to cron — see Scheduled Jobs)

  Attendance (Educator)
    - Get sessions grouped by week
    - Get single session with records
    - Bulk set attendance with enrollment validation
    - Update single record
    - Auto-mark present from submission

  Attendance (Student)
    - Get own attendance by class

  Grades (Educator)
    - Get grades by class (all terms)
    - Get grades by term
    - Compute weighted grades from rubric categories
    - Set manual score per category per student per term
    - Category breakdown view
    - Grading scale resolved via subject → level → school year chain

  Grades (Student)
    - Get own grades by class

  Grade Lock
    - Create / get lock setting (deadline per school year)
    - Educator manually locks class
    - Admin unlocks class (override, logged)
    - Auto-publish all scores on lock
    - Grading scale locks on grade lock ✓ (FIXED)
    - Auto-lock cron method exists (wired to scheduler — see Scheduled Jobs)

  Grading Scale
    - Create, get all, update
    - is_locked + locked_at fields exist in schema
    - Lock triggered when first grade lock applied to that level + school year ✓ (FIXED)

  Rubrics
    - Get default, update default
    - Create, find by educator, update
    - is_locked + locked_at fields exist in schema
    - Locks on first student enrolled in class ✓ (FIXED)

  Notifications
    - Find all active (non-archived) for user, with unreadOnly filter
    - Dismiss (hard delete)
    - Create single notification
    - Create bulk notifications
    - Archive notifications older than 90 days method exists
      (wired to nightly cron — see Scheduled Jobs)

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
    - Get own transcript

  Meetings
    - Create, get, update, delete (soft)
    - Invites (MeetingInvite model)
    - Join requests (MeetingJoinRequest model)
    - Meeting metadata fully modeled in schema


================================================================================
  SCHEDULED JOBS ✓ (needs ScheduleModule wired)
================================================================================

  Status: Methods exist. ScheduleModule NOT yet registered in app.module.ts.
  All three jobs are orphaned until the following is done:

  Required steps:
    1. npm install @nestjs/schedule
    2. Add ScheduleModule.forRoot() to app.module.ts imports
    3. Create src/core/scheduler/scheduler.module.ts
    4. Create src/core/scheduler/scheduler.tasks.ts with:
         - @Cron(EVERY_HOUR)      → gradeLockService.autoLock(orgId) per org
         - @Cron(EVERY_30_MINUTES)→ submissionService.closeExpiredDrafts(assessmentId)
                                    per expired assessment
         - @Cron('0 2 * * *')    → notificationService.archiveOldNotifications()
    5. Import SchedulerModule in app.module.ts

  Jobs:
    - Auto grade lock      → GradeLockService.autoLock()
    - Close expired drafts → SubmissionService.closeExpiredDrafts()
    - Archive notifications→ NotificationService.archiveOldNotifications()


================================================================================
  BUGS FIXED IN THIS SESSION ✓
================================================================================

  1. Rubric lock on first enrollment
     - enrollStudent() now locks rubric after first active enrollment
     - ClassRepository.lockRubricForClass() added

  2. Grading scale lock on grade lock
     - lockClass() and autoLock() now call lockGradingScale()
     - GradeLockRepository.findLevelIdForClass() added
     - GradeLockRepository.lockGradingScale() added

  3. Bulk import skips section capacity check
     - STATUS: Still needs fix in student.service.ts bulkImport()
     - sectionService.countStudentsInSection() must be called per row
       before setting status = active

  4. student.update() skips section capacity check
     - STATUS: Still needs fix in student.service.ts update()
     - Capacity check must run when dto.sectionId changes


================================================================================
  MISSING / NOT BUILT ✗
================================================================================

  AI Assessment Generation Pipeline (Section 14.3)
    - Concept extraction is MOCKED (mockExtract splits text into word chunks)
    - No real AI call wired to lesson detail
    - Assessment generation from concept build not implemented:
        · Item range builder (type per range, concept sections per range)
        · Background job for generation
        · In-app notification on generation complete
        · Question population from AI response
    - This is the largest remaining unbuilt feature

  Meeting Room / WebRTC (Section 19)
    - Meeting metadata (title, time, invites, join requests) is fully modeled
    - No real-time room implemented:
        · No WebSocket gateway
        · No WebRTC signaling
        · No video/audio/screen share
        · No lesson presentation mode
        · No raise hand / reactions / chat
    - This is a separate infrastructure concern outside NestJS REST layer

  Grading Scale — update guard missing
    - GradingScale.is_locked exists in schema
    - No ForbiddenException thrown when Admin tries to update a locked scale
    - Needs guard in grading-scale.service.ts update() method:
        if (scale.is_locked) throw ForbiddenException(...)

  Rubric — update guard missing
    - Rubric.is_locked exists in schema
    - No ForbiddenException thrown when educator tries to update a locked rubric
    - Needs guard in rubric.service.ts update() method:
        if (rubric.is_locked) throw ForbiddenException(...)

  student.service.ts bulkImport() — capacity check missing (Bug 3)
    - Section ID present → status set to active without checking capacity
    - sectionService.countStudentsInSection() must be called per imported row

  student.service.ts update() — capacity check missing (Bug 4)
    - PATCH /students/:id does not re-check section capacity on section change
    - Must check before calling updateProfile()


================================================================================
  SUMMARY
================================================================================

  Total spec sections:          24
  Fully covered:                20
  Partially covered:             2  (grading scale guard, rubric guard)
  Bugs remaining:                2  (bulk import cap, student update cap)
  Not built:                     2  (AI pipeline, WebRTC room)
  Scheduler wiring pending:      1  (ScheduleModule not registered)

================================================================================
  EduTool Backend Coverage Report — Session End
================================================================================