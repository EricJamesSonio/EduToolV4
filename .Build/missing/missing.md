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
    - Auto