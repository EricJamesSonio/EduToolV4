================================================================================
  EDUTOOL — ADMIN LEVEL MANAGEMENT
  Role reference extracted from System Planning Document v8.3
================================================================================


================================================================================
  OVERVIEW
================================================================================

Admin is the school operator. Each Admin owns exactly one Organization — all
data within it is fully isolated from every other school on the platform.
Admin creates and manages the entire academic structure, all accounts, and
all configurations that educators and students rely on.

  One Admin  →  One Org  →  Fully isolated from all other orgs.

  Admin manages:
    Organization setup, school years, level structure, programs, sections,
    subjects, classes, all accounts (educators + students), semester settings,
    grading scales, rubrics, academic calendar, exports, analytics, audit log.

  Admin cannot:
    Manage lesson content, generate assessments, enter grades, view live
    class internals (active assessments, unpublished scores, current grades).


================================================================================
  1. ORGANIZATION SETUP
================================================================================

  Admin creates the org on first login. Fields:
    - Name
    - Description

  The org is the top-level container for all school data.
  It is created once and never shared with any other Admin.

--------------------------------------------------------------------------------
  1.1  Data Isolation Guarantee
--------------------------------------------------------------------------------

  Everything Admin creates — students, educators, classes, rubrics, semester
  templates, grading scales, sections, school years, calendar events, and
  logs — exists only within this org and is invisible to all other orgs.

  - All searches (students, educators, classes, etc.) return only this
    org's records. There are no cross-org results.
  - Semester templates, rubrics, and grading scales are not shared globally.
  - Student IDs and Educator IDs are unique within the org, not globally.
  - Identical names (section names, class titles, subject names) in two
    orgs are entirely independent records.


================================================================================
  2. SCHOOL YEAR MANAGEMENT
================================================================================

  Admin manages multiple school years simultaneously within the org.

  Status      Meaning
  ----------  -----------------------------------------------------------------
  Pending     Future year planned in advance. Admin can pre-configure
              structure, subjects, and classes ahead of time.
  Active      Current running school year. Only one Active year at a time.
  Ended       Completed school year. Fully archived and read-only.

  Example:
    School Year 2025-2026  →  Ended
    School Year 2026-2027  →  Active
    School Year 2027-2028  →  Pending

  When a new school year is created, it inherits from the org's Level Defaults
  as a starting template. Admin can modify the new year's structure without
  affecting the defaults or any past years.

  Carries Over from Previous Year       Resets for New Year
  ------------------------------------  ----------------------------------------
  Level sections and structure          Schedules — rebuilt fresh
  Sections (all levels)                 Subjects — unlocked until enrollment
  Courses, strands, programs            Classes — created fresh
  Semester setting selections           Grade locks — all start unlocked
  Educator accounts
  Student accounts (with statuses)

  NOTE: All past school years are permanently archived and read-only.


================================================================================
  3. LEVEL DEFAULTS (Org-Wide Template)
================================================================================

  Admin defines a default level structure for the org. This is the base
  template applied whenever a new school year is created — eliminating
  the need to rebuild from scratch each year.

  If changes are needed for a new year, Admin can:
    (a) Update the level defaults so all future years inherit the change.
    (b) Adjust only the specific school year without touching the defaults.

  Default Level Structure Example:

  ELEMENTARY
    Day Care  |  Kinder
    Grade 1–6  →  Sections per grade: A, B

  HIGH SCHOOL
    Grade 7–10  →  Sections per grade: A, B

  SENIOR HIGH SCHOOL
    Strands: GAS, ABM, STEM  →  Sections per strand: A, B
    Grade levels: 11, 12

  COLLEGE
    Courses: BSCS (4 yrs), ICT (2 yrs), BSTM (4 yrs)
    Sections per year: A, B

  CUSTOM PROGRAMS  (Admin-defined, e.g. TESDA Programs)
    TechVoc  →  3 years  →  Sections per year: A, B
    (Admin can add any number of custom programs)

  NOTE: Section names are defaults only — all names are editable by Admin.
        No auto-naming. Schemes vary per school (letters, trees, numbers).


================================================================================
  4. PROGRAMS, COURSES & STRANDS
================================================================================

  EduTool supports multiple program types under one org:

  Built-in:
    Elementary        Grade levels: Day Care, Kinder, Grade 1–6
    High School       Grade levels: Grade 7–10
    Senior High       Grade levels: Grade 11–12 under defined Strands
    College           Year levels 1–N under defined Courses

  Custom Programs (Admin-defined):
    Admin can add programs such as "TESDA Programs" containing courses like
    TechVoc. These follow the same course/year/section structure as College
    but under a separately labeled program group.

  Each program independently selects its own Semester Setting per school year.

  Program / Course Properties:
    Title, Description, Max Year/Grade, Semester Setting,
    Educators, Subjects, Schedules (auto-generated from classes)


================================================================================
  5. SECTIONS
================================================================================

  Sections are organizational groupings for students — they do NOT
  automatically determine subject enrollment. Section membership and
  subject enrollment are managed independently.

  Section Properties:
    Name, Level Section, Grade/Year Level, Course/Strand, Capacity

  Section Capacity Enforcement:
    When a student is assigned to a section and capacity is full:
      (A) Admin creates a new section (form pre-filled with same level/grade/
          strand; Admin provides a custom name — no auto-naming).
      (B) Admin leaves the student with no section → status set to Pending.
    Outcome logged in Admin Audit Log.

  NOTE: A section is NOT automatically a class.
        A student's section does NOT auto-enroll them in any subjects.


================================================================================
  6. SEMESTER SETTINGS
================================================================================

  Reusable templates. Each program independently selects its own template
  per school year.

  Up to 3 semesters per template. Each semester has:
    - Its own start and end date (no overlaps — system enforced)
    - Its own set of terms (customizable per semester)

  Default term structure per semester: Prelim, Midterm, Pre-Finals, Finals.
  Admin can customize: rename terms, use fewer terms, or any other structure.

  Example A — 2 semesters:
    1st Sem: Jun 14 – Nov 14  |  Terms: Prelim, Midterm, Pre-Finals, Finals
    2nd Sem: Dec 12 – Feb 12  |  Terms: Prelim, Midterm, Pre-Finals, Finals

  Example B — Single semester, custom terms:
    1st Sem: Aug 12 – May 30  |  Terms: Term 1, Term 2, Term 3

  NOTE: One school can have College on a 2-semester system and a TESDA
        program on a completely different structure — all within the same org.


================================================================================
  7. ACADEMIC CALENDAR
================================================================================

  Optional but recommended. Affects lesson scheduling, attendance, and
  meeting behavior across all classes org-wide.

  Event Type      Effect
  --------------  --------------------------------------------------------------
  Holiday         Sessions skipped. Attendance not created. Lesson shifts.
  No Class Day    Same as Holiday.
  Exam Week       Advisory only. No session changes.
  Special Event   Informational only. No effect.

  - Sessions on Holiday / No Class Day are automatically skipped.
  - Lesson week numbering adjusts so no gaps appear.
  - Meeting notifications suppressed on event days.
  - Educators are NOT required to manually adjust for calendar events.

  NOTE: Retroactive calendar events warn Admin that past records may need
        manual review.


================================================================================
  8. SUBJECT MANAGEMENT
================================================================================

  Subjects do NOT contain weekday or time — scheduling is at the Class level.
  The same subject can run at different times for different sections.

  Subject Properties:
    Title, Year/Grade Level, Assigned Educator, Grading System

  Grading System per Subject:
    Admin assigns a grading system to each subject individually.
    General subjects and major subjects can have completely different
    rubric weights and categories.
    Example:
      General subject  →  Activities 30%, Quizzes 30%, Exams 40%
      Major subject    →  Lab Work 25%, Quizzes 20%, Exams 35%, Recitation 20%
    The assigned grading system is inherited by all classes for that subject
    but can be adjusted at the class level by the Educator.

  Lock/Unlock Cycle:
    Start of year       Unlocked — Admin edits freely.
    Enrollment trigger  Admin manually locks. Subjects become read-only.
    New school year     Automatically unlocks again.

  Schedule Conflict Validation (at Class level):
    - Two classes in the same level cannot share a time slot on the same day
      for the same section.
    - An educator cannot be assigned to two classes at the same time.


================================================================================
  9. CLASS MANAGEMENT
================================================================================

  Admin creates the class structure. Educator manages content inside.

  Class Properties:
    Title, Level Section, Course/Strand/Program (if applicable),
    Year/Grade Level, Section (optional), Semester, Term, School Year,
    Assigned Educator, Weekday(s), Time, Capacity (Limited or Unlimited)

  Weekday(s) and Time are set at the class level — not the subject level.
  Each class instance has its own independent schedule.

  Section Targeting:
    If a section is specified, enrollment is filtered to students in that
    section only. If no section is set, all matching students are eligible.

--------------------------------------------------------------------------------
  9.1  Enrollment Management
--------------------------------------------------------------------------------

  Only Admin enrolls students in classes. Educators do NOT add students.

  Enrollment is validated against:
    - Level Section, Year/Grade Level, Course/Strand/Program match
    - Section match (if class has one assigned)
    - Student status = Active
    - No duplicate enrollment in same subject same semester

  Class Capacity Overflow:
    If enrollment would exceed capacity:
      - Admin prompted: add a new parallel session or leave student Pending.
      - If new session added: parallel class created, overflow student enrolled.
      - If declined: student marked Pending Enrollment for that subject.
      - Logged in Admin Audit Log.

  Late additions: educator manually assigns status for each past assessment
  the student missed (NULL, Exempted, or Custom Score).

  Profile changes (section, strand, year level) do NOT auto-re-enroll.
  Admin manages subject enrollment explicitly.

--------------------------------------------------------------------------------
  9.2  Educator Reassignment Mid-Semester
--------------------------------------------------------------------------------

  New educator inherits all lessons, assessments, grades, and attendance.
  Historical attribution of already-graded scores is never modified.

  Every reassignment logs:
    Original educator + period, reason, new educator + start date.
    Audit trail is permanent — never deleted.

--------------------------------------------------------------------------------
  9.3  Class Archiving
--------------------------------------------------------------------------------

  Admin manually closes and archives at end of semester.
  Records are soft-deleted — invisible in active UI, permanently in database.


================================================================================
  10. EDUCATOR ACCOUNT MANAGEMENT
================================================================================

  Educator Account Fields:
    Full Name, Email (school-provided Gmail)
    System auto-generates an Educator ID on creation.

  From an educator's account view, Admin can:
    - View profile and Educator ID
    - See all assigned classes
    - Add or remove class assignments
    - Reset password

  Educator Removal:
    Blocked if active classes exist. Admin must reassign all classes first.


================================================================================
  11. STUDENT ACCOUNT MANAGEMENT
================================================================================

  Student Account Fields:
    Full Name, Email, Student ID (Admin-assigned, unique within org),
    Level Section, Grade/Year Level, Section, Strand (SHS), Course (College/Program)

  The student form is fully dynamic — fields revealed based on Level Section.
  Dropdowns show only what exists in this org.

--------------------------------------------------------------------------------
  11.1  Student Status
--------------------------------------------------------------------------------

  Status        Meaning
  -----------   ----------------------------------------------------------------
  Active        Normal student. Can log in, take assessments, view grades.
  Pending       No section assigned (capacity conflict or incomplete profile).
                Admin must resolve before student can access the system.
  Dropped       Dropped out. Read-only. Enrollments removed. Transcript kept.
  Transferred   Transferred out. Same as Dropped.
  Suspended     Temporary. Cannot log in. Enrollments intact. Admin lifts.
  Graduated     System-set at max year level. Read-only. Transcript accessible.

  Status Transitions:
    - Dropped / Transferred / Graduated → Active requires deliberate Admin
      confirmation step (logged in Audit Log).
    - Suspended → Active: Admin lifts directly.
    - Pending → Active: Admin assigns a valid section.

  Effect on enrollment:
    - Only Active students can be enrolled in subjects.
    - Suspended: retains enrollments but cannot access them.
    - Dropped / Transferred: unenrolled from all active classes.

--------------------------------------------------------------------------------
  11.2  Student Profile
--------------------------------------------------------------------------------

  Dynamic form based on level:
    Elementary      Grade Level + Section
    High School     Grade Level + Section
    Senior High     Grade Level + Strand + Section
    College         Year Level + Course + Section
    Custom Program  Year Level + Program + Section

  Profile changes between semesters only.
  Profile changes do NOT automatically change subject enrollments.

  Transcript: full grade history across all years → semesters → terms → subjects.
  Read-only.

--------------------------------------------------------------------------------
  11.3  Adding a Subject Enrollment
--------------------------------------------------------------------------------

  Only Admin can enroll students in subjects. Flow:

    Step 1  Search for student (by Student ID or name).
    Step 2  View current enrollments.
    Step 3  Select "Add Subject" → search for target class.
    Step 4  System validates: no duplicate, capacity not exceeded, student Active.
    Step 5  Admin confirms → student enrolled.
    Step 6  Educator notified: "New student [Name] added to [Class Title] by Admin."
    Step 7  Educator assigns status for any past assessments student missed.
    Step 8  Logged in Admin Audit Log.

--------------------------------------------------------------------------------
  11.4  Removing a Subject Enrollment
--------------------------------------------------------------------------------

    Step 1  Search for student.
    Step 2  Select enrollment to remove.
    Step 3  System warns if existing grades or submissions exist.
    Step 4  Admin confirms → student unenrolled (soft-deleted record).
    Step 5  Educator notified: "Student [Name] removed from [Class Title] by Admin."
    Step 6  Logged in Admin Audit Log.

  Existing submissions and scores are archived, not wiped.

--------------------------------------------------------------------------------
  11.5  Enrollment Validation on Profile Save
--------------------------------------------------------------------------------

  On every student profile save (create or update):
    Check — Section Capacity:
      Space available → proceed.
      Full → prompt Admin: create new section OR leave student Pending.

  Subject enrollment is NOT triggered automatically from profile save.
  All outcomes logged in Admin Audit Log.

--------------------------------------------------------------------------------
  11.6  Bulk Student Import
--------------------------------------------------------------------------------

  For large schools (1,000+ students). CSV upload instead of one-by-one.

  CSV Columns:
    Full Name, Student ID, Email, Level Section, Grade/Year Level,
    Section, Strand (SHS), Course (College/Program)

  Flow:
    Step 1  Download blank CSV template.
    Step 2  Fill in data externally.
    Step 3  Upload CSV.
    Step 4  System validates each row (required fields, uniqueness, valid refs).
    Step 5  Validation report shown: valid rows count + error rows with reasons.
    Step 6  Admin proceeds with valid rows only, or fixes and re-uploads.
    Step 7  System creates accounts. Passwords generated. CSV available for download.
    Step 8  Section capacity checks run. Conflicts surface as Pending students.

  NOTE: Bulk import does not bypass any validation rules.
  NOTE: Subject enrollment is handled separately after import.


================================================================================
  12. PASSWORD MANAGEMENT
================================================================================

  Reset scope: All educator accounts | All student accounts | Both | Selected
  Effect: New password generated. Previous password stops working immediately.
  Distribution: CSV bulk download → Admin distributes externally.

  CSV columns: Full Name, Student/Educator ID, Email, Generated Password,
               Level Section, Section, Course/Strand, Year/Grade Level, Status.

  Users cannot change their own passwords. Only Admin can reset them.


================================================================================
  13. GRADING SCALE CONFIGURATION
================================================================================

  Configured per level section. Each section can use a completely different
  scale. Admin configures this at the start of each school year.

  Properties:
    Score Range, Grade Value, Remark, Passing Threshold
    Validation: ranges must cover 0–100 fully, no gaps or overlaps.

  Lock behavior:
    Editable at start of year. Locks once the FIRST grade in that level
    section is locked for the year. Unlocks automatically at next school year.

  College Scale Example (1.0–5.0 Philippine Style):
    97-100=1.00  |  94-96=1.25  |  91-93=1.50  |  88-90=1.75  |  85-87=2.00
    82-84=2.25   |  79-81=2.50  |  76-78=2.75  |  75=3.00
    65-74=5.00 Failed  |  Below 65=INC  |  Passing threshold: 75

  Elementary Scale Example (Descriptive):
    90-100=Outstanding  |  85-89=Very Satisfactory  |  80-84=Satisfactory
    75-79=Fairly Satisfactory  |  Below 75=Did Not Meet Expectations
    Passing threshold: 75


================================================================================
  14. RUBRIC MANAGEMENT
================================================================================

  Admin configures a default rubric for the org. This is pre-filled at every
  new class creation. Educators can adjust or replace it.

  Rubric validation: all weights must total exactly 100%.
  Lock rule: rubric locks permanently once the first student is enrolled.

  Admin Default Rubric Example:
    Activities    20%  Assessment-linked
    Quizzes       20%  Assessment-linked
    Exams         25%  Assessment-linked
    Attendance    10%  Manual entry
    Behavior      10%  Manual entry
    Recitation    10%  Manual entry
    Participation  5%  Manual entry
    Total        100%


================================================================================
  15. GRADE LOCK MANAGEMENT
================================================================================

  Admin enables the grade lock window by setting a deadline (e.g. 24 hours).
  All educators are notified when the window opens.

  Educators lock manually within the window.
  System auto-locks any class whose educator missed the deadline.

  On lock:
    - All unpublished scores are auto-published.
    - Final grades become visible to students.
    - Grades are frozen and read-only for everyone.

  Grade Lock Override:
    Admin can unlock grades directly in extreme cases.
    No external approval needed — Admin has full authority.
    Override is logged in the Admin Audit Log.


================================================================================
  16. GRADE EXPORT & CLASS CARDS
================================================================================

  PDF — Per Student Class Card:
    Student info, class info, grade breakdown per rubric category per term,
    term grades, final overall subject grade and remark, educator name,
    org name, school year, semester.

  CSV — Full Class Export:
    All students, all category scores per term, term grades, final grade,
    remark, passing status.

  Admin can trigger exports for any class within the org.


================================================================================
  17. ADMIN DASHBOARD & ANALYTICS
================================================================================

  Admin sees aggregate analytics only — no live class internals
  (no active assessments, no current grades, no unpublished scores).

  Available data:
    - Total enrollment per level section, course, strand, program,
      year/grade level, and section. Broken down by account status.
    - Pending students count (no section assigned).
    - Active class count per semester.
    - Grade distribution summaries (after locking), organized by term.
    - Educator count and class load overview.
    - Pending actions — classes near auto-lock with unlocked grades.


================================================================================
  18. AUDIT LOG
================================================================================

  Permanent, never deleted. Admin can filter and search by date, action
  type, or target entity (Student ID, Educator ID, class, etc.).

  Logged Actions:
    - Student profile changes (field, old value, new value)
    - Account status changes
    - Subject enrollment changes (add / remove)
    - Educator class assignment changes (add / remove / reassign)
    - Section capacity overflow decisions
    - Class capacity overflow decisions
    - Password resets (who was reset, by whom)
    - Grade lock override actions (Admin-initiated)
    - Academic calendar event creation and modification

  Log Fields:
    Timestamp  |  Actor (Admin)  |  Action Type  |  Target Entity  |  Details

  Admin can also view all Educator Activity Logs for oversight.


================================================================================
  EduTool  •  Admin Level Management  •  v8.3
================================================================================