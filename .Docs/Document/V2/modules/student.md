================================================================================
  EDUTOOL — STUDENT LEVEL MANAGEMENT
  Role reference extracted from System Planning Document v8.3
================================================================================


================================================================================
  OVERVIEW
================================================================================

Students interact with the platform as consumers of academic content.
They take assessments, attend meetings, and view their own scores and grades.
They cannot modify any academic data or view any other student's information.

  Student can:
    Take assessments, attend meetings, view published scores, view locked
    final grades and all scores on lock, access full transcript history.

  Student cannot:
    Modify any academic data. View other students' data. Change their own
    password. Enroll or unenroll themselves from any subject.


================================================================================
  1. ACCOUNT & ACCESS
================================================================================

  Student accounts are created by Admin — no self-registration.
  Credentials (password) are system-generated and distributed by Admin.
  Students cannot change their own password.

  Account is accessible only when status is Active.

  Status        Effect on Student Access
  -----------   ----------------------------------------------------------------
  Active        Full access — can log in, take assessments, attend meetings.
  Pending       No access — Admin must resolve section assignment first.
  Suspended     Cannot log in. Cannot access any class. Enrollments preserved.
  Dropped       Cannot log in. Account is read-only. Transcript preserved.
  Transferred   Cannot log in. Same as Dropped.
  Graduated     Cannot log in. Full transcript accessible (read-only).


================================================================================
  2. ASSESSMENTS
================================================================================

  Students can only see and access assessments they have been assigned to.

--------------------------------------------------------------------------------
  2.1  Before Release Date
--------------------------------------------------------------------------------

  The assessment is visible in the student's list but questions are hidden.
  Only the title is shown until the release date is reached.

--------------------------------------------------------------------------------
  2.2  Taking an Assessment
--------------------------------------------------------------------------------

  - One active attempt per assessment at any time.
  - Opening the assessment creates an attempt. All progress is auto-saved.
  - If student opens the same assessment from another tab or device,
    the existing attempt is resumed — no new attempt created.
    Progress is restored exactly where left off.
  - Partial submissions are allowed. Auto-saves on disconnect.
  - Student can resume a Draft attempt any time before the end date.

  On submission:
    - Attempt is set to Submitted. No further access to the assessment.

  On end date:
    - All Draft (unsubmitted) attempts are automatically closed.

--------------------------------------------------------------------------------
  2.3  Assessment Statuses (Student's Perspective)
--------------------------------------------------------------------------------

  Status        What Student Sees
  -----------   ----------------------------------------------------------------
  NULL          Not assigned — assessment does not appear in student's list.
  Exempted      Shown as Exempted. Not required to submit.
  Custom Score  Score set by educator. Shown once published.
  Draft         In progress — can resume before end date.
  Submitted     Submitted — awaiting score publication.

--------------------------------------------------------------------------------
  2.4  Viewing Scores
--------------------------------------------------------------------------------

  Scores are hidden by default. Student sees a score only after the educator
  explicitly publishes it.

  On grade lock:
    ALL scores across the class are automatically published simultaneously.
    Student sees final grade AND every individual assessment score at once.

  Essay scores:
    Shows as incomplete until the educator manually grades the essay.


================================================================================
  3. GRADES
================================================================================

  Grades are organized by term within each semester.
  Final subject grade is computed from all term grades.

  What student sees per subject:
    - Individual assessment scores (after publishing)
    - Term grades (Prelim, Midterm, Pre-Finals, Finals — or custom terms)
    - Final overall subject grade (visible only after grade lock)
    - Grade remark (Passed, Failed, Incomplete, etc.)

  Final grade is hidden until the educator (or system) locks the class grades.
  Once locked, it becomes permanently visible to the student.

  Example:
    Prelim = 89  |  Midterm = 90  |  Pre-Finals = 88  |  Finals = 80
    Final Grade = 86.75  (or weighted per rubric config)


================================================================================
  4. MEETINGS
================================================================================

  Students are notified when a meeting they are invited to is created.

  In-room, students can:
    - Participate via video and audio
    - Use text chat during the meeting
    - Raise hand / use reactions
    - Follow the educator's lesson presentation in real time
      (navigation is controlled by educator — all participants follow)

  Non-invited students:
    - Can see the meeting exists in their class.
    - Can send a join request.
    - Educator accepts or declines from inside the room.

  Meetings are NOT recorded. There is no playback after the session ends.


================================================================================
  5. TRANSCRIPT
================================================================================

  Students have access to their full grade history across all school years,
  semesters, and terms.

  Organized as:
    School Year → Semester → Term → Subject → Grade

  Transcript is read-only. Student cannot modify any record.

  Transcript is accessible even after graduation (read-only account).


================================================================================
  6. NOTIFICATIONS (Received by Student)
================================================================================

  Trigger                             When
  ----------------------------------  ------------------------------------------
  Assessment released                 Release date reached
  Assessment deadline approaching     Before end date
  Score published                     Educator publishes a score
  Grades locked — all scores visible  Grade lock applied to the class
  Meeting created                     When invited to a new meeting
  Enrolled in subject/class           On enrollment by Admin


================================================================================
  7. WHAT STUDENTS CANNOT DO
================================================================================

    - Cannot modify any academic data (grades, scores, assessments, attendance).
    - Cannot view any other student's data, scores, or profile.
    - Cannot enroll or unenroll themselves from any subject or class.
    - Cannot change their own password (only Admin can reset it).
    - Cannot access classes they are not enrolled in.
    - Cannot view questions before the release date.
    - Cannot reopen a submitted assessment.
    - Cannot access the system if their status is anything other than Active.


================================================================================
  EduTool  •  Student Level Management  •  v8.3
================================================================================