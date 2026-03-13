================================================================================
  EDUTOOL — SYSTEM PLANNING DOCUMENT
  Academic management system for schools
================================================================================


================================================================================
  1. SYSTEM OVERVIEW
================================================================================

EduTool is an academic management platform with three primary user roles, each
with clearly scoped responsibilities.

  Role          Core Responsibilities
  ----------    ----------------------------------------------------------------
  Admin         Manages departments, semester templates, classes, schedules, and
                educator assignments. Scoped to their own school only.

  Educators     Manages lessons, generates assessments, handles grades, and
                conducts meetings for their assigned classes.

  Students      Joins classes, views and takes lessons/assessments, attends
                meetings, and tracks their own grades.

NOTE: Admins cannot view or access other schools. Each admin is scoped
      exclusively to their own school.


================================================================================
  2. AUTHORITY LEVELS
================================================================================

The system enforces a strict three-tier authority model:

  1. Admin      — School head. Owns the academic structure (departments,
                  schedules, classes, semester templates).

  2. Educators  — Teachers. Operate within the classes assigned to them
                  by Admin.

  3. Students   — Learners. Participate in the classes they are enrolled in.

NOTE: Educators cannot create classes. They can only manage classes that the
      Admin has already created and assigned to them.


================================================================================
  3. LEVEL SECTIONS  (Admin)
================================================================================

Admins organize the school into Level Sections, which group related departments
together. Each level section can have its own semester configuration.

  Example Level Sections:
    • Elementary Level
    • High School Level
    • College Level

  Example — College Level:
    Departments:
      - BSCS
      - BSBA
      - BSA
      - BSHM

Why Level Sections Matter:
  Different levels often follow different academic calendars. For example,
  elementary and high school semesters can differ from college. Grouping
  departments into level sections allows each section to be assigned its own
  semester template.


================================================================================
  4. SEMESTER MANAGEMENT  (Admin)
================================================================================

Semesters are reusable templates that define academic time ranges. They are not
directly attached to a single department — instead, departments select a
semester template to follow. This allows different departments to operate on
different academic calendars.

--------------------------------------------------------------------------------
  4.1  Semester Template Properties
--------------------------------------------------------------------------------

  Property        Details
  ------------    --------------------------------------------------------------
  Title           Name of the template (e.g., Main Semester Setting)
  Description     Optional. Brief notes about this template.
  Semesters       Up to 3 semesters (1st, 2nd, 3rd). Each has its own start
                  and end date.
  Validation      Semester date ranges must not overlap. The system validates
                  and rejects conflicting ranges.

--------------------------------------------------------------------------------
  4.2  Example Semester Templates
--------------------------------------------------------------------------------

  Template A — Main Semester Setting
    1st Semester:   August 12     →  December 18
    2nd Semester:   January 4     →  March 16

  Template B — Alternative New Setting
    1st Semester:   June 14       →  November 14
    2nd Semester:   December 12   →  February 12
    3rd Semester:   February 20   →  April 20

--------------------------------------------------------------------------------
  4.3  Key Rules
--------------------------------------------------------------------------------

  • Templates are fully editable at any time.
  • A template can define up to 3 semesters.
  • Templates are reusable — multiple departments can share the same template.
  • Semester date ranges within a template must not overlap (system enforced).
  • Since academic calendars are mostly stable year to year, reusing templates
    reduces redundant configuration.


================================================================================
  5. DEPARTMENT MANAGEMENT  (Admin)
================================================================================

Each department represents a degree program or course offering. Departments are
created and managed by the Admin and live inside a Level Section.

--------------------------------------------------------------------------------
  5.1  Department Object Properties
--------------------------------------------------------------------------------

  Property          Details
  ----------------  ------------------------------------------------------------
  Title             e.g., BSCS, BSBA, BSA, TechVoc
  Description       Full program name (e.g., Bachelor of Science in Computer
                    Science)
  Max Year Level    Defines how many year levels exist (e.g., 4 = 1st–4th year)
  Semester Setting  The semester template this department follows
  Educators         List of educators assigned to this department
  Subjects          Organized list of subjects, sorted by year level
  Schedules         Auto-generated schedule grid, organized per year level

--------------------------------------------------------------------------------
  5.2  Semester Setting per Department
--------------------------------------------------------------------------------

The semester setting is applied at the department level. Different departments
within the same school may follow different academic calendars.

  BSCS Department    →  Follows June–March semester template
  TechVoc Department →  Follows August–May semester template

NOTE: The semester setting drives week computation for all classes within that
      department. Weeks are calculated from the semester start and end dates.

--------------------------------------------------------------------------------
  5.3  Subject Management
--------------------------------------------------------------------------------

Subjects belong to a department and are assigned to a specific year level.
Each subject carries all the information needed to build a schedule.

  Property     Details
  ----------   -----------------------------------------------------------------
  Title        Name of the subject (e.g., Data Structure, OOP, Parallel)
  Description  Optional. Brief description of the subject.
  Year Level   Which year level this subject belongs to (e.g., 1st Year)
  Educator     The educator assigned to teach this subject
  Weekday      Which day(s) of the week the class meets
  Time         Class start and end time (e.g., 7:00 AM – 10:00 AM)

  Example Subject List — BSCS Department:

    Year      Subject              Educator        Weekday      Time
    --------  -------------------  --------------  -----------  ---------------
    1st Year  Data Structure       Eric James      Monday       7:00–10:00 AM
    1st Year  Programming 1        Jay Entileso    Wednesday    12:00–3:00 PM
    1st Year  Computer 1           Rj Diaz         Wednesday    7:00–11:00 AM
    2nd Year  OOP                  Eric James      Tuesday      8:00–11:00 AM
    2nd Year  Algorithms           Jay Entileso    Thursday     1:00–4:00 PM
    3rd Year  Research             Rj Diaz         Monday       1:00–5:00 PM
    3rd Year  Parallel Computing   Eric James      Thursday     7:00–10:00 AM
    4th Year  Thesis               Eric James      Friday       7:00–10:00 AM
    4th Year  IT Review            Jay Entileso    Friday       1:00–4:00 PM

--------------------------------------------------------------------------------
  5.4  Schedule Management
--------------------------------------------------------------------------------

Schedules are automatically generated based on the subjects configured in the
department. When a subject is created with a weekday and time, it is immediately
reflected in the schedule viewer.

  • Each year level has its own schedule view for clarity.
  • Admins can update a subject's weekday and time directly from the schedule
    grid.
  • The schedule grid shows all subjects across weekdays in a visual table.

  Schedule Conflict Validation:
    The system validates schedules across ALL year levels in the department —
    not just within a single year. This is necessary because educators often
    teach across multiple year levels.

    Conflict Type 1 — Time Overlap:
      Two subjects within the same year level cannot occupy the same time slot
      on the same weekday.

    Conflict Type 2 — Educator Conflict:
      An educator cannot be assigned to two subjects at the same time, even if
      those subjects belong to different year levels.

    Conflict Example:
      1st Year — Monday 7:00 AM   →  Data Structure       (Eric James)
      3rd Year — Monday 7:00 AM   →  Parallel Computing   (Eric James)
      Result: CONFLICT — Eric James cannot teach two classes simultaneously.
              The system will block this and display an error.


================================================================================
  6. CLASS MANAGEMENT  (Admin)
================================================================================

Classes are created exclusively by the Admin. Educators cannot create classes —
they can only manage the classes assigned to them.

--------------------------------------------------------------------------------
  6.1  Class Properties
--------------------------------------------------------------------------------

  Property             Details
  -------------------  ---------------------------------------------------------
  Title                Name of the class (e.g., Data Structure A)
  Department/Course    Which department this class belongs to (e.g., BSCS)
  Applicable Year      Which year level this class targets (e.g., 1st Year)
  Semester             Which semester this class is active in (1st, 2nd, 3rd)
  Capacity             Limited (set a max) or Unlimited (no cap)
  Weekday(s)           Which days of the week the class meets
  Time                 Class start and end time
  Assigned Educator    The educator responsible for this class

  Example Class:
    Title:            Data Structure A
    Department:       BSCS
    Year Level:       1st Year
    Semester:         1st Semester
    Weekday:          Monday
    Time:             7:00 AM – 11:00 AM
    Assigned Educator: Eric James
    Capacity:         Limited — 40 Students

--------------------------------------------------------------------------------
  6.2  Capacity Settings
--------------------------------------------------------------------------------

  Limited Capacity:
    Admin sets a maximum student count (e.g., 40). Once the limit is reached,
    no more students can join unless capacity is increased. Suitable for
    standard classrooms with seat limits.

  Unlimited Capacity:
    No maximum is enforced. Any number of students can be added. Suitable for
    open or online classes.

--------------------------------------------------------------------------------
  6.3  Week Computation
--------------------------------------------------------------------------------

When a class is created, the system automatically computes class weeks based on
the semester date range. Weeks are counted by calendar week, not by session.

  • If a class meets on Monday AND Friday (same calendar week), those sessions
    are labeled Week 1.1 and Week 1.2 — NOT Week 1 and Week 2.
  • This ensures week labels accurately reflect the academic calendar.

  Week Computation Example:
    Week 1.1  →  Monday    (first week of semester)
    Week 1.2  →  Friday    (same calendar week)
    Week 2.1  →  Monday    (second week of semester)
    Week 2.2  →  Friday    (same calendar week)

NOTE: Total weeks and labels depend entirely on the semester start and end dates
      of the department's selected semester template.

--------------------------------------------------------------------------------
  6.4  Student Filtering
--------------------------------------------------------------------------------

When adding students to a class, the system automatically filters the student
list based on the class's applicable year level and department/course. Only
matching students appear in the selection list.

  Example:
    Class:          Data Structure A  (BSCS, 1st Year)
    Filter Applied: Course = BSCS  AND  Year Level = 1st Year
    Result:         Only 1st-year BSCS students appear in the selection list

NOTE: Students create their own accounts. Admins do not manually register
      students. The filtering system automatically identifies eligible students.


================================================================================
  7. LESSON MANAGEMENT  (Educator)
================================================================================

Lessons are created by educators and exist within a specific class. Each lesson
is assigned to a week and forms the foundation for assessment generation.

--------------------------------------------------------------------------------
  7.1  Lesson Properties
--------------------------------------------------------------------------------

  Property        Details
  --------------  --------------------------------------------------------------
  Title           Name of the lesson
  Description     Optional. Brief overview of the lesson topic.
  Week Assignment Which week this lesson is scheduled in (set via Lesson Viewer)
  Lesson Detail   The actual lesson content. Minimum 10 words required.

--------------------------------------------------------------------------------
  7.2  Setting the Week
--------------------------------------------------------------------------------

When assigning a week to a lesson, the Lesson Viewer (calendar view) opens.
The educator clicks a week to assign it. Multiple lessons can share the same
week — this is allowed and expected.

--------------------------------------------------------------------------------
  7.3  Lesson Detail and Concept Extraction
--------------------------------------------------------------------------------

The Lesson Detail field powers the automated concept extraction system, which
enables the Assessment Generator.

  • Minimum length: 10 words. Shorter content will not trigger extraction.
  • When a valid Lesson Detail is saved, concept extraction begins automatically
    in the background.
  • The extraction process continues even if the educator navigates away — it
    is non-blocking.
  • The educator receives a notification when extraction is complete.
  • Extracted concepts are used by the Assessment Generator to build assessments.

NOTE: If a lesson has no Lesson Detail, or the detail is too short, it cannot
      be used in the Assessment Generator.

--------------------------------------------------------------------------------
  7.4  Lesson Viewer (Calendar View)
--------------------------------------------------------------------------------

The Lesson Viewer displays lessons in a calendar-style layout organized by week,
giving educators a clear overview of scheduled content and gaps.

  Example:
    January 2  /  Week 1   →  Data Structure — Introduction
    January 7  /  Week 2   →  (No lesson assigned)
    January 14 /  Week 3   →  Data Structure — Arrays and Linked Lists
    January 14 /  Week 3   →  Data Structure — Stack and Queue
                               (multiple lessons in same week — allowed)

NOTE: Lessons support doubly linked list navigation for presentation purposes —
      educators can step forward and backward through lessons during class.


================================================================================
  8. ASSESSMENT GENERATOR  (Educator)
================================================================================

The Assessment Generator is an AI-powered tool that automatically creates
assessments from lesson concepts. It is scoped within a class — assessments
are tied to the class and its students.

--------------------------------------------------------------------------------
  8.1  Generation Workflow
--------------------------------------------------------------------------------

  Step 1  Select a lesson from the class lesson list.

  Step 2  The system checks whether the selected lesson has completed concept
          extraction. If not, the lesson cannot be used — the educator must
          ensure Lesson Detail was provided and extraction has finished.

  Step 3  The educator configures the assessment template (see Section 8.2).

  Step 4  Assessment generation runs in the background. The process is
          non-blocking — navigating away does not cancel it.

  Step 5  The educator receives a notification when generation is complete.

  Step 6  The educator assigns the completed assessment to students
          (see Section 8.3).

--------------------------------------------------------------------------------
  8.2  Assessment Template Configuration
--------------------------------------------------------------------------------

  Field              Details
  -----------------  -----------------------------------------------------------
  Assessment Type    Quiz, Activity, Exam, Custom (educators can define
                     additional types in Assessment Settings)
  Number of Items    How many questions to generate. Must not exceed the concept
                     capacity of the lesson's extraction — system validated with
                     early warning.
  Sections           Divide the assessment into labeled sections (e.g., items
                     1–10: Data Structure). Each section links to a concept group
                     from the extraction. Item count per section is validated
                     against available concepts.

NOTE: The section label (e.g., "1–10 Data Structure") is shown to students so
      they understand which topic each section covers.
NOTE: The educator can cancel an in-progress generation. Otherwise it completes
      in the background.

--------------------------------------------------------------------------------
  8.3  Assessment Assignment
--------------------------------------------------------------------------------

After generation, the educator assigns the assessment to students:
  • Assign to all students in the class, OR
  • Manually select specific students.

  Handling Unassigned Students:
    If a student is not assigned, the system uses flexible status options:

    Status         Meaning
    -----------    -------------------------------------------------------------
    NULL           Default. Student was not assigned. Treated as a missed
    (default)      assessment. Grade impact is applied.

    Exempted       Student is excused. The assessment is excluded from their
                   grade calculation (equivalent to a perfect score contribution).

    Custom Score   The educator manually enters a specific score.
                   Status becomes "Customized".


================================================================================
  9. GRADE MANAGEMENT  (Educator)
================================================================================

Grades are computed automatically based on a global rubric configuration. The
grade system tracks assessment scores and non-assessment grades (e.g., behavior).

--------------------------------------------------------------------------------
  9.1  Global Rubric Configuration
--------------------------------------------------------------------------------

  The grade breakdown is defined globally and applied to all classes.
  Example rubric:

    Activities    20%
    Quizzes       20%
    Exams         30%
    Behavior      30%  (manually entered — cannot be auto-tracked)

--------------------------------------------------------------------------------
  9.2  Grade Computation Triggers
--------------------------------------------------------------------------------

The system automatically recomputes final grades when:
  • A student submits an assessment.
  • An educator manually edits a student's score.
  • A new assessment is created and assigned.

--------------------------------------------------------------------------------
  9.3  Grade Display Modes
--------------------------------------------------------------------------------

  Clean Mode:
    Groups grades by category (Activities, Quizzes, Exams). Shows the computed
    total for each category — not individual items. Click a category to drill
    down and see individual assessment scores. Best for quick review.

  Excel Mode:
    Shows every individual assessment in a full list. Useful for detailed
    review and auditing. More information-dense but less structured.

NOTE: Behavior grades are always entered manually by the educator. The system
      does not auto-track attendance or conduct.


================================================================================
  10. MEETING MANAGEMENT  (Educator)
================================================================================

Educators can schedule meetings for their classes, targeted to all students or
a specific subset.

--------------------------------------------------------------------------------
  10.1  Meeting Properties
--------------------------------------------------------------------------------

  Property          Details
  ----------------  ------------------------------------------------------------
  Title             Name or topic of the meeting
  Description       Optional. Additional context for the meeting.
  Start Date        The calendar date of the meeting
  Start Time        The time the meeting begins
  Invited Students  Select all students in the class, or invite specific
                    students manually

--------------------------------------------------------------------------------
  10.2  Invitation Behavior
--------------------------------------------------------------------------------

  • Invited students receive a notification when the meeting is created.
  • Students who are not invited can still see the meeting and request to join.
  • The educator decides whether to accept or decline join requests.


================================================================================
  11. GLOBAL ACCOUNT SYSTEM
================================================================================

EduTool uses a self-registration model. Admins do not create accounts for
educators or students — each user registers their own account.

  • Students register their own accounts and are filtered by course and year
    level when being added to classes.
  • Educators register their own accounts and are assigned to departments and
    classes by the Admin.
  • Admins are scoped to a single school — they cannot view or manage other
    schools.


================================================================================
  12. SYSTEM SUMMARY
================================================================================

  Role        Manages                                  Cannot Do
  ----------  ---------------------------------------  -------------------------
  Admin       Departments, semester templates,         Manage lessons,
              classes, schedules, educator             assessments, or grades.
              assignments.                             View other schools.

  Educators   Lessons, assessments, grades, meetings   Create classes. Manage
              — all within assigned classes.           departments or schedules.

  Students    Join classes, take assessments, attend   Modify lessons, grades, or
              meetings, view grades.                   any admin-level settings.


================================================================================
  EduTool  •  System Planning Document
================================================================================