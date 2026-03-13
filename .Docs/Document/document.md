================================================================================
  EDUTOOL — SYSTEM PLANNING DOCUMENT  v3
  Multi-tenant academic management system for schools
================================================================================


================================================================================
  1. SYSTEM OVERVIEW
================================================================================

EduTool is a multi-tenant platform for schools. The top-level container is an
Organization. All data lives within an org and is never visible outside it.
There is no public registration at any level — the platform owner provisions
Admin accounts, and Admins create all other accounts.

  Role        Managed By          Core Scope
  ----------  ------------------  ----------------------------------------------
  Admin       Platform owner (us) Creates and manages the org's full academic
                                  structure across school years. Creates all
                                  educator and student accounts. Can own
                                  multiple orgs.

  Educators   Admin               Manage lessons, generate assessments, handle
                                  grades, conduct meetings. Operate only within
                                  assigned classes.

  Students    Admin               Take assessments, attend meetings, view live
                                  scores and locked final grades, access full
                                  transcript history.


================================================================================
  2. PLATFORM & ACCOUNT PROVISIONING
================================================================================

--------------------------------------------------------------------------------
  2.1  School Onboarding
--------------------------------------------------------------------------------

  Step 1  School negotiates with the platform owner.
  Step 2  Platform owner manually creates the Admin account and Organization.
  Step 3  A custom @handle is configured (e.g. @collegeofmary). All accounts
          under this org are scoped to it automatically.
  Step 4  Admin receives credentials and accesses their org dashboard.

--------------------------------------------------------------------------------
  2.2  Account Creation by Admin
--------------------------------------------------------------------------------

Admin creates all accounts. No one self-registers.
Credentials are system-generated (10 characters) and cannot be changed.

  Educator Account Fields:
    - Full Name
    - Email (school-provided Gmail)

  Student Account Fields:
    - Full Name
    - Email (school-provided Gmail)
    - Student ID
    - Level Section  (Elementary / High School / Senior High / College)
    - Grade Level or Year Level  (based on level section)
    - Strand  —  if Senior High (from org's existing strands)
    - Course  —  if College (from org's existing courses)

NOTE: The student form is fully dynamic. Selecting a Level Section reveals the
      correct fields. Strand and Course dropdowns show only what exists in the
      org — no hardcoded options.

      College      →  Course + Year Level
      Senior High  →  Strand + Grade Level (11 or 12)
      High School  →  Grade Level only (Grade 7–10)
      Elementary   →  Grade Level only (Grade 1–6)

--------------------------------------------------------------------------------
  2.3  Credential Distribution
--------------------------------------------------------------------------------

  Format        CSV bulk download — all accounts at once
  Columns       Full Name, Student ID, Email, Generated Password,
                Level Section, Course/Strand, Year/Grade Level
  Distribution  Admin distributes externally (print, email, hand out)
                — outside system scope
  Passwords     Cannot be changed. Stay as system-generated permanently.

--------------------------------------------------------------------------------
  2.4  Multiple Organizations per Admin
--------------------------------------------------------------------------------

  • One Admin account can own multiple Organizations (e.g. a chain of schools).
  • Each org has its own fully separate dashboard.
  • No data is ever shared or visible across orgs.


================================================================================
  3. ORGANIZATION STRUCTURE
================================================================================

Each org is structured into Level Sections. Ships with four defaults. Admin
removes any they don't offer.

--------------------------------------------------------------------------------
  3.1  Default Level Sections
--------------------------------------------------------------------------------

  Level Section       Grade/Year Levels    Subdivisions
  ----------------    -----------------    ---------------------------------
  Elementary          Grade 1 – Grade 6    None — grade level only
  High School         Grade 7 – Grade 10   None — grade level only
  Senior High School  Grade 11 – Grade 12  Strands (Admin defines:
                                           ABM, STEM, HUMSS, TVL, etc.)
  College             Year 1 – Year N      Courses (Admin defines:
                                           BSCS, BSBA, BSA, etc.)
                                           + max year level per course

--------------------------------------------------------------------------------
  3.2  Course & Strand Properties  (College / Senior High)
--------------------------------------------------------------------------------

  Property            Details
  ----------------    ----------------------------------------------------------
  Title               e.g. BSCS, STEM
  Description         Full name (e.g. Bachelor of Science in Computer Science)
  Max Year/Grade      How many levels exist under this program
  Semester Setting    Which semester template this course/strand follows
  Educators           Educators assigned here
  Subjects            Organized by year/grade level
  Schedules           Auto-generated from subjects


================================================================================
  4. SCHOOL YEAR MANAGEMENT  (Admin)
================================================================================

The School Year is the top-level time container. Every semester, class, and
record is anchored to a school year. Admin creates a new school year each
cycle. All past years are permanently archived and accessible.

--------------------------------------------------------------------------------
  4.1  New School Year — Carry-Over vs Reset
--------------------------------------------------------------------------------

  Carries Over from Previous Year       Resets / Unlocks for New Year
  ------------------------------------  ----------------------------------------
  Level sections and structure          Schedules — rebuilt fresh from classes
  Courses and strands                   Subjects — unlocked for editing until
  Semester setting selections                       enrollment is triggered
  Educator accounts                     Classes — created fresh each year
  Student accounts                      Grade locks — all start unlocked

NOTE: Semester selections carry over as defaults. Admin can reassign any
      course/strand to a different template if the calendar changed.

--------------------------------------------------------------------------------
  4.2  School Year History
--------------------------------------------------------------------------------

  • All past school years fully archived — permanently accessible to Admin.
  • Archived school years are read-only — no edits, no grade changes.
  • Students can view full grade history across all past school years.


================================================================================
  5. SEMESTER SETTINGS  (Admin)
================================================================================

Reusable templates in a library. Each course/strand independently selects
its own template per school year. Different courses can run on different
calendars within the same school.

  Property      Details
  ----------    ----------------------------------------------------------------
  Title         e.g. June–March Calendar, August–May Calendar
  Description   Optional notes
  Semesters     Up to 3 semesters, each with its own start and end date
  Validation    Date ranges must not overlap — system enforced

  Example A — June–March Calendar:
    1st Semester:   June 14      →  November 14
    2nd Semester:   December 12  →  February 12
    3rd Semester:   February 20  →  April 20

  Example B — August–May Calendar:
    1st Semester:   August 12    →  December 18
    2nd Semester:   January 4    →  March 16


================================================================================
  6. SUBJECT MANAGEMENT  (Admin)
================================================================================

Subjects belong to a course or strand, organized by year/grade level. Form
the foundation of schedules. Unlocked at start of school year, locked on
enrollment trigger.

--------------------------------------------------------------------------------
  6.1  Subject Properties
--------------------------------------------------------------------------------

  Property          Details
  ----------------  ------------------------------------------------------------
  Title             e.g. Data Structure, Biology, Practical Research
  Description       Optional
  Year/Grade Level  e.g. 1st Year, Grade 11
  Assigned Educator The educator who teaches this subject
  Weekday           Which day(s) the subject meets
  Time              e.g. 7:00 AM – 10:00 AM

--------------------------------------------------------------------------------
  6.2  Lock & Unlock Cycle
--------------------------------------------------------------------------------

  Start of School Year    Subjects unlock — Admin adds, edits, removes freely.
  Enrollment Trigger      Admin manually signals enrollment. Subjects lock.
  Locked State            Read-only. Drives enrollment and class creation.
  New School Year         Subjects unlock automatically again.

NOTE: Lock is manual — enrollment processes vary per school and cannot be
      auto-detected by the system.

--------------------------------------------------------------------------------
  6.3  Schedule Conflict Validation
--------------------------------------------------------------------------------

Validates across ALL year/grade levels in the same course/strand.

  Conflict Type 1 — Time Overlap:
    Two subjects in the same level cannot share a weekday time slot.
    System blocks the save and identifies the conflict.

  Conflict Type 2 — Educator Conflict:
    An educator cannot be assigned to two subjects at the same time — even
    across different year levels. System checks all levels before allowing.


================================================================================
  7. CLASS MANAGEMENT  (Admin)
================================================================================

Classes created exclusively by Admin, assigned to educators. Educators manage
content inside — but cannot create or modify the class structure.

--------------------------------------------------------------------------------
  7.1  Class Properties
--------------------------------------------------------------------------------

  Property              Details
  --------------------  --------------------------------------------------------
  Title                 e.g. Data Structure A, Grade 3 Math Section B
  Level Section         Elementary / High School / Senior High / College
  Course / Strand       College and Senior High only
  Year / Grade Level    Which level of students this class targets
  Semester              Which semester this class is active in
  School Year           Which school year this class belongs to
  Capacity              Limited (set a max) or Unlimited
  Weekday(s)            Which days the class meets
  Time                  Start and end time
  Assigned Educator     The educator responsible for this class

--------------------------------------------------------------------------------
  7.2  Week Computation
--------------------------------------------------------------------------------

Counted by calendar week — not by session count.

  Single weekday          Week 1, Week 2, Week 3 ...
  Two weekdays (Mon+Fri)  Week 1.1, Week 1.2, Week 2.1, Week 2.2 ...
  Three weekdays          Week 1.1, Week 1.2, Week 1.3, Week 2.1 ...

--------------------------------------------------------------------------------
  7.3  Student Filtering & Duplicate Check
--------------------------------------------------------------------------------

  Filter    Only students matching Level Section, Year/Grade Level, and
            Course/Strand are shown when adding students to a class.

  Block     System prevents adding a student already enrolled in another
            section of the same subject in the same semester.

--------------------------------------------------------------------------------
  7.4  Class Archiving
--------------------------------------------------------------------------------

  • Admin manually closes and archives classes at end of semester.
  • Archived classes are read-only — accessible to all roles for records.
  • Nothing is ever deleted. Full history preserved permanently.


================================================================================
  8. EDUCATOR MANAGEMENT  (Admin)
================================================================================

--------------------------------------------------------------------------------
  8.1  Removal Rules
--------------------------------------------------------------------------------

  Step 1  Admin attempts to remove an educator.
  Step 2  System checks for active classes assigned to this educator.
  Step 3  BLOCKED if active classes exist — system lists them.
  Step 4  Admin reassigns each active class. Reassignment logged automatically.
  Step 5  Once no active classes remain, removal goes through.

--------------------------------------------------------------------------------
  8.2  Class Ownership History Log
--------------------------------------------------------------------------------

Every class maintains a full ownership history. On reassignment:

  • Original educator's name and ownership period (from → to date) recorded.
  • Reason for reassignment (optional Admin note) logged.
  • New educator's name and start date recorded.
  • All records before reassignment date stay attributed to original educator.
  • All records after attributed to new educator.

NOTE: Records never deleted or re-attributed. Complete audit trail maintained
      for the class across its entire lifetime.


================================================================================
  9. STUDENT MANAGEMENT  (Admin)
================================================================================

--------------------------------------------------------------------------------
  9.1  Dynamic Student Profile
--------------------------------------------------------------------------------

  Level Section       Fields Shown                  Example Values
  ----------------    --------------------------    --------------------------
  Elementary          Grade Level                   Grade 1 ... Grade 6
  High School         Grade Level                   Grade 7 ... Grade 10
  Senior High         Grade Level  +  Strand        Grade 11/12  +  ABM/STEM
  College             Year Level   +  Course        1st–Nth Year  +  BSCS/BSBA

NOTE: Strand and Course dropdowns populated from what exists in the org only.
      No hardcoded options.

--------------------------------------------------------------------------------
  9.2  Profile Changes & Year Level Advancement
--------------------------------------------------------------------------------

  • Admin can change course, strand, or year/grade level.
  • Only allowed between semesters — never mid-semester.
  • Always manual — Admin updates each student individually.
  • Handles irregular students, retakers, course shifters, conditional cases.

--------------------------------------------------------------------------------
  9.3  Graduated Student Accounts
--------------------------------------------------------------------------------

  Trigger     System flags account when student reaches max year level.
  Effect      Account becomes read-only. No further system interaction.
  Transcript  Still fully accessible — full grade history viewable.

--------------------------------------------------------------------------------
  9.4  Student Transcript View
--------------------------------------------------------------------------------

  • Full grade history across all past semesters and school years.
  • Each entry shows the class card for that period.
  • Read-only — students cannot edit any historical data.


================================================================================
  10. LESSON MANAGEMENT  (Educator)
================================================================================

Lessons live inside a class. Each lesson is assigned to a week and powers
the Assessment Generator through AI concept extraction.

--------------------------------------------------------------------------------
  10.1  Lesson Properties
--------------------------------------------------------------------------------

  Property        Details
  ------------    --------------------------------------------------------------
  Title           Name of the lesson
  Description     Optional overview
  Week Assignment Set via Lesson Viewer calendar. Multiple lessons per week OK.
  Lesson Detail   Full content — typed or pasted. Min 10 words for extraction.

--------------------------------------------------------------------------------
  10.2  Concept Extraction
--------------------------------------------------------------------------------

  • Auto-triggered when Lesson Detail of 10+ words is saved.
  • Runs in background — non-blocking. Educator can navigate away freely.
  • In-app notification sent when extraction completes.
  • Extracted concepts feed only the Assessment Generator for this class.

NOTE: Under 10 words = no extraction = lesson cannot be used in generator.

--------------------------------------------------------------------------------
  10.3  Lesson Viewer & Presentation Mode
--------------------------------------------------------------------------------

Calendar layout by week. Shows all lessons and empty weeks at a glance.
Supports forward/backward navigation for in-meeting presentation — educator
can display lesson content directly inside the meeting room, with students
following in real time.


================================================================================
  11. ASSESSMENT MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  11.1  Question Types
--------------------------------------------------------------------------------

  Type              AI Generated    Auto-Graded    Notes
  ----------------  --------------  -------------  ----------------------------
  Multiple Choice   Yes             Yes            Checked against correct answer
  True or False     Yes             Yes            Checked against correct answer
  Identification    Yes             Yes            Checked against correct answer
  Enumeration       Yes             Yes            Checked against correct answer
  Essay             Yes             No             AI generates question.
                                                   Educator manually grades
                                                   each student's answer.

--------------------------------------------------------------------------------
  11.2  Assessment Dates
--------------------------------------------------------------------------------

  Release Date    When assessment becomes accessible. Before this, students
                  see title only — can prepare, questions are hidden.
  End Date        Submission deadline. No submissions after this. Auto-closes.

--------------------------------------------------------------------------------
  11.3  Template Configuration & Generation Flow
--------------------------------------------------------------------------------

  Step 1  Educator selects a lesson. System checks for concept build.
          If none exists, lesson is blocked — cannot proceed.

  Step 2  Concept build is displayed:
            Main Topic: Data Structure
              Section: Stack          →  5 items available
              Section: Queue          →  6 items available
              Section: Binary Tree    →  4 items available
              Section: Linear Data    →  5 items available
              Total available:           20 items

  Step 3  Educator sets:
            Assessment Type:   Quiz / Activity / Exam / Custom
            Total Items:       Must not exceed concept build total (e.g. ≤ 20)

  Step 4  Educator builds item ranges. Each range has:
            - A start and end item number  (e.g. 1–10)
            - One question type            (e.g. Identification)
            - One or more concept sections to fulfill the item count

  Step 5  Section fill logic:
            If one concept section can't fulfill the range alone,
            educator adds more sections until item count is met.

  Step 6  Generation runs in background — non-blocking.
  Step 7  In-app notification when complete.
  Step 8  Educator sets release date, end date, assigns to students.

  Range Configuration Example:
    Range      Type            Concept Sections Used          Valid?
    ---------  --------------  ----------------------------   --------
    Items 1–10  Identification  Stack(5) + Queue(4) + ...=10  ✓
    Items 11–15 Enumeration     Queue(6 avail, 5 needed)      ✓
    Items 16–20 True or False   Binary Tree(4)+Linear(5)=9    ✓ Combined
    Item 21     Essay           Remaining concepts            ✓ AI generates Q

--------------------------------------------------------------------------------
  11.4  Student Assignment & Status
--------------------------------------------------------------------------------

  Status          Meaning
  -----------     --------------------------------------------------------------
  NULL            Not assigned. Treated as missed. Grade impact applied.
  (default)       Educator can override manually.

  Exempted        Student excused. Excluded from grade calculation.
                  Counts as perfect score contribution.

  Custom Score    Educator manually sets a score. Status = Customized.

  Submitted       Submitted within deadline. Score feeds grade computation.

  Draft           Opened but not submitted. Auto-saved on disconnect.
                  Student can resume before end date. Partial submission OK.

--------------------------------------------------------------------------------
  11.5  Assessment Deletion
--------------------------------------------------------------------------------

⚠ WARNING: If an educator deletes an assessment after students have already
  submitted, all scores are wiped and the final grade recomputes without
  that assessment. This action is irreversible.


================================================================================
  12. GRADE MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  12.1  Rubric Configuration
--------------------------------------------------------------------------------

  • Educator defines rubric at class creation.
  • Locked permanently once first student is added — no mid-semester changes.
  • All weights must total exactly 100% — system validated.
  • Assessment-linked categories pull scores from submitted assessments.
  • Manual categories require educator to enter scores directly per student.
  • Educator can freely edit any score before grade locking.

  Example Rubric:
    Activities       20%   Assessment-linked
    Quizzes          20%   Assessment-linked
    Exams            25%   Assessment-linked
    Attendance       10%   Manual entry
    Behavior         10%   Manual entry
    Recitation       10%   Manual entry
    Participation     5%   Manual entry
    ──────────────────────
    Total           100%

--------------------------------------------------------------------------------
  12.2  Student Grade Visibility
--------------------------------------------------------------------------------

  During semester      Students see individual assessment scores as submitted.
  Final computed grade Hidden until class grade is locked.
  Essay pending        Assessment score shows as incomplete until educator
                       grades the essay answers.

--------------------------------------------------------------------------------
  12.3  Grade Display Modes  (Educator View)
--------------------------------------------------------------------------------

  Clean Mode:   Groups by category. Shows total per category — not individual
                items. Click to drill into individual scores.

  Excel Mode:   Full flat list of every individual assessment.
                Best for detailed auditing.

--------------------------------------------------------------------------------
  12.4  Grade Locking
--------------------------------------------------------------------------------

  Admin enables lock window    Admin sets a deadline (e.g. 24-hour window).
  Educator locks manually      Permanent — no unlocking by anyone except
                               platform owner override.
  Auto-lock on deadline        System auto-locks if educator missed deadline.
  After lock                   Grades frozen. Read-only for everyone.
  Platform override            Platform owner can unlock on formal Admin
                               request (extreme cases only). Logged permanently.

⚠ WARNING: If Essay items are still ungraded when educator locks grades,
  system warns the educator but still allows locking. Educator takes full
  responsibility for ungraded essays.


================================================================================
  13. GRADING SCALE CONFIGURATION  (Admin)
================================================================================

Admin defines a grading scale per level section. Different level sections
can use completely different scales.

  Property          Details
  ----------------  ------------------------------------------------------------
  Score Range       Percentage range (e.g. 97–100, 94–96 ...)
  Grade Value       Value for that range (e.g. 1.00, A, Outstanding)
  Remark            Label for that range (e.g. Passed, Failed, Incomplete)
  Passing Threshold Minimum score considered passing (e.g. 75)
  Validation        Ranges must be contiguous, non-overlapping, cover 0–100

  Example — College Scale:
    Score Range    Grade Value    Remark
    -----------    -----------    ----------
    97–100         1.00           Passed
    94–96          1.25           Passed
    91–93          1.50           Passed
    88–90          1.75           Passed
    85–87          2.00           Passed
    82–84          2.25           Passed
    79–81          2.50           Passed
    76–78          2.75           Passed
    75             3.00           Passed
    65–74          5.00           Failed
    Below 65       INC            Incomplete
    Passing threshold: 75

  Example — Elementary Scale:
    Score Range    Grade Value                  Remark
    -----------    ---------------------------  ----------
    90–100         Outstanding                  Passed
    85–89          Very Satisfactory            Passed
    80–84          Satisfactory                 Passed
    75–79          Fairly Satisfactory          Passed
    Below 75       Did Not Meet Expectations    Failed
    Passing threshold: 75


================================================================================
  14. GRADE EXPORT & CLASS CARDS
================================================================================

Both Admin and Educators can trigger exports for their respective scope.

  PDF — Per Student Class Card:
    One document per student. Official distribution format.
    Contains: student info, class info, grade breakdown per rubric category,
              final grade value and remark (per grading scale), educator name,
              org name, school year, semester.

  CSV — Full Class Export:
    All students, all category scores, final grade value, remark, and
    passing status per student. For Admin records and archiving.

NOTE: If class was reassigned mid-semester, card reflects the educator active
      at grade finalization. Full ownership history available to Admin.


================================================================================
  15. MEETING MANAGEMENT  (Educator)
================================================================================

EduTool has a built-in video meeting room — no third-party tools required.
Meetings open automatically at their scheduled date and time.

--------------------------------------------------------------------------------
  15.1  Meeting Properties
--------------------------------------------------------------------------------

  Title             Name or topic
  Description       Optional context
  Start Date/Time   When the meeting room opens automatically
  Invited Students  All students in class, or manually selected subset

--------------------------------------------------------------------------------
  15.2  Built-In Meeting Room Features
--------------------------------------------------------------------------------

  Communication:
    ✓ Video & Audio
    ✓ Chat (text messages during meeting)
    ✓ Raise hand / reactions
    ✓ Screen sharing

  Classroom-Specific:
    ✓ Lesson Presentation Mode — educator selects a lesson and displays
      it to all participants in real time
    ✓ Forward/backward lesson navigation visible to all participants
    ✓ Educator controls who presents, who is muted

--------------------------------------------------------------------------------
  15.3  Meeting Behavior
--------------------------------------------------------------------------------

  • Room opens automatically at the scheduled date and time.
  • Invited students receive in-app notification when meeting is created.
  • Non-invited students can see the meeting and send a join request.
  • Educator accepts or declines requests from inside the room.


================================================================================
  16. NOTIFICATION SYSTEM
================================================================================

In-app only. No email or SMS. Simple list — no read/unread tracking.

  Trigger                           Recipient         When
  --------------------------------  ----------------  --------------------------
  Concept extraction complete       Educator          Background job finishes
  Assessment generation complete    Educator          Background job finishes
  Assessment released               Assigned students Release date is reached
  Assessment deadline approaching   Assigned students Before end date
  Meeting created                   Invited students  Immediately on creation
  Grade lock window opened          All educators     Admin enables lock window
  Auto-lock applied                 Affected educator Class auto-locked at deadline


================================================================================
  17. ADMIN DASHBOARD & ANALYTICS
================================================================================

Per-org analytics scoped to each org's dashboard separately.

  • Total enrollment — per level section, course, strand, year/grade level.
  • Active class count per semester.
  • Grade distribution summaries (after grades are locked).
  • Educator count and class load overview.
  • Pending actions — classes with unlocked grades near the lock deadline.


================================================================================
  18. SYSTEM SUMMARY
================================================================================

  Role        Manages                                   Cannot Do
  ----------  ----------------------------------------  ------------------------
  Admin       Organizations, school years, level         Manage lesson content,
              sections, courses/strands, subjects,       generate assessments,
              classes, schedules, all accounts,          enter grades, or
              grading scales, lock windows, exports,     override locks (except
              analytics.                                 via platform request).

  Educators   Lessons, concept extraction, assessments   Create/modify classes.
              (config + generation + assignment +         View other educators'
              manual essay grading), grades, meetings,   classes. Change student
              grade exports for own classes.             profiles.

  Students    Take assessments, attend meetings,         Modify any academic
              view live assessment scores, view          data. View other
              locked final grades, full transcript.      students' data.


================================================================================
  EduTool  •  System Planning Document  v3
================================================================================