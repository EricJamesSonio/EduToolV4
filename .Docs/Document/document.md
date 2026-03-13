================================================================================
  EDUTOOL — SYSTEM PLANNING DOCUMENT  v2
  Multi-tenant academic management system for schools
================================================================================


================================================================================
  1. SYSTEM OVERVIEW
================================================================================

EduTool is a multi-tenant academic management platform built for schools. The
top-level container is an Organization. All academic data — level sections,
courses, strands, classes, educators, and students — lives within an org and
is never visible outside it.

  Role          Core Responsibilities
  ----------    ----------------------------------------------------------------
  Admin         Created by the platform. Manages the org's full academic
                structure across school years. Creates all educator and student
                accounts. Owns one or more organizations, each with its own
                separate dashboard.

  Educators     Created by Admin. Manage lessons, generate assessments, handle
                grades, and conduct meetings — only within their assigned
                classes.

  Students      Created by Admin. Join classes, take assessments, attend
                meetings, and track grades and transcript history.

NOTE: No public self-registration exists. The platform owner provisions Admin
      accounts directly per school agreement. Admins create all other accounts
      — everything is tightly scoped to the org.


================================================================================
  2. PLATFORM & ACCOUNT PROVISIONING
================================================================================

EduTool operates on a managed provisioning model. Schools negotiate with the
platform owner to get access. There is no open registration at any level.

--------------------------------------------------------------------------------
  2.1  How Schools Get Access
--------------------------------------------------------------------------------

  Step 1  School negotiates with the platform owner (us).
  Step 2  Platform owner manually creates the Admin account and Organization.
  Step 3  A custom @handle is set for the org (e.g. @collegeofmary).
  Step 4  Admin receives credentials and logs into their org dashboard.

--------------------------------------------------------------------------------
  2.2  Admin Creates All Accounts
--------------------------------------------------------------------------------

  Educator Account Fields:
    - Full Name
    - Email (school-provided Gmail)

  Student Account Fields:
    - Full Name
    - Email (school-provided Gmail)
    - Student ID
    - Level Section  (Elementary / High School / Senior High / College)
    - Grade Level or Year Level  (based on level section)
    - Strand  (if Senior High — from org's existing strands)
    - Course  (if College — from org's existing courses)

NOTE: Student profile fields adapt dynamically based on the selected Level
      Section. Strand and Course dropdowns are populated from what actually
      exists in the org — no hardcoded options.

      College      →  Course + Year Level
      Senior High  →  Strand + Grade Level (11 or 12)
      High School  →  Grade Level only (Grade 7–10)
      Elementary   →  Grade Level only (Grade 1–6)

--------------------------------------------------------------------------------
  2.3  Multiple Organizations per Admin
--------------------------------------------------------------------------------

  • One Admin account can own and manage multiple Organizations.
  • Each org has its own fully separate dashboard.
  • Admin switches between orgs by switching dashboards.
  • No data is ever shared or visible across orgs.


================================================================================
  3. ORGANIZATION STRUCTURE
================================================================================

Each organization is structured into Level Sections. The system ships with a
default template that Admin can customize by removing sections they don't offer.

--------------------------------------------------------------------------------
  3.1  Default Level Section Template
--------------------------------------------------------------------------------

  Level Section       Subdivisions               Notes
  ----------------    -------------------------  ------------------------------
  Elementary          Grade 1 – Grade 6          No courses or strands.
  High School         Grade 7 – Grade 10         No courses or strands.
  Senior High School  Grade 11–12  +  Strands    Admin defines strands
                                                 (e.g. ABM, STEM, HUMSS, TVL).
  College             Year 1–N  +  Courses       Admin defines courses
                                                 (e.g. BSCS, BSBA, BSA).

NOTE: Admin removes any level section the school doesn't offer.

--------------------------------------------------------------------------------
  3.2  Terminology by Level
--------------------------------------------------------------------------------

  Elementary / High School    Grade Levels only — no further subdivisions
  Senior High School          Strands  +  Grade Level (11 or 12)
  College                     Courses  +  Year Level (1st Year – Nth Year)

--------------------------------------------------------------------------------
  3.3  Course & Strand Properties  (College / Senior High)
--------------------------------------------------------------------------------

  Property            Details
  ----------------    ----------------------------------------------------------
  Title               e.g. BSCS, STEM
  Description         Full name (e.g. Bachelor of Science in Computer Science)
  Max Year/Grade      How many levels exist under this course or strand
  Semester Setting    Semester template this course/strand follows
  Educators           Educators assigned here
  Subjects            Organized by year/grade level
  Schedules           Auto-generated from subjects


================================================================================
  4. SCHOOL YEAR MANAGEMENT  (Admin)
================================================================================

The School Year is the top-level time container. All semesters, classes, and
academic activity are anchored to a school year.

--------------------------------------------------------------------------------
  4.1  School Year Properties
--------------------------------------------------------------------------------

  Property          Details
  --------------    ------------------------------------------------------------
  Title             e.g. School Year 2024–2025
  Status            Active (current) or Archived (past, read-only)
  Level Sections    Which level sections are active this school year
  Semester Settings Each course/strand selects its semester template

--------------------------------------------------------------------------------
  4.2  Creating a New School Year
--------------------------------------------------------------------------------

Pre-populated from the previous year as a template. Admin adjusts what changed.

  Carries Over from Previous Year       Resets / Unlocks for New Year
  ------------------------------------  ----------------------------------------
  Level sections and structure          Schedules — rebuilt fresh from classes
  Courses and strands                   Subjects — unlocked for editing until
  Semester setting selections                       enrollment is triggered
  Educator accounts                     Classes — created fresh each year
  Student accounts                      Grade locks — all start unlocked

NOTE: Semester selections carry over as defaults. Admin can reassign a different
      template to any course/strand if the calendar changed for the new year.

--------------------------------------------------------------------------------
  4.3  School Year History
--------------------------------------------------------------------------------

  • All past school years are fully archived and permanently accessible to Admin.
  • Archived school years are read-only — no edits, no grade changes.
  • Students can view their full grade history across all past school years.


================================================================================
  5. SEMESTER SETTINGS  (Admin)
================================================================================

Reusable templates in a library. Selected per course/strand each school year.
Different courses can follow different calendars within the same school.

--------------------------------------------------------------------------------
  5.1  Semester Setting Properties
--------------------------------------------------------------------------------

  Property      Details
  ----------    ----------------------------------------------------------------
  Title         e.g. June–March Calendar, August–May Calendar
  Description   Optional notes
  Semesters     Up to 3 semesters, each with its own start and end date
  Validation    Date ranges must not overlap — system enforced

--------------------------------------------------------------------------------
  5.2  Example Templates
--------------------------------------------------------------------------------

  Template A — June–March Calendar:
    1st Semester:   June 14      →  November 14
    2nd Semester:   December 12  →  February 12
    3rd Semester:   February 20  →  April 20

  Template B — August–May Calendar:
    1st Semester:   August 12    →  December 18
    2nd Semester:   January 4    →  March 16

--------------------------------------------------------------------------------
  5.3  Key Rules
--------------------------------------------------------------------------------

  • Templates are fully editable at any time.
  • New templates can be added anytime to the library.
  • Each course/strand selects its own template per school year independently.
  • Date ranges within a template must not overlap — system blocks conflicts.


================================================================================
  6. SUBJECT MANAGEMENT  (Admin)
================================================================================

Subjects belong to a course or strand, organized by year/grade level. They form
the foundation of the schedule. Unlocked at the start of each school year and
locked when Admin triggers enrollment.

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
  6.2  Subject Lock & Unlock Cycle
--------------------------------------------------------------------------------

  State                   What Happens
  ----------------------  ------------------------------------------------------
  Start of School Year    Subjects unlock — Admin can add, edit, or remove.
  Enrollment Trigger      Admin manually signals enrollment. Subjects lock.
  Locked State            Read-only. Drives enrollment and class creation.
  New School Year         Subjects unlock again for the next cycle.

NOTE: Admin manually triggers the lock. The system does not auto-detect
      enrollment since processes vary per school.

--------------------------------------------------------------------------------
  6.3  Schedule Conflict Validation
--------------------------------------------------------------------------------

Validates across ALL year/grade levels within the same course/strand.

  Conflict Type 1 — Time Overlap:
    Two subjects in the same level cannot share a time slot on the same weekday.
    System blocks the save and shows the conflict.

  Conflict Type 2 — Educator Conflict:
    An educator cannot be assigned to two subjects at the same time — even
    across different year levels. System checks all levels before allowing.


================================================================================
  7. CLASS MANAGEMENT  (Admin)
================================================================================

Classes are created exclusively by Admin and assigned to educators. Educators
manage content inside — lessons, assessments, grades — but cannot create or
modify the class structure itself.

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
  Capacity              Limited (max student count) or Unlimited
  Weekday(s)            Which days the class meets
  Time                  Start and end time
  Assigned Educator     The educator responsible for this class

--------------------------------------------------------------------------------
  7.2  Week Computation
--------------------------------------------------------------------------------

Computed from the semester date range. Counted by calendar week, not sessions.

  Single weekday          Week 1, Week 2, Week 3 ...
  Two weekdays (Mon+Fri)  Week 1.1, Week 1.2, Week 2.1, Week 2.2 ...
  Three weekdays          Week 1.1, Week 1.2, Week 1.3, Week 2.1 ...

--------------------------------------------------------------------------------
  7.3  Student Filtering & Duplicate Check
--------------------------------------------------------------------------------

  Example:
    Class:   Data Structure A  (College, BSCS, 1st Year)
    Filter:  Level = College  AND  Course = BSCS  AND  Year = 1st Year
    Block:   System prevents adding a student already in another section of
             the same subject this semester.

--------------------------------------------------------------------------------
  7.4  Class Archiving
--------------------------------------------------------------------------------

  • Admin manually closes and archives classes at end of semester.
  • Archived classes are fully read-only — accessible for record reference.
  • Nothing is deleted. Full history preserved permanently.


================================================================================
  8. EDUCATOR MANAGEMENT  (Admin)
================================================================================

--------------------------------------------------------------------------------
  8.1  Educator Removal Rules
--------------------------------------------------------------------------------

  Step 1  Admin attempts to remove an educator.
  Step 2  System checks for active classes assigned to this educator.
  Step 3  BLOCKED if active classes exist — system lists them.
  Step 4  Admin reassigns each active class. Reassignment logged automatically.
  Step 5  Once no active classes remain, removal goes through.

--------------------------------------------------------------------------------
  8.2  Class Ownership History
--------------------------------------------------------------------------------

Every class maintains a full ownership history log. On reassignment:

  • Original educator's name and ownership period (from → to date) recorded.
  • Reason for reassignment (optional Admin note) logged.
  • New educator's name and start date recorded.
  • All records before reassignment date stay attributed to original educator.
  • All records after are attributed to the new educator.

NOTE: Records are never deleted or re-attributed. Full audit trail maintained.


================================================================================
  9. STUDENT MANAGEMENT  (Admin)
================================================================================

--------------------------------------------------------------------------------
  9.1  Student Profile Fields
--------------------------------------------------------------------------------

  Field               Details
  ----------------    ----------------------------------------------------------
  Full Name           Student's complete name
  Student ID          School-assigned ID number
  Email               School-provided Gmail
  Level Section       Elementary / High School / Senior High / College
  Grade / Year Level  Specific grade or year within their level section
  Strand              Senior High only — from org's existing strands
  Course              College only — from org's existing courses

NOTE: Form is fully dynamic. Strand and Course dropdowns show only what exists
      in the org. No hardcoded options.

--------------------------------------------------------------------------------
  9.2  Student Profile Changes
--------------------------------------------------------------------------------

  • Admin can change course, strand, or year/grade level.
  • Only allowed between semesters — never mid-semester.
  • Covers shifting, irregular students, retakers, and advancement.
  • Advancement is always manual — Admin updates each student individually.

--------------------------------------------------------------------------------
  9.3  Student Transcript View
--------------------------------------------------------------------------------

  • Students view full grade history across all past semesters and school years.
  • Each entry shows the class card for that period.
  • Read-only — students cannot edit any historical data.


================================================================================
  10. LESSON MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  10.1  Lesson Properties
--------------------------------------------------------------------------------

  Property        Details
  ------------    --------------------------------------------------------------
  Title           Name of the lesson
  Description     Optional
  Week Assignment Set via Lesson Viewer calendar. Multiple lessons per week OK.
  Lesson Detail   Full content. Minimum 10 words to trigger concept extraction.

--------------------------------------------------------------------------------
  10.2  Concept Extraction
--------------------------------------------------------------------------------

  • Auto-triggered when Lesson Detail of 10+ words is saved.
  • Runs in background — non-blocking.
  • In-app notification sent when complete.
  • Extracted concepts feed the Assessment Generator for this class only.

--------------------------------------------------------------------------------
  10.3  Lesson Viewer
--------------------------------------------------------------------------------

Calendar layout organized by week. Empty weeks shown. Supports forward/backward
navigation for in-class presentation mode.


================================================================================
  11. ASSESSMENT MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  11.1  Assessment Dates
--------------------------------------------------------------------------------

  Release Date    When the assessment becomes visible/accessible to students.
  End Date        Submission deadline. No submissions after this.
  Before Release  Students see title only — can prepare, questions hidden.
  After End Date  Closed. No further submissions.

--------------------------------------------------------------------------------
  11.2  Generation Workflow
--------------------------------------------------------------------------------

  Step 1  Educator selects a lesson with completed concept extraction.
  Step 2  System verifies extraction is done. If not, lesson blocked.
  Step 3  Educator configures template (type, item count, sections).
  Step 4  Generation runs in background — non-blocking.
  Step 5  In-app notification when complete.
  Step 6  Educator sets release date, end date, assigns to students.

--------------------------------------------------------------------------------
  11.3  Template Configuration
--------------------------------------------------------------------------------

  Assessment Type   Quiz, Activity, Exam, Custom
  Number of Items   Cannot exceed concept capacity — system validates.
  Sections          Each section links to a concept group. Label shown to
                    students (e.g. "1–10 Data Structure").

--------------------------------------------------------------------------------
  11.4  Student Assignment & Status
--------------------------------------------------------------------------------

  Status          Meaning
  -----------     --------------------------------------------------------------
  NULL            Not assigned. Treated as missed. Grade impact applied.
  Exempted        Excused. Excluded from grade calculation (= perfect score).
  Custom Score    Educator manually sets a score. Status = Customized.
  Submitted       Submitted within deadline. Score feeds grade computation.
  Draft           Opened but not submitted. Auto-saved on disconnect.
                  Student can resume before end date.

NOTE: Partial submissions allowed. Auto-save on disconnect. Resume until
      end date passes.


================================================================================
  12. GRADE MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  12.1  Rubric Configuration
--------------------------------------------------------------------------------

  • Educator defines rubric at class creation.
  • Locked permanently once first student is added.
  • All weights must total exactly 100% — system validated.
  • Assessment-linked categories pull scores from submitted assessments.
  • Manual categories require educator to enter scores directly per student.

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
  12.2  Grade Computation
--------------------------------------------------------------------------------

  • Recomputes automatically on every submission, score edit, or new assignment.
  • Admin configures the org's grading scale from scratch.
  • Grading scale determines how final grades display on class cards.

--------------------------------------------------------------------------------
  12.3  Grade Display Modes
--------------------------------------------------------------------------------

  Clean Mode:   Groups by category. Shows totals per category, not individuals.
                Click category to drill into individual scores.

  Excel Mode:   Full flat list of every individual assessment.
                Best for auditing and detailed review.

--------------------------------------------------------------------------------
  12.4  Grade Locking
--------------------------------------------------------------------------------

  Admin enables lock window    Admin sets a deadline for the lock window.
  Educator locks manually      Permanent. No unlocking ever.
  Auto-lock on deadline        System locks if educator missed the deadline.
  After lock                   Grades frozen. Read-only for everyone.


================================================================================
  13. GRADE EXPORT & CLASS CARDS
================================================================================

Both Admin and Educators can trigger exports.

  PDF — Per Student Class Card:
    Individual doc per student. Official distribution format.
    Contains: student info, class info, grade breakdown per rubric category,
              final grade, educator name, org name, school year, semester.

  CSV — Full Class Export:
    All students, all scores, final grades in tabular format.
    For Admin records and archiving.

  Class Card — Educator Attribution:
    If the class was reassigned mid-semester, the card reflects the educator
    active at grade finalization. Ownership history available to Admin.


================================================================================
  14. MEETING MANAGEMENT  (Educator)
================================================================================

  Title             Name or topic
  Description       Optional
  Start Date/Time   When it begins
  Invited Students  All students or manually selected subset

  • Invited students receive in-app notification.
  • Non-invited students can see the meeting and request to join.
  • Educator accepts or declines requests.


================================================================================
  15. NOTIFICATION SYSTEM
================================================================================

In-app only. No external email or SMS.

  Trigger                           Recipient
  --------------------------------  --------------------------------------------
  Concept extraction complete       Educator
  Assessment generation complete    Educator
  Assessment released               Assigned students
  Assessment deadline approaching   Assigned students
  Meeting created                   Invited students
  Grade lock window opened          Educators
  Auto-lock applied                 Affected educator


================================================================================
  16. ADMIN DASHBOARD & ANALYTICS
================================================================================

Per-org analytics — scoped to each org's dashboard separately.

  • Total enrollment — per level section, course, strand, year/grade.
  • Active class count per semester.
  • Grade distribution summaries (after locking).
  • Educator count and class load overview.
  • Pending actions — classes near lock deadline with unlocked grades.


================================================================================
  17. SYSTEM SUMMARY
================================================================================

  Role        Manages                                   Cannot Do
  ----------  ----------------------------------------  ------------------------
  Admin       Organizations, school years, level         Manage lesson content,
              sections, courses, strands, subjects,      generate assessments,
              classes, schedules, all accounts,          or enter grades.
              grade lock windows, exports.

  Educators   Lessons, assessments, grades, meetings     Create/modify classes.
              — assigned classes only. Grade exports      View other educators'
              for own classes.                           classes. Change student
                                                        profiles.

  Students    Take assessments, attend meetings,         Modify any academic
              view grades and full transcript history.   data. View other
                                                        students' grades.


================================================================================
  EduTool  •  System Planning Document  v2
================================================================================