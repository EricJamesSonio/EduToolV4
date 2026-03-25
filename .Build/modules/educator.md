================================================================================
  EDUTOOL — EDUCATOR LEVEL MANAGEMENT
  Role reference extracted from System Planning Document v8.3
================================================================================


================================================================================
  OVERVIEW
================================================================================

Educators manage everything that happens inside their assigned classes.
They do not create or modify class structure, enroll or remove students,
or access any class they are not assigned to.

  Educator manages:
    Lessons, concept extraction, assessments (config, generation, editing,
    assignment, essay grading, score publishing), attendance, grades (by term),
    personal rubric library, meetings, exports, and their own activity log.

  Educator cannot:
    Create or modify class structure. Enroll or remove students from subjects.
    View other educators' classes. Change student profiles or statuses.
    Unlock grades without Admin enabling the lock window.


================================================================================
  1. LESSON MANAGEMENT
================================================================================

  Lesson Properties:
    Title, Description (optional), Week Assignment, Lesson Detail (min 10 words)

  Lessons are organized in a calendar layout by week.

--------------------------------------------------------------------------------
  1.1  Concept Extraction
--------------------------------------------------------------------------------

  Auto-triggered when a Lesson Detail of 10+ words is saved for the first time.

  - Extraction runs in the background — non-blocking.
  - In-app notification sent on completion.
  - Feeds the Assessment Generator for this class only.
  - If lesson content is updated after a concept build exists, the old build
    stays — educator manually triggers re-extraction when ready.
  - Re-extraction replaces the previous concept build entirely.

  WARNING: Re-extracting does not affect assessments already generated from
  the old build. Only new assessments use the updated concept build.

--------------------------------------------------------------------------------
  1.2  Lesson Viewer & Presentation Mode
--------------------------------------------------------------------------------

  Educator can present lesson content directly inside the meeting room.
  All meeting participants follow the educator's forward/backward navigation
  in real time.


================================================================================
  2. ASSESSMENT MANAGEMENT
================================================================================

--------------------------------------------------------------------------------
  2.1  Question Types
--------------------------------------------------------------------------------

  Type              AI Generated    Auto-Graded    Notes
  ----------------  --------------  -------------  ----------------------------
  Multiple Choice   Yes             Yes            Checked on submission
  True or False     Yes             Yes            Checked on submission
  Identification    Yes             Yes            Checked on submission
  Enumeration       Yes             Yes            Checked on submission
  Essay             Yes             No             AI generates question.
                                                   Educator manually grades.

--------------------------------------------------------------------------------
  2.2  Assessment Dates
--------------------------------------------------------------------------------

  Release Date    Before this, students see title only — questions hidden.
  End Date        Submission deadline. Assessment auto-closes.

  Questions lock once the release date passes — no further edits after that.

--------------------------------------------------------------------------------
  2.3  Configuration & Generation Flow
--------------------------------------------------------------------------------

  Step 1  Select a lesson. If no concept build exists, generation is blocked.

  Step 2  Concept build displays available sections and item counts:
            e.g.  Stack: 5 | Queue: 6 | Binary Tree: 4 | Linear Data: 5
                  Total available: 20 items

  Step 3  Set assessment type (Quiz / Activity / Exam / Custom) and total
          items. Cannot exceed concept build total.

  Step 4  Build item ranges. Each range:
            - Item span (e.g. items 1–10)
            - One question type
            - One or more concept sections to fulfill the count

  Step 5  Generation runs in the background — non-blocking.
  Step 6  In-app notification when complete.
  Step 7  Set release date, end date, assign to students.

  Example:
    Range        Type            Sections Used                       Valid?
    ----------   --------------  ----------------------------------  ------
    Items 1–10   Identification  Stack(5)+Queue(4)+Arrays(1)=10      OK
    Items 11–15  Enumeration     Queue(6 avail, 5 needed)            OK
    Items 16–20  True or False   Binary Tree(4)+Linear(5), 5 needed  OK
    Item 21      Essay           Remaining concepts                  OK

--------------------------------------------------------------------------------
  2.4  Editing Generated Questions
--------------------------------------------------------------------------------

  Educator can edit any AI-generated question before the release date:
    - Question text
    - Answer choices (Multiple Choice)
    - Correct answer
    - Essay question text

  Once the release date passes, questions are locked — no further edits.

--------------------------------------------------------------------------------
  2.5  Student Assignment & Status
--------------------------------------------------------------------------------

  Status          Meaning
  -----------     --------------------------------------------------------------
  NULL (default)  Not assigned. Treated as missed. Educator can override.
  Exempted        Excused. Excluded from grade calc. Counts as perfect score.
  Custom Score    Educator manually sets a score. Status = Customized.
  Submitted       Submitted within deadline. Feeds grade computation.
  Draft           Opened, not submitted. Auto-saved. Can resume before end date.

  - Partial submissions allowed. Auto-saves on disconnect.
  - Late student additions: educator manually assigns status for each past
    assessment the student missed.

--------------------------------------------------------------------------------
  2.6  Attempt Control
--------------------------------------------------------------------------------

  Each student has exactly one active attempt per assessment at any time.

  - Opening the assessment from another tab or device resumes the existing
    attempt — no new attempt is created. Progress is restored exactly.
  - On submission: attempt is set to Submitted. No further access.
  - On end date: all Draft attempts are closed automatically.

  This prevents multiple simultaneous attempts and duplicate submissions.

--------------------------------------------------------------------------------
  2.7  Essay Grading
--------------------------------------------------------------------------------

  Essay questions are AI-generated but must be graded manually by the educator.
  Score shows as incomplete until the essay is graded.

  WARNING: If essays are ungraded when grade locking occurs, system warns
  but allows the lock. Educator takes full responsibility.

--------------------------------------------------------------------------------
  2.8  Score Publishing
--------------------------------------------------------------------------------

  Scores are hidden from students by default. Educator publishes when ready.

  Publish to all      All assigned students see their score at once.
  Publish selected    Only specific students' scores become visible.
  Unpublish           Educator can hide scores again after publishing.

  On grade lock:
    ALL unpublished scores are automatically published when grades are locked.
    Students see final grade + every individual score simultaneously.

--------------------------------------------------------------------------------
  2.9  Assessment Deletion
--------------------------------------------------------------------------------

  WARNING: Deleting an assessment after students have submitted wipes all
  scores. The final grade recomputes without it.
  Record is soft-deleted — removed from active UI but preserved in the database.


================================================================================
  3. ATTENDANCE MANAGEMENT
================================================================================

  Attendance is tracked per class session (not per calendar day).
  Sessions that fall on Holiday or No Class Day are automatically skipped
  — no record is created.

  The view is organized by week. Each week expands to show its sessions.

  Weekly layout examples:
    Once a week:       Week 1 → 1 session | Week 2 → 1 session ...
    Twice a week:      Week 1 → Session 1.1, 1.2 | Week 2 → ...
    Five days a week:  Week 1 → Sessions 1.1 through 1.5 | Week 2 → ...

--------------------------------------------------------------------------------
  3.1  Auto-Attendance from Assessments
--------------------------------------------------------------------------------

  If an assessment is assigned on a given session day:
    - Submitted → student automatically marked Present.
    - Not submitted (NULL, Draft, Exempted, Custom) → no automatic mark.
      Educator resolves manually.

--------------------------------------------------------------------------------
  3.2  Manual Attendance Entry
--------------------------------------------------------------------------------

  Educator can set or override attendance for any session at any time
  before grades are locked.

  Status    Meaning
  --------  ------------------------------------------------------------------
  Present   Student attended.
  Absent    Student did not attend.
  Late      Student attended but arrived late.
  Excused   Absence is formally excused.

--------------------------------------------------------------------------------
  3.3  Attendance in Grade Computation
--------------------------------------------------------------------------------

  If the rubric includes an Attendance category, the educator inputs the
  attendance summary score per student manually.
  The raw session-by-session records are for reference and tracking only.


================================================================================
  4. GRADE MANAGEMENT
================================================================================

  Grading is tracked per term within each semester.
  Each term (Prelim, Midterm, Pre-Finals, Finals — or custom) produces its
  own term grade.

  At the end of the semester, the overall subject grade is computed from
  all term grades:
    Example (4 equal-weight terms):
      Prelim=89  |  Midterm=90  |  Pre-Finals=88  |  Finals=80
      Overall = 86.75  (or weighted, per rubric config)

  The grade view is organized by term. Educator navigates between terms
  to view and manage assessments and scores.

--------------------------------------------------------------------------------
  4.1  Rubric System
--------------------------------------------------------------------------------

  At class creation, educator applies a rubric by:
    (a) Using the Admin default
    (b) Picking from personal rubric library
    (c) Building from scratch

  Lock rule: rubric locks permanently once the first student is enrolled.
  Validation: all weights must total exactly 100%.

  Rubric categories:
    Assessment-linked  →  auto-pulls scores from corresponding assessments.
    Manual entry       →  educator inputs score directly (Attendance, Behavior,
                          Recitation, Participation, etc.).

  Educator rubric library:
    Personal per educator. Saved reusable sets built over time.
    Invisible to other educators and other orgs.

  NOTE: Grading system (rubric weights and categories) can vary per subject.
        General subjects and major subjects may have different rubrics.
        The subject's grading system is assigned by Admin and inherited by
        the class, but the educator can adjust within rubric rules.

--------------------------------------------------------------------------------
  4.2  Grade Display Modes
--------------------------------------------------------------------------------

  Educator can switch between two views:

  Default View — individual assessment scores per student:
    Name     Act 1   Act 2   Quiz 1  Quiz 2   Exam   Behavior  Attend  Recit  Grade
    Stud 1   19/20   21/30   11/20   19/20   45/50   80/100    5/14   90/100   94

  Clean View — scores aggregated by category:
    Name     Activities  Quizzes  Exam   Behavior  Attend  Recit  Grade
    Stud 1   40/50       30/40   45/50   80/100    5/14   90/100   94

  Both views are organized by term. Educator switches freely between them.

--------------------------------------------------------------------------------
  4.3  Student Grade Visibility
--------------------------------------------------------------------------------

  Assessment scores       Visible only after educator publishes them.
  Final computed grade    Hidden until class grades are locked.
  On grade lock           ALL scores auto-published + final grade revealed.
  Essay pending           Score shows as incomplete until essay is graded.

--------------------------------------------------------------------------------
  4.4  Grade Locking
--------------------------------------------------------------------------------

  Educator locks grades manually within the window opened by Admin.
  Lock is permanent — Admin handles overrides directly with full authority.

  On lock:
    - All unpublished scores are auto-published.
    - Final grade becomes visible to students.
    - Grades are frozen and read-only.

  Auto-lock:
    If educator misses the deadline, the system auto-locks the class.
    Educator is notified.

  WARNING: Ungraded essay items at lock time — system warns but allows.
  Educator takes full responsibility.


================================================================================
  5. STUDENT REMOVAL FROM CLASS
================================================================================

  Educator can manually remove a student from a class if needed
  (e.g. wrong section, transfer).
  Removal is logged in the Educator Activity Log.

  NOTE: Educator cannot enroll students. Only Admin can add students to classes.


================================================================================
  6. MEETING MANAGEMENT
================================================================================

  Built-in video meeting room — no third-party tools.
  Rooms open automatically at the scheduled date and time.

  Meeting Properties:
    Title, Description (optional), Start Date/Time,
    Invited Students (all or selected subset)

  In-Room Features:
    - Video & Audio
    - Chat (text during meeting)
    - Raise hand / reactions
    - Screen sharing
    - Lesson Presentation Mode — displays lesson content to all in real time
    - Forward/backward lesson navigation — all participants follow
    - Educator controls muting and who is presenting

  Behavior:
    - Non-invited students can see the meeting exists and send a join request.
    - Educator accepts/declines requests from inside the room.
    - Educator manually ends the meeting. No auto-end, no duration limit.
    - Meetings are NOT recorded — live only. No playback after session ends.
    - Meeting notifications are suppressed on Holiday / No Class Day.


================================================================================
  7. EXPORTS
================================================================================

  PDF — Per Student Class Card:
    Student info, class info, grade breakdown per rubric category per term,
    term grades, final overall subject grade and remark, educator name,
    org name, school year, semester.

  CSV — Full Class Export:
    All students, all category scores per term, term grades, final grade,
    remark, passing status.

  Class card reflects the educator active at grade finalization.


================================================================================
  8. ACTIVITY LOG
================================================================================

  Educators see only their own class logs. Admin can view all educator logs.

  Logged Events:
    - New student enrolled in class (by Admin)
    - Student removed from class (by educator or Admin)
    - Meeting started / ended
    - Assessment created, edited, published, deleted
    - Scores published / unpublished
    - Grade locked (by educator or auto-lock)
    - Lesson created or updated
    - Concept extraction triggered / completed

  Log Fields:
    Timestamp  |  Event Type  |  Details  |  Class


================================================================================
  9. NOTIFICATIONS (Received by Educator)
================================================================================

  Trigger                           When
  --------------------------------  --------------------------------------------
  Concept extraction complete       Job finishes
  Assessment generation complete    Job finishes
  Class reassigned to you           Admin reassigns class
  Grade lock window opened          Admin enables the lock window
  Auto-lock applied to your class   System auto-locks at deadline
  Student added to your class       Admin adds a student
  Student removed from your class   Admin removes a student


================================================================================
  EduTool  •  Educator Level Management  •  v8.3
================================================================================