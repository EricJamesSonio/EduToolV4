================================================================================
  EDUTOOL — SYSTEM PLANNING DOCUMENT  v8
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
                                  structure. Creates and manages all educator
                                  and student accounts, including subject
                                  assignments. One org per Admin account.

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
    (System auto-generates an Educator ID on creation)

  Student Account Fields:
    - Full Name
    - Email (school-provided Gmail)
    - Student ID  (Admin-assigned, unique within org)
    - Level Section  (Elementary / High School / Senior High / College)
    - Grade/Year Level  (based on level section)
    - Section  (from org's existing sections for that grade/year level)
    - Strand  —  if Senior High (from org's existing strands)
    - Course  —  if College (from org's existing courses)

  On Save — Enrollment Validation:
    When Admin saves a student's profile (on creation or update), the system
    immediately runs capacity and enrollment checks. See Section 9.5 for the
    full validation flow.

NOTE: The student form is fully dynamic. Selecting a Level Section reveals the
      correct fields. Section, Strand, and Course dropdowns show only what
      exists in the org — no hardcoded options.

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
  Columns     Full Name, Student ID / Educator ID, Email, Generated Password,
              Level Section, Section, Course/Strand, Year/Grade Level,
              Account Status
  Delivery    Admin distributes externally (print, email, hand out)


================================================================================
  3. ORGANIZATION STRUCTURE
================================================================================

--------------------------------------------------------------------------------
  3.1  Level Sections and Sections
--------------------------------------------------------------------------------

  All level sections support named Sections at each grade/year level.
  Sections are created and managed by Admin.

  Level Section       Grade/Year Levels    Sections
  ----------------    -----------------    ------------------------------------
  Elementary          Grade 1 - Grade 6    Admin-defined per grade level
                                           e.g. Grade 3 — Section A, Section B
  High School         Grade 7 - Grade 10   Admin-defined per grade level
                                           e.g. Grade 8 — Narra, Molave
  Senior High School  Grade 11 - Grade 12  Admin-defined per grade + strand
                                           e.g. Grade 11 STEM — Section 1
  College             Year 1 - Year N      Admin-defined per year + course
                                           e.g. BSCS Year 2 — Block A, Block B

  Section Properties:
    Name              e.g. Section A, Block A, Narra
    Level Section     Which level section this belongs to
    Grade/Year Level  Which specific grade or year
    Course/Strand     For Senior High and College only
    Capacity          Maximum number of students allowed in this section

  Section Capacity Enforcement:
    When a student is assigned to a section (on account creation or profile
    update), the system checks the section's current headcount against its
    capacity limit.

    If capacity is reached:
      - System prompts Admin: "Section [Name] is full. Create a new section
        or leave student without a section for now?"
      - If Admin confirms new section: system creates a new section with an
        auto-incremented name (e.g. Block A → Block B) and assigns the student.
      - If Admin declines: student is saved with no section assigned.
        Student status is set to Pending until Admin manually assigns a section.
      - Logged in the Admin Audit Log.

  NOTE: Sections are organizational groupings for students. Classes remain
        independently configured by Admin. A section is NOT automatically
        a class — it just groups students at that level.

--------------------------------------------------------------------------------
  3.2  Courses and Strands
--------------------------------------------------------------------------------

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
  Sections (all levels)                 Subjects — unlocked until enrollment
  Courses and strands                   Classes — created fresh
  Semester setting selections           Grade locks — all start unlocked
  Educator accounts
  Student accounts (with statuses)

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
  6. ACADEMIC CALENDAR  (Admin)
================================================================================

  Admin manages an org-wide academic calendar per school year. This is
  optional but recommended. It affects lesson scheduling, attendance, and
  meeting behavior across all classes.

--------------------------------------------------------------------------------
  6.1  Calendar Event Types
--------------------------------------------------------------------------------

  Event Type      Effect on Classes
  --------------  --------------------------------------------------------------
  Holiday         Class sessions scheduled on this date are skipped.
                  Attendance record is not created for that session.
                  Lesson scheduling shifts automatically.
  No Class Day    Same behavior as Holiday — sessions skipped.
  Exam Week       Advisory only. No automatic session changes. Informs
                  educators of the exam period for planning.
  Special Event   Informational only. No scheduling effect.

--------------------------------------------------------------------------------
  6.2  System Behavior on Event Days
--------------------------------------------------------------------------------

  - Attendance sessions that fall on a Holiday or No Class Day are
    automatically skipped — no record is created, no mark needed.
  - Lesson week assignments adjust so that skipped sessions don't
    create gaps in the week numbering sequence.
  - Meeting reminders and notifications are suppressed on event days.
  - Educators are NOT required to manually adjust their schedules for
    declared calendar events.

  NOTE: If a calendar event is added retroactively (after sessions have
        already been created), Admin is warned that past records may need
        manual review.


================================================================================
  7. SUBJECT MANAGEMENT  (Admin)
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
    Week labeling adapts based on meeting frequency (see Section 8.3).

  Lock/Unlock Cycle:
    Start of year       Unlocked — Admin edits freely.
    Enrollment trigger  Admin manually locks. Subjects become read-only.
    New school year     Automatically unlocks again.

  Schedule Conflict Validation (across ALL year levels in same course/strand):
    Type 1  Two subjects in same level cannot share time slot on same day.
    Type 2  Educator cannot be assigned to two subjects at same time across
            any year level.


================================================================================
  8. CLASS MANAGEMENT  (Admin & Educator)
================================================================================

Admin creates class structure. Educator manages all content inside.

--------------------------------------------------------------------------------
  8.1  Admin — Class Setup Properties
--------------------------------------------------------------------------------

  Title, Level Section, Course/Strand (Senior High/College only),
  Year/Grade Level, Section (optional — target specific section),
  Semester, School Year, Assigned Educator, Weekday(s), Time

  Weekday(s):
    Admin selects one or more weekdays for the class (e.g. Mon only,
    Mon+Wed+Fri, Mon through Fri for daily classes). Up to 5 days/week.

  Section Targeting:
    Admin can optionally assign a class to a specific section.
    If a section is specified, auto-enrollment filters to students
    in that section only. If no section is set, all matching
    students at that level are eligible.

  Capacity:
    Limited (hard cap set by Admin) or Unlimited.
    When capacity is reached and more eligible students exist, see
    Section 8.2 for the overflow handling flow.

--------------------------------------------------------------------------------
  8.2  Auto-Enrollment and Class Capacity Enforcement
--------------------------------------------------------------------------------

  Students are automatically enrolled in classes by the system — educators do
  NOT manually add students.

  Matching Logic:
    When a student account is saved, the system matches classes whose config
    satisfies ALL of the following:
      - Level Section matches the student's Level Section
      - Year/Grade Level matches the student's Year/Grade Level
      - Course (College) or Strand (Senior High) matches, if applicable
      - Section matches, if the class has a section assigned
      - Student's account status is Active

    Only Active students are auto-enrolled. Students with Pending, Dropped,
    Transferred, Suspended, or Graduated status are not auto-enrolled.

  Class Capacity Overflow:
    If auto-enrollment would exceed a class's capacity limit:
      - System prompts Admin: "Class [Title] is full ([N] students). Add
        another weekday session to split the load, or leave the student
        pending enrollment?"
      - If Admin adds a session: a new parallel class is created with the
        same subject and settings but an additional or different weekday.
        The overflow student(s) are enrolled in the new class.
      - If Admin declines: the student is marked as Pending Enrollment for
        that subject. Admin must resolve before the student can access it.
      - Logged in the Admin Audit Log.

  Duplicate Prevention:
    System blocks enrollment if the student is already enrolled in a class
    for the same subject in the same semester.

  Additional Subject Assignment (Admin only):
    If a student needs to be enrolled in a class outside their standard
    profile match — e.g. an extra subject, an elective, a retake — only
    Admin can trigger this. See Section 10.3 for the full flow.

  Late Student Additions:
    If a student is auto-enrolled or manually enrolled mid-semester, the
    educator must manually assign a status (NULL, Exempted, or Custom Score)
    for each past assessment the student missed.

  Removal:
    Educator can manually remove a student from a class if needed
    (e.g. wrong section, transfer). Removal is logged in the Educator
    Activity Log.

  NOTE: Changes to a student's profile (e.g. section, strand, year level)
        trigger re-evaluation of their enrollments.

--------------------------------------------------------------------------------
  8.3  Week Computation  (by calendar week, not session count)
--------------------------------------------------------------------------------

  Single weekday:               Week 1, Week 2, Week 3 ...
  Two weekdays (e.g. Mon+Fri):  Week 1.1, Week 1.2, Week 2.1, Week 2.2 ...
  Three weekdays:               Week 1.1, Week 1.2, Week 1.3, Week 2.1 ...
  Four weekdays:                Week 1.1, Week 1.2, Week 1.3, Week 1.4 ...
  Five weekdays (daily):        Week 1.1 through Week 1.5, Week 2.1 ...

  The week label reflects the calendar week. Each session within that week
  gets a sub-index (1.1, 1.2, etc.) ordered by weekday.
  Sessions that fall on Academic Calendar event days are skipped and do not
  consume a week index.

--------------------------------------------------------------------------------
  8.4  Class Archiving
--------------------------------------------------------------------------------

  Admin manually closes and archives at end of semester. Read-only after.
  Records are soft-deleted — invisible in active UI but permanently stored
  in the database. See Section 20 for soft delete policy.

--------------------------------------------------------------------------------
  8.5  Educator Reassignment Mid-Semester
--------------------------------------------------------------------------------

  When Admin reassigns a class to a new educator mid-semester:

  The new educator inherits:
    - All lessons and concept builds
    - All assessments (including generated questions)
    - All grading responsibilities (including ungraded essays)
    - All unpublished scores
    - All attendance records

  Historical Attribution:
    Scores and grades already recorded remain attributed to the educator
    who graded them at the time. Attribution is never modified retroactively.

  Ownership History Log (on every reassignment):
    - Original educator name, period (from → to date)
    - Reason for reassignment (optional Admin note)
    - New educator name and start date
    - Complete audit trail — never deleted


================================================================================
  9. EDUCATOR MANAGEMENT  (Admin)
================================================================================

--------------------------------------------------------------------------------
  9.1  Educator Accounts
--------------------------------------------------------------------------------

  Each educator has a system-generated Educator ID used for lookup and search.
  Admin can search educators by Educator ID or name.

  From an educator's account view, Admin can:
    - View the educator's profile and Educator ID
    - See all classes currently assigned to this educator
    - Add a class assignment (assign this educator to an existing class)
    - Remove a class assignment (with reassignment flow if class is active)
    - Reset password

--------------------------------------------------------------------------------
  9.2  Educator Removal
--------------------------------------------------------------------------------

  Blocked if active classes exist. Admin must reassign all classes first.
  Once no active classes remain, removal goes through.


================================================================================
  10. STUDENT MANAGEMENT  (Admin)
================================================================================

--------------------------------------------------------------------------------
  10.1  Student Account Status
--------------------------------------------------------------------------------

  Each student account carries a status that controls their access and
  enrollment eligibility.

  Status          Meaning
  -----------     --------------------------------------------------------------
  Active          Normal enrolled student. Auto-enrollment applies. Can log in,
                  take assessments, attend meetings, view grades.
  Pending         Profile is incomplete or a capacity conflict was unresolved
                  on save. Student has no section or class enrollment yet.
                  Admin must resolve before student can access the system.
  Dropped         Student has dropped out. Account is read-only. Enrollments
                  are removed. Transcript preserved. Cannot log in.
  Transferred     Student has transferred to another institution. Same behavior
                  as Dropped — read-only, enrollments removed, transcript kept.
  Suspended       Temporary restriction. Student cannot log in or access
                  classes. Account and enrollments remain intact. Admin lifts
                  suspension to restore Active status.
  Graduated       System-set when student reaches max year level. Read-only.
                  Full transcript accessible. Cannot log in.

  Status Transitions:
    Admin can manually change status at any time, subject to these rules:
      - Dropped / Transferred / Graduated → cannot be reversed to Active
        without platform owner involvement (logged).
      - Suspended → Active: Admin lifts directly.
      - Pending → Active: resolved when Admin assigns a valid section and
        confirms enrollment.

  Effect on Enrollment:
    Only Active students participate in auto-enrollment.
    Suspended students retain existing enrollments but cannot access them.
    Dropped / Transferred students are unenrolled from all active classes.
    Graduated students are flagged read-only; classes archive normally.

--------------------------------------------------------------------------------
  10.2  Student Profile
--------------------------------------------------------------------------------

  Dynamic Profile Form:
    Elementary      Grade Level + Section         (Grade 1-6 + Section Name)
    High School     Grade Level + Section         (Grade 7-10 + Section Name)
    Senior High     Grade Level + Strand          (Grade 11-12 + Strand + Section)
    College         Year Level + Course           (1st-Nth Year + Course + Section)

  Profile Changes:
    Between semesters only. Manual per student. Handles retakers, shifters,
    irregular students, conditional advancement cases.

    NOTE: Updating a student's profile (Level Section, Year/Grade Level,
    Course/Strand, Section) triggers re-evaluation of auto-enrollment.
    The student may be unenrolled from classes that no longer match and
    enrolled in newly matching ones.

  Transcript:
    Full grade history across all semesters and school years. Read-only.

--------------------------------------------------------------------------------
  10.3  Student Account Search
--------------------------------------------------------------------------------

  Admin can search students by:
    - Student ID  (exact or partial match)
    - Full Name
    - Status  (Active / Pending / Dropped / Transferred / Suspended / Graduated)
    - Level Section / Year Level / Section / Course / Strand  (filters)

  From a student's account view, Admin can:
    - View full profile, Student ID, and current status
    - See all current class enrollments (subject, educator, semester)
    - Add an additional subject  (see Section 10.4)
    - Remove a subject enrollment  (see Section 10.5)
    - Change account status
    - Edit profile (between semesters)
    - Reset password

--------------------------------------------------------------------------------
  10.4  Adding an Additional Subject to a Student  (Admin only)
--------------------------------------------------------------------------------

  Educators cannot add subjects to students. Only Admin can.

  Flow:
    Step 1  Admin searches for the student (by Student ID or name).
    Step 2  Admin views the student's current subject/class enrollments.
    Step 3  Admin selects "Add Subject" and searches for the target class
            (by class title, subject, educator, or semester).
    Step 4  System validates:
              - No duplicate enrollment in same subject same semester.
              - Class capacity not exceeded.
              - Student status is Active or resolvable.
    Step 5  Admin confirms. System enrolls the student in the class.
    Step 6  Educator assigned to that class receives a notification:
              "New student [Name] has been added to your class [Class Title]
               by Admin."
    Step 7  If the class has past assessments, educator manually assigns
            status for each one (NULL, Exempted, or Custom Score).
    Step 8  Action is logged in the Admin Audit Log.

  NOTE: This is the only pathway for enrolling a student in a class that
        does not match their standard profile. Admin takes full responsibility.

--------------------------------------------------------------------------------
  10.5  Removing a Subject from a Student  (Admin only)
--------------------------------------------------------------------------------

  Flow:
    Step 1  Admin searches for the student.
    Step 2  Admin selects the enrollment to remove.
    Step 3  System warns if the class has existing grades or submissions.
    Step 4  Admin confirms. Student is unenrolled. Removal is soft-deleted
            (record preserved, invisible in active views).
    Step 5  Educator assigned to that class receives a notification:
              "Student [Name] has been removed from your class [Class Title]
               by Admin."
    Step 6  Action is logged in the Admin Audit Log.

  NOTE: Existing submissions and scores are archived, not wiped.

--------------------------------------------------------------------------------
  10.5  Enrollment Validation on Save
--------------------------------------------------------------------------------

  Every time Admin saves a student profile (creation or update), the system
  runs the following checks in order:

  Check 1 — Section Capacity:
    Does the assigned section have space?
      YES → proceed.
      NO  → prompt Admin: create new section or leave student with no section
            (Pending status). See Section 3.1 for section capacity flow.

  Check 2 — Class Matching:
    For each subject applicable to this student's profile, is there a
    matching class with available capacity?
      YES → enroll student automatically.
      NO (class full) → prompt Admin: add a session/split class or mark
            student as Pending Enrollment for that subject.
            See Section 8.2 for class capacity overflow flow.

  Check 3 — Duplicate Enrollment:
    Is the student already enrolled in this subject for this semester?
      YES → skip (no duplicate created, no error shown).
      NO  → enroll.

  All outcomes (enrollments, pending flags, skipped duplicates) are logged
  in the Admin Audit Log.


================================================================================
  11. LESSON MANAGEMENT  (Educator)
================================================================================

  Properties:
    Title, Description (optional), Week Assignment, Lesson Detail (min 10 words)

--------------------------------------------------------------------------------
  11.1  Concept Extraction
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
  11.2  Lesson Viewer & Presentation Mode
--------------------------------------------------------------------------------

  Calendar layout by week. Educator can present lesson content directly inside
  the meeting room — all participants follow the forward/backward navigation
  in real time.


================================================================================
  12. ASSESSMENT MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  12.1  Question Types
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
  12.2  Assessment Dates
--------------------------------------------------------------------------------

  Release Date    Before this, students see title only — questions hidden.
  End Date        Submission deadline. Assessment auto-closes.

--------------------------------------------------------------------------------
  12.3  Template Configuration & Generation Flow
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
  12.4  Editing Generated Questions
--------------------------------------------------------------------------------

  - Educator can edit any AI-generated question before the release date.
  - Editable: question text, answer choices (MC), correct answer.
  - Essay question text is editable just like other types.
  - Once the release date passes, questions lock — no further edits.

--------------------------------------------------------------------------------
  12.5  Student Assignment & Status
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
  12.6  Assessment Attempt Control
--------------------------------------------------------------------------------

  Each student may have only one active attempt per assessment at any time.

  When a student opens an assessment:
    - An attempt record is created with status = Active.
    - All auto-save progress is stored under this attempt.

  If the same student opens the assessment from another tab or device:
    - System detects the existing Active attempt.
    - The existing attempt is resumed — no new attempt created.
    - Previous progress is restored exactly where left off.

  This prevents:
    - Multiple simultaneous tab attempts
    - Multiple device attempts
    - Accidental duplicate submissions

  On submission: attempt status is set to Submitted. No further access.
  On end date:   all Draft attempts are closed automatically.

--------------------------------------------------------------------------------
  12.7  Score Publishing
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
  12.8  Assessment Deletion
--------------------------------------------------------------------------------

  WARNING: Deleting an assessment after students have submitted wipes all
  scores. Final grade recomputes without it.
  Assessment is soft-deleted — removed from active UI but preserved in DB.


================================================================================
  13. ATTENDANCE MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  13.1  Overview
--------------------------------------------------------------------------------

  Attendance is tracked per class session, not per calendar day.
  Sessions correspond to the class's scheduled weekday(s) within each week.
  Sessions that fall on Academic Calendar event days (Holiday / No Class Day)
  are automatically skipped — no record is created.

  The attendance view is organized by week (Week 1, Week 2, etc.) — not a
  full calendar. A class that meets once a week shows one session per week;
  a class meeting three times a week shows three sessions per week.

--------------------------------------------------------------------------------
  13.2  Auto-Attendance from Assessments
--------------------------------------------------------------------------------

  If an assessment is assigned to a student on a given session day:
    - Submitted    → Student is automatically marked Present for that session.
    - Not submitted (NULL, Draft, Exempted, Custom) → No automatic mark.
      Educator resolves manually.

--------------------------------------------------------------------------------
  13.3  Manual Attendance Entry
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
    - Override auto-marked status if needed
    - Any session where the educator needs full control

--------------------------------------------------------------------------------
  13.4  Attendance View — Weekly Layout
--------------------------------------------------------------------------------

  Each week expands to show its sessions. For each session, the educator sees
  each enrolled student and their attendance status for that day.

  Weekly view examples:
    Once a week:      Week 1 → 1 session | Week 2 → 1 session | ...
    Twice a week:     Week 1 → Session 1.1, Session 1.2 | Week 2 → ...
    Five days a week: Week 1 → Sessions 1.1 through 1.5 | Week 2 → ...

  Educator can navigate between weeks and edit any session's attendance
  at any time before grades are locked.

--------------------------------------------------------------------------------
  13.5  Attendance in Grade Computation
--------------------------------------------------------------------------------

  If the rubric includes an Attendance category (manual entry type), the
  educator inputs the attendance summary score per student manually.
  The raw session-by-session records are for reference and tracking only.

  NOTE: Auto-calculation from session records may be added in a future version.


================================================================================
  14. GRADE MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  14.1  Rubric System
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
  14.2  Student Grade Visibility
--------------------------------------------------------------------------------

  Assessment scores       Visible only after educator publishes them.
  Final computed grade    Hidden until class grades are locked.
  On grade lock           ALL scores auto-published + final grade revealed.
  Essay pending           Score shows as incomplete until essay is graded.

--------------------------------------------------------------------------------
  14.3  Grade Display Modes  (Educator View)
--------------------------------------------------------------------------------

  Clean Mode    Groups by category. Click to drill into individual scores.
  Excel Mode    Full flat list of every individual assessment.

--------------------------------------------------------------------------------
  14.4  Grade Locking
--------------------------------------------------------------------------------

  Admin enables lock window    Admin sets a deadline (e.g. 24 hours).
  Educator locks manually      Permanent — no unlocking without platform override.
  On lock                      All unpublished scores published. Final grade
                               revealed to students.
  Auto-lock on deadline        System auto-locks if educator missed deadline.
  After lock                   Grades frozen. Read-only for everyone.
  Platform override            Platform owner unlocks on formal Admin request
                               (extreme cases only). Logged in Admin Audit Log.

  WARNING: If Essay items are ungraded when locking, system warns but allows.
  Educator takes full responsibility.


================================================================================
  15. GRADING SCALE CONFIGURATION  (Admin)
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
  16. GRADE EXPORT & CLASS CARDS
================================================================================

  PDF — Per Student Class Card:
    Student info, class info, grade breakdown per rubric category,
    final grade value and remark, educator name, org name, school year, semester.

  CSV — Full Class Export:
    All students, all category scores, final grade, remark, passing status.

  Both Admin and Educators can trigger exports for their respective scope.
  Class card reflects educator active at grade finalization.


================================================================================
  17. MEETING MANAGEMENT  (Educator)
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
    - Meeting reminders and notifications are suppressed on Academic Calendar
      event days (Holiday / No Class Day).
    - Invited students notified on meeting creation.
    - Non-invited can see meeting exists and send join request.
    - Educator accepts/declines requests from inside the room.
    - Educator manually ends the meeting. No auto-end, no duration limit.
    - Meetings are NOT recorded — live only. No playback after session ends.


================================================================================
  18. NOTIFICATION SYSTEM
================================================================================

  In-app only. No email or SMS. Simple list — no read/unread tracking.

  Trigger                               Recipient         When
  ------------------------------------  ----------------  ----------------------
  Concept extraction complete           Educator          Job finishes
  Assessment generation complete        Educator          Job finishes
  Assessment released                   Assigned students Release date reached
  Assessment deadline approaching       Assigned students Before end date
  Score published                       Student           Educator publishes
  Grades locked — scores visible        Students in class Grade lock applied
  Class reassigned                      New educator      Admin reassigns class
  Meeting created                       Invited students  On creation
  Grade lock window opened              All educators     Admin enables window
  Auto-lock applied                     Affected educator Class auto-locked
  Auto-enrolled in class                Student           On enrollment trigger
  Student added to class by Admin       Educator          Admin adds student
  Student removed from class by Admin   Educator          Admin removes student
  Enrollment pending (capacity full)    Admin             On capacity block

  Retention Policy:
    Notifications older than 90 days are archived automatically.
    Archived notifications are removed from the active list but retained
    in internal logs. They are not visible to users after archiving.


================================================================================
  19. ADMIN DASHBOARD & ANALYTICS
================================================================================

  Admin sees aggregate analytics only — no access to live class internals
  (active assessments, current grades, unpublished scores).

  - Total enrollment per level section, course, strand, year/grade level,
    and section. Broken down by account status.
  - Pending students count (no section or pending enrollment).
  - Active class count per semester.
  - Grade distribution summaries (after locking).
  - Educator count and class load overview.
  - Pending actions — classes near auto-lock with unlocked grades.


================================================================================
  20. SOFT DELETE POLICY
================================================================================

  EduTool uses soft deletion for critical records. No academic data is
  permanently destroyed. Deleted records are flagged with a deleted_at
  timestamp and become invisible in the active UI but remain fully stored
  in the database.

  Soft Delete Applies To:
    - Classes
    - Assessments
    - Lessons
    - Enrollments
    - Meetings

  Behavior:
    - Soft-deleted records do not appear in any active view for any role.
    - Historical grade and score records referencing soft-deleted items
      are preserved and still contribute to transcripts and exports.
    - Platform owner can access raw data for dispute resolution or recovery.

  Hard deletes are never performed on any of the above record types.


================================================================================
  21. AUDIT LOGS
================================================================================

  EduTool maintains two tiers of activity logs — Admin-level and
  Educator-level — stored permanently and never deleted.

--------------------------------------------------------------------------------
  21.1  Admin Audit Log
--------------------------------------------------------------------------------

  Records high-impact administrative actions across the org.

  Logged Actions:
    - Student profile changes (field, old value, new value)
    - Account status changes (Active / Dropped / Suspended / etc.)
    - Subject assignment changes (add / remove enrollment)
    - Educator class assignment changes (add / remove / reassign)
    - Section capacity overflow decisions (new section created / student pending)
    - Class capacity overflow decisions (new session added / student pending)
    - Password resets (who was reset, by whom)
    - Grade lock override requests (platform owner actions)
    - Academic calendar event creation and modification

  Log Fields:
    Timestamp     |  Actor (Admin)  |  Action Type  |  Target Entity  |  Details

  Admin can filter and search the audit log by date, action type, or
  target entity (Student ID, Educator ID, class, etc.).

--------------------------------------------------------------------------------
  21.2  Educator Activity Log
--------------------------------------------------------------------------------

  Records class-level events scoped to each educator's classes.
  Educators see only their own class logs.

  Logged Events:
    - New student enrolled in class (auto or by Admin)
    - Student removed from class (by educator or Admin)
    - Meeting started / ended
    - Assessment created, edited, published, deleted
    - Scores published / unpublished
    - Grade locked (by educator or auto-lock)
    - Lesson created or updated
    - Concept extraction triggered / completed

  Log Fields:
    Timestamp  |  Event Type  |  Details  |  Class

  Educator Activity Logs are also visible to Admin for oversight.


================================================================================
  22. SYSTEM SUMMARY
================================================================================

  Role        Manages                                   Cannot Do
  ----------  ----------------------------------------  ------------------------
  Admin       One org, school years, level sections,     Manage lesson content,
              sections + capacity (all levels),          generate assessments,
              courses/strands, subjects, class           enter grades, view live
              structure + capacity, academic calendar,   class internals, or
              all accounts (student + educator),         override locks without
              student statuses, subject assignments,     platform owner.
              educator class assignments, password
              resets, grading scales, rubric default,
              lock windows, exports, analytics,
              audit log access.

  Educators   Lessons, concept extraction, assessments   Create/modify class
              (config + generation + editing +           structure. Add/remove
              assignment + essay grading + score         student enrollments.
              publishing), attendance management,        View other educators'
              grades, rubric library, meetings,          classes. Change student
              exports, activity log (own classes).       profiles or statuses.

  Students    Take assessments (one active attempt),     Modify any academic
              attend meetings, view published scores,    data. View other
              view locked final grades + all scores      students' data.
              on lock, full transcript.


================================================================================
  EduTool  •  System Planning Document  v8
================================================================================