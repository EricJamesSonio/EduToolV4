================================================================================
  EDUTOOL — SYSTEM PLANNING DOCUMENT  v6
  Multi-tenant academic management system for schools
================================================================================


================================================================================
  1. SYSTEM OVERVIEW
================================================================================

EduTool is a multi-tenant platform for schools. The top-level container is an
Organization. All data lives within an org and is never visible outside it.
No public registration exists — the platform owner provisions Admin accounts,
and Admins create all other accounts.

  Role        Managed By          Core Scope
  ----------  ------------------  ----------------------------------------------
  Admin       Platform owner      Creates and manages the org's full academic
                                  structure. Creates all educator and student
                                  accounts. One org per Admin account.

  Educators   Admin               Manage lessons, assessments, grades, attendance,
                                  and meetings — only within assigned classes.

  Students    Admin               Take assessments, attend meetings, view
                                  published scores, view locked final grades,
                                  access full transcript history.


================================================================================
  2. PLATFORM & ACCOUNT PROVISIONING
================================================================================

--------------------------------------------------------------------------------
  2.1  School Onboarding Flow
--------------------------------------------------------------------------------

  Step 1  School negotiates with the platform owner (us).
  Step 2  Platform owner manually creates one Admin account for the school.
  Step 3  Admin logs in and creates their Organization — setting the name
          and custom @handle (e.g. @collegeofmary) at this point.
  Step 4  Org is active. Admin begins creating educator and student accounts.

NOTE: One org per Admin account. Prevents account reuse across schools and
      ensures each school has a clean, isolated environment.

--------------------------------------------------------------------------------
  2.2  Account Creation by Admin
--------------------------------------------------------------------------------

Admin creates all accounts. No self-registration. Credentials system-generated
(10 characters).

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
      correct fields. Strand and Course dropdowns show only what exists in
      the org — no hardcoded options.

NOTE: Student profile data (Level Section, Year/Grade Level, Strand, Course)
      is used by the system to automatically enroll students into matching
      classes. See Section 7.2 for auto-enrollment behavior.

--------------------------------------------------------------------------------
  2.3  Password Management
--------------------------------------------------------------------------------

  Reset scope       All educator accounts  |  All student accounts
                    Both  |  Selected specific accounts

  Effect            New password generated. Previous password stops working
                    immediately.

  Use case          Admin resets -> distributes new CSV -> accounts
                    inaccessible until new credentials received.
                    Acts as an access control mechanism.

  User control      Educators and students cannot change their own passwords.
                    Only Admin can reset them.

--------------------------------------------------------------------------------
  2.4  Credential Distribution
--------------------------------------------------------------------------------

  Format      CSV bulk download — all accounts at once
  Columns     Full Name, Student ID, Email, Generated Password,
              Level Section, Course/Strand, Year/Grade Level
  Delivery    Admin distributes externally (print, email, hand out)


================================================================================
  3. ORGANIZATION STRUCTURE
================================================================================

  Level Section       Grade/Year Levels    Subdivisions
  ----------------    -----------------    ------------------------------------
  Elementary          Grade 1 - Grade 6    None — grade level only
  High School         Grade 7 - Grade 10   None — grade level only
  Senior High School  Grade 11 - Grade 12  Strands — Admin defines
                                           (e.g. ABM, STEM, HUMSS, TVL)
  College             Year 1 - Year N      Courses — Admin defines
                                           (e.g. BSCS, BSBA, BSA)
                                           + max year level per course

  Course / Strand Properties:
    Title               e.g. BSCS, STEM
    Description         Full name
    Max Year/Grade      How many levels exist under this program
    Semester Setting    Which semester template this course/strand follows
    Educators           Assigned educators
    Subjects            Organized by year/grade level
    Schedules           Auto-generated from subjects


================================================================================
  4. SCHOOL YEAR MANAGEMENT  (Admin)
================================================================================

  Carries Over from Previous Year       Resets / Unlocks for New Year
  ------------------------------------  ----------------------------------------
  Level sections and structure          Schedules — rebuilt fresh
  Courses and strands                   Subjects — unlocked until enrollment
  Semester setting selections           Classes — created fresh
  Educator accounts                     Grade locks — all start unlocked
  Student accounts

NOTE: All past school years permanently archived and read-only. Students
      can view full grade history across all years.


================================================================================
  5. SEMESTER SETTINGS  (Admin)
================================================================================

Reusable templates. Each course/strand independently selects its own template
per school year.

  Up to 3 semesters per template — each with its own start and end date.
  Date ranges must not overlap — system enforced.

  Example A — June-March:     1st: Jun 14-Nov 14 | 2nd: Dec 12-Feb 12 | 3rd: Feb 20-Apr 20
  Example B — August-May:     1st: Aug 12-Dec 18 | 2nd: Jan 4-Mar 16


================================================================================
  6. SUBJECT MANAGEMENT  (Admin)
================================================================================

  Property          Details
  ----------------  ------------------------------------------------------------
  Title             e.g. Data Structure, Biology
  Year/Grade Level  e.g. 1st Year, Grade 11
  Assigned Educator Who teaches this subject
  Weekday(s)        One or more days per week this subject meets
  Time              Schedule time for this subject

  Multiple Weekday Support:
    A subject can be scheduled on 1 to 5 weekdays per week.
    Each day uses the same assigned time slot.
    Week labeling adapts based on meeting frequency (see Section 7.3).

  Lock/Unlock Cycle:
    Start of year       Unlocked — Admin edits freely.
    Enrollment trigger  Admin manually locks. Subjects become read-only.
    New school year     Automatically unlocks again.

  Schedule Conflict Validation (across ALL year levels in same course/strand):
    Type 1  Two subjects in same level cannot share time slot on same day.
    Type 2  Educator cannot be assigned to two subjects at same time across
            any year level.


================================================================================
  7. CLASS MANAGEMENT  (Admin & Educator)
================================================================================

Admin creates class structure. Educator manages all content inside.

--------------------------------------------------------------------------------
  7.1  Admin — Class Setup Properties
--------------------------------------------------------------------------------

  Title, Level Section, Course/Strand (Senior High/College only),
  Year/Grade Level, Semester, School Year, Assigned Educator,
  Weekday(s), Time

  Weekday(s):
    Admin selects one or more weekdays for the class (e.g. Mon only,
    Mon+Wed+Fri, Mon through Fri for daily classes). Up to 5 days/week.

  Capacity:
    Limited (hard cap set by Admin) or Unlimited.
    Hard block — system cannot enroll students beyond the cap. No override.

--------------------------------------------------------------------------------
  7.2  Auto-Enrollment
--------------------------------------------------------------------------------

  Students are automatically enrolled in classes by the system — educators do
  NOT manually add students.

  Matching Logic:
    When a class is created, the system matches students whose profile satisfies
    ALL of the following:
      - Level Section matches the class's Level Section
      - Year/Grade Level matches the class's Year/Grade Level
      - Course (College) or Strand (Senior High) matches, if applicable

    Any student account created or updated after a class is created is also
    auto-enrolled if their profile matches.

  Capacity Enforcement:
    If a class has a Limited capacity, auto-enrollment stops when the cap is
    reached. Admin must increase the cap or create a new section to accommodate
    additional students.

  Duplicate Prevention:
    System blocks enrollment if the student is already enrolled in a class for
    the same subject in the same semester.

  Late Student Additions:
    If a student is added mid-semester and auto-enrolled, the educator must
    manually assign a status (NULL, Exempted, or Custom Score) for each past
    assessment the student missed.

  Removal:
    Educator can manually remove a student from a class if needed
    (e.g. wrong section, transfer). Removal is logged.

  NOTE: Educators have full visibility into their enrolled student list but
        do not manage enrollment themselves. Changes to a student's profile
        (e.g. strand or year level) trigger re-evaluation of their enrollments.

--------------------------------------------------------------------------------
  7.3  Week Computation  (by calendar week, not session count)
--------------------------------------------------------------------------------

  Single weekday:               Week 1, Week 2, Week 3 ...
  Two weekdays (e.g. Mon+Fri):  Week 1.1, Week 1.2, Week 2.1, Week 2.2 ...
  Three weekdays:               Week 1.1, Week 1.2, Week 1.3, Week 2.1 ...
  Four weekdays:                Week 1.1, Week 1.2, Week 1.3, Week 1.4 ...
  Five weekdays (daily):        Week 1.1, Week 1.2, Week 1.3, Week 1.4, Week 1.5 ...

  The week label reflects the calendar week. Each session within that week
  gets a sub-index (1.1, 1.2, etc.) ordered by weekday.

--------------------------------------------------------------------------------
  7.4  Class Archiving
--------------------------------------------------------------------------------

  Admin manually closes and archives at end of semester. Read-only after.
  Nothing ever deleted. Full history preserved permanently.


================================================================================
  8. EDUCATOR MANAGEMENT  (Admin)
================================================================================

  Removal:
    Blocked if active classes exist. Admin must reassign first.
    Once no active classes remain, removal goes through.

  Class Ownership History Log (on every reassignment):
    - Original educator name and period (from -> to date)
    - Reason for reassignment (optional Admin note)
    - New educator name and start date
    - All records stay attributed to the educator active at the time
    - Complete audit trail — never deleted


================================================================================
  9. STUDENT MANAGEMENT  (Admin)
================================================================================

  Dynamic Profile Form:
    Elementary      Grade Level only              (Grade 1-6)
    High School     Grade Level only              (Grade 7-10)
    Senior High     Grade Level + Strand          (Grade 11-12 + ABM/STEM/etc)
    College         Year Level  + Course          (1st-Nth Year + BSCS/etc)

  Profile Changes:
    Between semesters only. Manual per student. Handles retakers, shifters,
    irregular students, conditional advancement cases.

    NOTE: Updating a student's profile (Level Section, Year/Grade Level,
    Course/Strand) triggers re-evaluation of auto-enrollment. The student
    may be unenrolled from classes that no longer match and enrolled in
    newly matching ones.

  Graduated Accounts:
    System flags when student reaches max year level.
    Account becomes read-only. Transcript remains accessible.

  Transcript:
    Full grade history across all semesters and school years. Read-only.


================================================================================
  10. LESSON MANAGEMENT  (Educator)
================================================================================

  Properties:
    Title, Description (optional), Week Assignment, Lesson Detail (min 10 words)

--------------------------------------------------------------------------------
  10.1  Concept Extraction
--------------------------------------------------------------------------------

  - Auto-triggered when Lesson Detail of 10+ words is saved for the first time.
  - If lesson content is updated after a concept build already exists, the old
    build stays — educator manually triggers re-extraction when ready.
  - Re-extraction replaces the previous concept build entirely.
  - Runs in background — non-blocking. In-app notification on completion.
  - Feeds only the Assessment Generator for this class.

  WARNING: Re-extracting does not affect assessments already generated from
  the old build. Only new assessments use the updated concept build.

--------------------------------------------------------------------------------
  10.2  Lesson Viewer & Presentation Mode
--------------------------------------------------------------------------------

  Calendar layout by week. Educator can present lesson content directly inside
  the meeting room — all participants follow the forward/backward navigation
  in real time.


================================================================================
  11. ASSESSMENT MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  11.1  Question Types
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
  11.2  Assessment Dates
--------------------------------------------------------------------------------

  Release Date    Before this, students see title only — questions hidden.
  End Date        Submission deadline. Assessment auto-closes.

--------------------------------------------------------------------------------
  11.3  Template Configuration & Generation Flow
--------------------------------------------------------------------------------

  Step 1  Select lesson. If no concept build exists, lesson is blocked.

  Step 2  Concept build displays sections and available item counts:
            e.g.  Stack: 5 | Queue: 6 | Binary Tree: 4 | Linear Data: 5
                  Total available: 20 items

  Step 3  Set type (Quiz / Activity / Exam / Custom) and total items.
          System validates — cannot exceed concept build total.

  Step 4  Build item ranges. Each range:
            - Item span (e.g. 1-10)
            - One question type
            - One or more concept sections to fulfill the count
          If one section can't fulfill the range, add more until met.

  Step 5  Generation runs in background — non-blocking.
  Step 6  In-app notification when complete.
  Step 7  Set release date, end date, assign to students.

  Example:
    Range       Type            Sections Used                   Valid?
    ---------   --------------  ------------------------------  --------
    Items 1-10  Identification  Stack(5)+Queue(4)+Arrays(1)=10  OK
    Items 11-15 Enumeration     Queue(6 avail, 5 needed)        OK
    Items 16-20 True or False   Binary Tree(4)+Linear(5), 5 needed  OK
    Item 21     Essay           Remaining concepts              OK

--------------------------------------------------------------------------------
  11.4  Editing Generated Questions
--------------------------------------------------------------------------------

  - Educator can edit any AI-generated question before the release date.
  - Editable: question text, answer choices (MC), correct answer.
  - Essay question text is editable just like other types.
  - Once the release date passes, questions lock — no further edits.

--------------------------------------------------------------------------------
  11.5  Student Assignment & Status
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
  11.6  Score Publishing
--------------------------------------------------------------------------------

  Scores hidden by default. Educator publishes when ready.

  Publish to all      All assigned students see their score at once.
  Publish selected    Only specific students' scores become visible.
  Unpublish           Educator can hide scores again after publishing.
  Default state       Always hidden until explicitly published.

  On grade lock:
    ALL unpublished scores are automatically published when grades are locked.
    Students see final grade + every individual score simultaneously.

--------------------------------------------------------------------------------
  11.7  Assessment Deletion
--------------------------------------------------------------------------------

  WARNING: Deleting an assessment after students have submitted wipes all
  scores. Final grade recomputes without it. Irreversible.


================================================================================
  12. ATTENDANCE MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  12.1  Overview
--------------------------------------------------------------------------------

  Attendance is tracked per class session, not per calendar day.
  Sessions correspond to the class's scheduled weekday(s) within each week.
  The attendance view is organized by week (Week 1, Week 2, etc.) — not a
  full calendar. A class that meets once a week shows one session per week;
  a class meeting three times a week shows three sessions per week.

--------------------------------------------------------------------------------
  12.2  Auto-Attendance from Assessments
--------------------------------------------------------------------------------

  If an assessment is assigned to a student on a given session day:
    - Submitted    → Student is automatically marked Present for that session.
    - Not submitted (NULL, Draft, Exempted, Custom) → No automatic mark.
      Educator resolves manually.

  This means assessment submission doubles as an attendance signal. No separate
  action needed if the student submitted.

--------------------------------------------------------------------------------
  12.3  Manual Attendance Entry
--------------------------------------------------------------------------------

  Educator can manually set or override attendance for any session:

  Status          Meaning
  -----------     --------------------------------------------------------------
  Present         Student attended.
  Absent          Student did not attend.
  Late            Student attended but arrived late.
  Excused         Absence is formally excused.

  Use cases for manual entry:
    - Sessions with no assessment (lecture-only days, activities, etc.)
    - Override auto-marked status if needed (e.g. student submitted but was
      actually marked absent administratively)
    - Any session where the educator needs full control

--------------------------------------------------------------------------------
  12.4  Attendance View — Weekly Layout
--------------------------------------------------------------------------------

  The attendance interface is organized by week, matching the class's week
  structure (see Section 7.3 for week computation).

  Each week expands to show its sessions. For each session, the educator
  sees each enrolled student and their attendance status for that day.

  Weekly view examples:
    Once a week:      Week 1 → 1 session | Week 2 → 1 session | ...
    Twice a week:     Week 1 → Session 1.1, Session 1.2 | Week 2 → ...
    Five days a week: Week 1 → Sessions 1.1 through 1.5 | Week 2 → ...

  Educator can navigate between weeks and edit any session's attendance
  at any time before grades are locked.

--------------------------------------------------------------------------------
  12.5  Attendance in Grade Computation
--------------------------------------------------------------------------------

  If the rubric includes an Attendance category (manual entry type), the
  educator inputs the attendance summary score for each student manually —
  the system does not auto-compute a grade from raw attendance records.
  The raw session-by-session attendance data is for tracking and reference;
  the final attendance grade component is manually entered.

  NOTE: This may be revisited in a future version to support auto-calculation
  from session records.


================================================================================
  13. GRADE MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  13.1  Rubric System
--------------------------------------------------------------------------------

  Admin default rubric
    Admin configures a default rubric for the org. Pre-filled at class
    creation. Educator can adjust or replace it.

  Educator rubric library
    Personal per educator. Saved reusable sets. Built over time.

  Applying a rubric at class creation:
    (a) Use the Admin default
    (b) Pick from personal library
    (c) Build from scratch

  Lock rule     Rubric locks permanently once first student is enrolled.
  Validation    All weights must total exactly 100%.

  Admin Default Rubric Example:
    Activities       20%   Assessment-linked  (auto-pulls from assessments)
    Quizzes          20%   Assessment-linked
    Exams            25%   Assessment-linked
    Attendance       10%   Manual entry
    Behavior         10%   Manual entry
    Recitation       10%   Manual entry
    Participation     5%   Manual entry
    Total           100%

--------------------------------------------------------------------------------
  13.2  Student Grade Visibility
--------------------------------------------------------------------------------

  Assessment scores       Visible only after educator publishes them.
  Final computed grade    Hidden until class grades are locked.
  On grade lock           ALL scores auto-published + final grade revealed.
  Essay pending           Score shows as incomplete until essay is graded.

--------------------------------------------------------------------------------
  13.3  Grade Display Modes  (Educator View)
--------------------------------------------------------------------------------

  Clean Mode    Groups by category. Click to drill into individual scores.
  Excel Mode    Full flat list of every individual assessment.

--------------------------------------------------------------------------------
  13.4  Grade Locking
--------------------------------------------------------------------------------

  Admin enables lock window    Admin sets a deadline (e.g. 24 hours).
  Educator locks manually      Permanent — no unlocking without platform override.
  On lock                      All unpublished scores published. Final grade
                               revealed to students.
  Auto-lock on deadline        System auto-locks if educator missed deadline.
  After lock                   Grades frozen. Read-only for everyone.
  Platform override            Platform owner unlocks on formal Admin request
                               (extreme cases only). Logged permanently.

  WARNING: If Essay items are ungraded when locking, system warns but allows.
  Educator takes full responsibility.


================================================================================
  14. GRADING SCALE CONFIGURATION  (Admin)
================================================================================

  Per level section. Each section can use a completely different scale.

  Property          Details
  ----------------  ------------------------------------------------------------
  Score Range       Percentage range (e.g. 97-100)
  Grade Value       Value for that range (e.g. 1.00, A, Outstanding)
  Remark            Label (e.g. Passed, Failed, Incomplete)
  Passing Threshold Minimum score considered passing
  Validation        Ranges must cover 0-100 fully, no gaps or overlaps

  Lock behavior:
    Grading scale is editable at the start of each school year.
    Once the FIRST grade in that level section is locked for that school year,
    the scale locks for the remainder of the year.
    It unlocks again automatically at the start of the next school year.

  College Scale Example (1.0-5.0 Philippine Style):
    97-100 = 1.00 Passed  |  94-96 = 1.25 Passed  |  91-93 = 1.50 Passed
    88-90  = 1.75 Passed  |  85-87 = 2.00 Passed  |  82-84 = 2.25 Passed
    79-81  = 2.50 Passed  |  76-78 = 2.75 Passed  |  75    = 3.00 Passed
    65-74  = 5.00 Failed  |  Below 65 = INC Incomplete
    Passing threshold: 75

  Elementary Scale Example (Descriptive):
    90-100 = Outstanding Passed       |  85-89 = Very Satisfactory Passed
    80-84  = Satisfactory Passed      |  75-79 = Fairly Satisfactory Passed
    Below 75 = Did Not Meet Expectations Failed
    Passing threshold: 75


================================================================================
  15. GRADE EXPORT & CLASS CARDS
================================================================================

  PDF — Per Student Class Card:
    Student info, class info, grade breakdown per rubric category,
    final grade value and remark, educator name, org name, school year, semester.

  CSV — Full Class Export:
    All students, all category scores, final grade, remark, passing status.

  Both Admin and Educators can trigger exports for their respective scope.
  Class card reflects educator active at grade finalization.


================================================================================
  16. MEETING MANAGEMENT  (Educator)
================================================================================

  Built-in video meeting room — no third-party tools.
  Opens automatically at scheduled date and time.

  Properties:
    Title, Description (optional), Start Date/Time,
    Invited Students (all or selected subset)

  Built-In Room Features:
    - Video & Audio
    - Chat (text during meeting)
    - Raise hand / reactions
    - Screen sharing
    - Lesson Presentation Mode — educator displays lesson to all in real time
    - Forward/backward lesson navigation — all participants follow
    - Educator controls muting and presenting

  Behavior:
    - Room opens automatically at scheduled time.
    - Invited students notified on meeting creation.
    - Non-invited can see meeting exists and send join request.
    - Educator accepts/declines requests from inside the room.
    - Educator manually ends the meeting. No auto-end, no duration limit.
    - Meetings are NOT recorded — live only. No playback after session ends.


================================================================================
  17. NOTIFICATION SYSTEM
================================================================================

  In-app only. No email or SMS. Simple list — no read/unread tracking.

  Trigger                           Recipient         When
  --------------------------------  ----------------  --------------------------
  Concept extraction complete       Educator          Job finishes
  Assessment generation complete    Educator          Job finishes
  Assessment released               Assigned students Release date reached
  Assessment deadline approaching   Assigned students Before end date
  Score published                   Student           Educator publishes score
  Grades locked — scores visible    Students in class Grade lock applied
  Class reassigned                  New educator      Admin reassigns class
  Meeting created                   Invited students  On creation
  Grade lock window opened          All educators     Admin enables window
  Auto-lock applied                 Affected educator Class auto-locked
  Auto-enrolled in class            Student           On enrollment trigger


================================================================================
  18. ADMIN DASHBOARD & ANALYTICS
================================================================================

  Admin sees aggregate analytics only — no access to live class internals
  (active assessments, current grades, unpublished scores).

  - Total enrollment per level section, course, strand, year/grade level.
  - Active class count per semester.
  - Grade distribution summaries (after locking).
  - Educator count and class load overview.
  - Pending actions — classes near auto-lock with unlocked grades.


================================================================================
  19. SYSTEM SUMMARY
================================================================================

  Role        Manages                                   Cannot Do
  ----------  ----------------------------------------  ------------------------
  Admin       One org, school years, level sections,     Manage lesson content,
              courses/strands, subjects, class           generate assessments,
              structure, schedules, all accounts,        enter grades, view
              password resets, grading scales (per       class internals,
              level section, per school year),           or override locks.
              rubric default, lock windows,
              exports, analytics.

  Educators   Lessons, concept extraction (manual        Create/modify class
              re-trigger), assessments (config +         structure. Manage
              generation + question editing +            enrollment. View other
              assignment + essay grading + score         educators' classes.
              publishing), attendance management,        Change student profiles.
              grades, rubric library, meetings,
              exports.

  Students    Take assessments, attend meetings,         Modify any academic
              view published scores, view locked         data. View other
              final grades + all scores on lock,         students' data.
              full transcript.


================================================================================
  EduTool  •  System Planning Document  v6
================================================================================