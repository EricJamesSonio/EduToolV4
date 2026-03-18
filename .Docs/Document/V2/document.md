================================================================================
  EDUTOOL — SYSTEM PLANNING DOCUMENT  v8.3
  Multi-tenant academic management system for schools
================================================================================


================================================================================
  1. SYSTEM OVERVIEW
================================================================================

EduTool is a multi-tenant platform for schools. The top-level container is an
Organization. All data lives within an org and is never visible outside it.
No public registration exists — the platform owner provisions Admin accounts,
and Admins create all other accounts.

  Role            Managed By          Core Scope
  ----------      ------------------  ------------------------------------------
  Platform Owner  EduTool team        Creates and manages Admin accounts only.
                                      No access to any org's internal data.

  Admin           Platform owner      Creates and manages one org. Manages the
                                      full academic structure within that org.
                                      Creates and manages all educator and
                                      student accounts, including subject
                                      assignments. One org per Admin account.

  Educators       Admin               Manage lessons, assessments, grades,
                                      attendance, and meetings — only within
                                      assigned classes.

  Students        Admin               Take assessments, attend meetings, view
                                      published scores, view locked final grades,
                                      access full transcript history.


================================================================================
  2. DATA ISOLATION — MULTI-TENANT BOUNDARY
================================================================================

Every Admin account owns exactly one Organization. All data created inside
that org — students, educators, classes, subjects, sections, rubrics, semester
settings, grading scales, school years, calendar events, assessments, grades,
transcripts, and audit logs — is strictly scoped to that org and is never
visible, accessible, or shared with any other org or Admin.

This is an absolute system-level boundary. It is not a permission setting —
it cannot be toggled or overridden by any Admin. The Platform Owner has no
access to org-internal data either — their scope is Admin account
management only (see Section 3).

--------------------------------------------------------------------------------
  2.1  What Is Isolated Per Org
--------------------------------------------------------------------------------

  The following are fully isolated per org. An Admin in Org A will never see,
  search, or accidentally access anything belonging to Org B:

  Accounts:
    - Student accounts (profiles, statuses, IDs, sections, enrollments)
    - Educator accounts (profiles, IDs, class assignments)

  Academic Structure:
    - School years and their configuration
    - Level defaults and level structure
    - Programs, courses, strands (including custom programs)
    - Sections and their capacities
    - Subjects and subject-level grading system assignments
    - Classes (schedule, enrollment, capacity)
    - Semester settings and term configurations

  Grading and Assessment:
    - Rubric templates (Admin default rubric and educator rubric libraries)
    - Grading scales per level section
    - All assessment content, scores, and grades
    - Student transcripts and grade history

  Configuration and Logs:
    - Academic calendar events
    - Notification history
    - Admin Audit Log
    - Educator Activity Logs

--------------------------------------------------------------------------------
  2.2  Enforcement Rules
--------------------------------------------------------------------------------

  - All database queries are scoped to the authenticated Admin's org_id.
    No cross-org query is possible through any UI action.

  - An Admin performing any search (students, educators, classes, rubrics,
    semester templates, etc.) will only ever see records belonging to their
    own org. There are no global search results for Admin-level queries.

  - Educator rubric libraries are private to each educator within their org
    and are invisible to educators in other orgs.

  - Semester setting templates created by one Admin are not shared as
    system-wide templates — they exist only within that Admin's org.

  - Grading scales configured by Admin are scoped to their org's level
    sections only and have no effect on any other org.

  - Student IDs and Educator IDs are unique within an org, not globally.
    Two orgs may use the same ID values without any conflict.

  - Section names, class titles, and subject names are local to the org.
    Identical names in two orgs are entirely independent records.

--------------------------------------------------------------------------------
  2.3  Platform Owner Scope Boundary
--------------------------------------------------------------------------------

  The Platform Owner only knows that an Admin account exists — because they
  created it. They cannot see the org's name, structure, students, grades,
  or any internal data. Their scope ends entirely at the Admin account.
  See Section 3 for full Platform Owner capabilities.


================================================================================
  3. PLATFORM OWNER
================================================================================

The Platform Owner is the EduTool team. Their sole responsibility is managing
Admin accounts. They have no visibility into any organization's internal data —
no students, no grades, no classes, no structure of any kind. They simply
provision and maintain the Admin accounts that schools use to access the platform.

--------------------------------------------------------------------------------
  3.1  Platform Owner Capabilities
--------------------------------------------------------------------------------

  Admin Account Management (the full and only scope):
    - Create new Admin accounts (one per school).
    - View all existing Admin accounts and their credentials.
    - View a specific Admin's password in plain text — for distributing
      login credentials to the school client.
    - Copy Admin account credentials for distribution.
    - Reset an Admin's password.
    - Block an Admin account (disables login; the org is unaffected).
    - Unblock a blocked Admin account.

  NOTE: Platform Owner cannot see, enter, or manage any organization's
        internal data — no students, no educators, no classes, no grades,
        no structure, no logs. The org belongs entirely to the Admin.
        Platform Owner scope ends at the Admin account itself.



================================================================================
  4. PLATFORM & ACCOUNT PROVISIONING
================================================================================

--------------------------------------------------------------------------------
  4.1  School Onboarding Flow
--------------------------------------------------------------------------------

  Step 1  School negotiates with the platform owner (us).
  Step 2  Platform owner manually creates one Admin account for the school.
  Step 3  Admin logs in and creates their Organization — setting the name
          and description at this point.
  Step 4  Org is active. Admin begins configuring level defaults, school years,
          and creating educator and student accounts.

  NOTE: One org per Admin account. Prevents account reuse across schools and
        ensures each school has a clean, isolated environment.

  Organization Fields:
    - Name
    - Description

--------------------------------------------------------------------------------
  4.2  Account Creation by Admin
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
    - Level Section  (Elementary / High School / Senior High / College /
                      any custom program added by Admin)
    - Grade/Year Level  (based on level section)
    - Section  (from org's existing sections for that grade/year level)
    - Strand  —  if Senior High (from org's existing strands)
    - Course  —  if College or custom program (from org's existing courses)

  On Save — Enrollment Validation:
    When Admin saves a student's profile (on creation or update), the system
    immediately runs capacity and enrollment checks. See Section 12.5 for the
    full validation flow.

  NOTE: The student form is fully dynamic. Selecting a Level Section reveals
        the correct fields. Section, Strand, and Course dropdowns show only
        what exists in the org — no hardcoded options.

  NOTE: Students are NOT automatically assigned subjects by their section.
        Section is an organizational grouping only. Subject enrollment is
        managed independently. See Section 11 for details.

--------------------------------------------------------------------------------
  4.3  Password Management
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
  4.4  Credential Distribution
--------------------------------------------------------------------------------

  Format      CSV bulk download — all accounts at once
  Columns     Full Name, Student ID / Educator ID, Email, Generated Password,
              Level Section, Section, Course/Strand, Year/Grade Level,
              Account Status
  Delivery    Admin distributes externally (print, email, hand out)

--------------------------------------------------------------------------------
  4.5  Bulk Student Import
--------------------------------------------------------------------------------

  For large schools (1,000+ students), Admin can import student accounts in
  bulk via CSV upload instead of creating accounts one by one.

  CSV Template Columns:
    Full Name, Student ID, Email, Level Section, Grade/Year Level,
    Section, Strand (if Senior High), Course (if College or custom program)

  Import Flow:
    Step 1  Admin downloads the blank CSV template from the system.
    Step 2  Admin fills in student data externally (spreadsheet editor).
    Step 3  Admin uploads the completed CSV.
    Step 4  System validates each row:
              - Required fields present (Full Name, Student ID, Email,
                Level Section, Grade/Year Level)
              - Student ID unique within org
              - Email unique within org
              - Level Section, Grade/Year Level, Section, Strand/Course
                values exist in the org's structure
    Step 5  Validation report shown before any accounts are created:
              - Valid rows: count and preview
              - Error rows: listed with reason (e.g. "Student ID 2024-001
                already exists", "Section 'Narra' not found for Grade 7")
    Step 6  Admin can:
              - Fix errors externally and re-upload
              - Proceed with valid rows only, skipping error rows
    Step 7  System creates accounts for all valid rows.
            System-generated passwords assigned. Credentials available
            for download as CSV immediately after import.
    Step 8  Section capacity checks run per imported student. Capacity
            conflicts surface as Pending students for Admin to resolve
            after import. (Subject enrollment is handled separately
            by Admin after accounts are created.)

  NOTE: Bulk import creates student accounts only. Educator accounts must
        still be created individually as educator roles require more
        deliberate assignment review.

  NOTE: Bulk import does not bypass any validation rules. Section capacity
        and duplicate checks still apply per student.


================================================================================
  5. ORGANIZATION STRUCTURE
================================================================================

--------------------------------------------------------------------------------
  5.1  Organization Overview
--------------------------------------------------------------------------------

  An Organization contains:
    - School Years           History of past, current, and future planned years.
    - Level Defaults         Base template for level structure reused each year.
    - Programs               All academic programs the school runs.
    - Educators List         All educators in the org.
    - Students List          All students enrolled in the org.

--------------------------------------------------------------------------------
  5.2  Level Defaults (Org-Wide Template)
--------------------------------------------------------------------------------

  Admin defines a default level structure for the org. This serves as the base
  template applied when a new school year is created — eliminating the need to
  rebuild the structure from scratch each year.

  If changes are needed for a new year, Admin can:
    (a) Update the level defaults so all future years inherit the change.
    (b) Manually adjust the specific school year's structure without
        touching the defaults.

  Level defaults cover all programs the school operates. See Section 5.3
  for program types and their structure.

  Default Level Structure Example:

  ELEMENTARY
    Day Care
    Kinder
    Grade 1  →  Sections: A, B
    Grade 2  →  Sections: A, B
    Grade 3  →  Sections: A, B
    Grade 4  →  Sections: A, B
    Grade 5  →  Sections: A, B
    Grade 6  →  Sections: A, B

  HIGH SCHOOL
    Grade 7   →  Sections: A, B
    Grade 8   →  Sections: A, B
    Grade 9   →  Sections: A, B
    Grade 10  →  Sections: A, B

  SENIOR HIGH SCHOOL
    Strands:
      GAS   →  Sections: A, B  (Grades 11 & 12)
      ABM   →  Sections: A, B
      STEM  →  Sections: A, B
    Grade 11
    Grade 12

  COLLEGE
    Courses:
      BSCS  →  4 years  →  Sections per year: A, B
      ICT   →  2 years  →  Sections per year: A, B
      BSTM  →  4 years  →  Sections per year: A, B

  PROGRAMS  (Admin-defined, e.g. TESDA Programs)
    TechVoc  →  3 years  →  Sections per year: A, B
    (Admin can add any number of custom programs)

  NOTE: Section names shown above are defaults only — editable by Admin.
        Naming schemes vary per school (letters, trees, numbers, custom names).
        No auto-naming is performed. See Section 5.4 for section rules.

--------------------------------------------------------------------------------
  5.3  Programs
--------------------------------------------------------------------------------

  EduTool supports multiple program types under one organization. Admin can
  configure as many programs as the school runs.

  Built-in Program Types:
    Elementary          Grade levels: Day Care, Kinder, Grade 1–6
    High School         Grade levels: Grade 7–10
    Senior High School  Grade levels: Grade 11–12 under defined Strands
    College             Year levels 1–N under defined Courses

  Custom Programs (Admin-defined):
    Admin can add custom programs such as "TESDA Programs" which may contain
    courses like TechVoc. These follow the same course/year/section structure
    as College programs but under a separately labeled program group.

  Each program independently selects its own Semester Setting per school year.
  See Section 7 for semester configuration.

  Program / Course Properties:
    Title               e.g. BSCS, TechVoc, STEM
    Description         Full name
    Max Year/Grade      How many year/grade levels exist under this program
    Semester Setting    Which semester template this course/strand follows
    Educators           Assigned educators
    Subjects            Organized by year/grade level
    Schedules           Auto-generated from classes

--------------------------------------------------------------------------------
  5.4  Sections
--------------------------------------------------------------------------------

  All level sections support named Sections at each grade/year level.
  Sections are created and managed by Admin.

  Section Properties:
    Name              e.g. Section A, Block A, Narra
    Level Section     Which level section this belongs to
    Grade/Year Level  Which specific grade or year
    Course/Strand     For Senior High and College/programs only
    Capacity          Maximum number of students allowed in this section

  Section Capacity Enforcement:
    When a student is assigned to a section (on account creation or profile
    update), the system checks the section's current headcount against its
    capacity limit.

    If capacity is reached:
      - System prompts Admin with two options:
          (A) Create a new section
          (B) Leave student with no section for now (Pending)

      - If Admin chooses (A): Admin is shown a creation form pre-filled with
        the same Level Section, Grade/Year Level, Course/Strand, and Capacity
        as the full section. Admin provides a custom name — no auto-naming.
        The new section is created and the student is assigned to it.

      - If Admin chooses (B): student is saved with no section assigned.
        Student status is set to Pending until Admin manually assigns a section.

      - Logged in the Admin Audit Log.

  NOTE: Section names are always fully custom — Admin names every section
        manually. No automatic name generation is performed because naming
        schemes vary (letters, trees, numbers, fully custom).

  NOTE: Sections are organizational groupings for students ONLY. A student's
        section does NOT automatically determine what subjects they are enrolled
        in. Subject enrollment is independent. See Section 11.

  NOTE: Classes remain independently configured by Admin. A section is NOT
        automatically a class.


================================================================================
  6. SCHOOL YEAR MANAGEMENT  (Admin)
================================================================================

  Admin manages school years within the organization. Multiple school years
  can exist simultaneously:

  Status      Meaning
  ----------  -----------------------------------------------------------------
  Pending     A future school year planned in advance. Admin can pre-configure
              structure, subjects, and classes ahead of time.
  Active      The current running school year. Only one Active year at a time.
  Ended       A completed school year. Fully archived and read-only.

  Example School Years:
    Title: School Year 2025-2026  |  Status: Ended
    Title: School Year 2026-2027  |  Status: Active
    Title: School Year 2027-2028  |  Status: Pending

  When a new school year is created, it inherits from the org's Level Defaults
  as a starting template. Admin can then modify the new year's structure
  without affecting the defaults or any past years.

  Carries Over from Previous Year       Resets / Unlocks for New Year
  ------------------------------------  ----------------------------------------
  Level sections and structure          Schedules — rebuilt fresh
  Sections (all levels)                 Subjects — unlocked until enrollment
  Courses, strands, programs            Classes — created fresh
  Semester setting selections           Grade locks — all start unlocked
  Educator accounts
  Student accounts (with statuses)

  NOTE: All past school years permanently archived and read-only. Students
        can view full grade history across all years.


================================================================================
  7. SEMESTER SETTINGS  (Admin)
================================================================================

Reusable templates. Each program (course/strand, including custom programs)
independently selects its own semester template per school year.

  Up to 3 semesters per template — each with its own start and end date
  and its own set of terms.

  Date ranges must not overlap — system enforced.

  Terms per Semester:
    Each semester can be subdivided into terms. The standard configuration
    is 4 terms per semester: Prelim, Midterm, Pre-Finals, Finals.
    Admin can customize: add fewer terms, rename them, or use a different
    structure (e.g. 3 terms: Midterm, Pre-Finals, Finals — or any other
    combination the school requires).

  Example A — June-March, 2 semesters:
    1st Sem: Jun 14 – Nov 14  |  Terms: Prelim, Midterm, Pre-Finals, Finals
    2nd Sem: Dec 12 – Feb 12  |  Terms: Prelim, Midterm, Pre-Finals, Finals

  Example B — Single Semester (custom terms):
    1st Sem: Aug 12 – May 30  |  Terms: Term 1, Term 2, Term 3

  NOTE: Semester and term configuration is per program. One school can have
        College courses running on a 2-semester system while TESDA programs
        run on a different structure — all within the same org.


================================================================================
  8. ACADEMIC CALENDAR  (Admin)
================================================================================

  Admin manages an org-wide academic calendar per school year. This is
  optional but recommended. It affects lesson scheduling, attendance, and
  meeting behavior across all classes.

--------------------------------------------------------------------------------
  8.1  Calendar Event Types
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
  8.2  System Behavior on Event Days
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
  9. SUBJECT MANAGEMENT  (Admin)
================================================================================

  Property          Details
  ----------------  ------------------------------------------------------------
  Title             e.g. Data Structure, Biology
  Year/Grade Level  e.g. 1st Year, Grade 11
  Assigned Educator Who teaches this subject
  Grading System    Which grading system applies to this subject (see Sec. 8.1)

  NOTE: Subjects do NOT contain weekday or time schedule. Scheduling (weekday
        and time) is configured at the Class level, not the Subject level.
        This is because the same subject may be taught to multiple sections at
        different times. Each class instance has its own schedule.

  Multiple Classes per Subject:
    A single subject can have multiple class instances (e.g. Section A at
    8 AM Mon/Wed and Section B at 10 AM Tue/Thu). Each class has its own
    weekday(s) and time. See Section 10 for class configuration.

  Lock/Unlock Cycle:
    Start of year       Unlocked — Admin edits freely.
    Enrollment trigger  Admin manually locks. Subjects become read-only.
    New school year     Automatically unlocks again.

  Schedule Conflict Validation (handled at Class level, not Subject level):
    Type 1  Two classes in same level cannot share time slot on same day
            for the same section.
    Type 2  Educator cannot be assigned to two classes at the same time
            across any year level.

--------------------------------------------------------------------------------
  9.1  Grading System per Subject
--------------------------------------------------------------------------------

  Different subjects within the same school may follow different grading
  systems. For example, general subjects may use a different rubric and
  weight distribution than major subjects.

  Admin assigns a grading system to each subject individually. This allows:
    - General subjects → their own rubric (e.g. Activities 30%, Exams 40%)
    - Major subjects   → their own rubric (e.g. Lab Work 25%, Exams 35%)
    - Any subject      → its own independently configured weight set

  The grading system assigned to a subject is inherited by all classes
  created for that subject, but can be adjusted at the class level by
  the Educator within the rules of the rubric system (see Section 16).


================================================================================
  10. CLASS MANAGEMENT  (Admin & Educator)
================================================================================

Admin creates class structure. Educator manages all content inside.

--------------------------------------------------------------------------------
  10.1  Admin — Class Setup Properties
--------------------------------------------------------------------------------

  Title, Level Section, Course/Strand/Program (if applicable),
  Year/Grade Level, Section (optional — target specific section),
  Semester, Term (within that semester), School Year,
  Assigned Educator, Weekday(s), Time

  Weekday(s) and Time:
    Admin selects one or more weekdays for the class (e.g. Mon only,
    Mon+Wed+Fri, Mon through Fri for daily classes). Up to 5 days/week.
    Each class instance has its own independent schedule.

  Section Targeting:
    Admin can optionally assign a class to a specific section.
    If a section is specified, enrollment filters to students in that
    section only. If no section is set, all matching students at that
    level are eligible.

  Capacity:
    Limited (hard cap set by Admin) or Unlimited.
    When capacity is reached and more eligible students exist, see
    Section 10.2 for the overflow handling flow.

--------------------------------------------------------------------------------
  10.2  Enrollment and Class Capacity Enforcement
--------------------------------------------------------------------------------

  Students are enrolled in classes by Admin — either through the
  subject assignment flow (see Section 11.3) or directly per student.
  Educators do NOT add students to classes.

  Enrollment Matching Logic:
    When Admin enrolls a student in a subject/class, the system validates:
      - Level Section matches the student's Level Section
      - Year/Grade Level matches the student's Year/Grade Level
      - Course/Strand/Program matches, if applicable
      - Section matches, if the class has a section assigned
      - Student's account status is Active

    Only Active students can be enrolled.

  Class Capacity Overflow:
    If enrollment would exceed a class's capacity limit:
      - System prompts Admin: "Class [Title] is full ([N] students). Add
        another session to split the load, or leave the student pending
        enrollment?"
      - If Admin adds a session: a new parallel class is created with the
        same subject and settings but a different or additional weekday/time.
        The overflow student(s) are enrolled in the new class.
      - If Admin declines: the student is marked as Pending Enrollment for
        that subject. Admin must resolve before the student can access it.
      - Logged in the Admin Audit Log.

  Duplicate Prevention:
    System blocks enrollment if the student is already enrolled in a class
    for the same subject in the same semester.

  Late Student Additions:
    If a student is enrolled mid-semester, the educator must manually assign
    a status (NULL, Exempted, or Custom Score) for each past assessment the
    student missed.

  Removal:
    Educator can manually remove a student from a class if needed
    (e.g. wrong section, transfer). Removal is logged in the Educator
    Activity Log.

  NOTE: Changes to a student's profile (e.g. section, strand, year level)
        do NOT automatically re-enroll the student in subjects. Subject
        enrollment is managed explicitly by Admin.

--------------------------------------------------------------------------------
  10.3  Week Computation  (by calendar week, not session count)
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
  10.4  Class Archiving
--------------------------------------------------------------------------------

  Admin manually closes and archives at end of semester. Read-only after.
  Records are soft-deleted — invisible in active UI but permanently stored
  in the database. See Section 22 for soft delete policy.

--------------------------------------------------------------------------------
  10.5  Educator Reassignment Mid-Semester
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
  11. EDUCATOR MANAGEMENT  (Admin)
================================================================================

--------------------------------------------------------------------------------
  11.1  Educator Accounts
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
  11.2  Educator Removal
--------------------------------------------------------------------------------

  Blocked if active classes exist. Admin must reassign all classes first.
  Once no active classes remain, removal goes through.


================================================================================
  12. STUDENT MANAGEMENT  (Admin)
================================================================================

--------------------------------------------------------------------------------
  12.1  Student Account Status
--------------------------------------------------------------------------------

  Status          Meaning
  -----------     --------------------------------------------------------------
  Active          Normal enrolled student. Can log in, take assessments,
                  attend meetings, view grades.
  Pending         Profile is incomplete or a capacity conflict was unresolved
                  on save. Student has no section assigned yet.
                  Admin must resolve before student can access the system.
  Dropped         Student has dropped out. Account is read-only. Subject
                  enrollments are removed. Transcript preserved. Cannot log in.
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
        without a deliberate Admin confirmation step (logged in Audit Log).
      - Suspended → Active: Admin lifts directly.
      - Pending → Active: resolved when Admin assigns a valid section.

  Effect on Enrollment:
    Only Active students can be enrolled in subjects.
    Suspended students retain existing enrollments but cannot access them.
    Dropped / Transferred students are unenrolled from all active classes.
    Graduated students are flagged read-only; classes archive normally.

--------------------------------------------------------------------------------
  12.2  Student Profile
--------------------------------------------------------------------------------

  Dynamic Profile Form:
    Elementary      Grade Level + Section         (Grade 1-6 + Section Name)
    High School     Grade Level + Section         (Grade 7-10 + Section Name)
    Senior High     Grade Level + Strand          (Grade 11-12 + Strand + Section)
    College         Year Level + Course           (1st-Nth Year + Course + Section)
    Custom Program  Year Level + Course/Program   (1st-Nth Year + Program + Section)

  Profile Changes:
    Between semesters only. Manual per student. Handles retakers, shifters,
    irregular students, conditional advancement cases.

  NOTE: Updating a student's profile (Level Section, Year/Grade Level,
        Course/Strand, Section) does NOT automatically change their subject
        enrollments. Admin manages subject enrollment independently.

  Transcript:
    Full grade history across all semesters and school years. Read-only.
    Organized by school year → semester → term → subject.

--------------------------------------------------------------------------------
  12.3  Student Account Search
--------------------------------------------------------------------------------

  Admin can search students by:
    - Student ID  (exact or partial match)
    - Full Name
    - Status  (Active / Pending / Dropped / Transferred / Suspended / Graduated)
    - Level Section / Year Level / Section / Course / Strand / Program  (filters)

  From a student's account view, Admin can:
    - View full profile, Student ID, and current status
    - See all current class enrollments (subject, educator, semester, term)
    - Add a subject enrollment  (see Section 12.4)
    - Remove a subject enrollment  (see Section 12.5)
    - Change account status
    - Edit profile (between semesters)
    - Reset password

--------------------------------------------------------------------------------
  12.4  Adding a Subject Enrollment to a Student  (Admin only)
--------------------------------------------------------------------------------

  Educators cannot enroll students in subjects. Only Admin can.

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

  NOTE: Admin takes full responsibility for all subject enrollment decisions.

--------------------------------------------------------------------------------
  12.5  Removing a Subject Enrollment from a Student  (Admin only)
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
  12.6  Enrollment Validation on Save
--------------------------------------------------------------------------------

  Every time Admin saves a student profile (creation or update), the system
  runs the following check:

  Check — Section Capacity:
    Does the assigned section have space?
      YES → proceed.
      NO  → prompt Admin: create new section or leave student with no section
            (Pending status). See Section 5.4 for section capacity flow.

  Subject enrollment is NOT triggered automatically from profile save.
  Admin manages subject enrollment separately (see Section 12.4).

  All outcomes (section assignments, pending flags) are logged in the
  Admin Audit Log.


================================================================================
  13. LESSON MANAGEMENT  (Educator)
================================================================================

  Properties:
    Title, Description (optional), Week Assignment, Lesson Detail (min 10 words)

--------------------------------------------------------------------------------
  13.1  Concept Extraction
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
  13.2  Lesson Viewer & Presentation Mode
--------------------------------------------------------------------------------

  Calendar layout by week. Educator can present lesson content directly inside
  the meeting room — all participants follow the forward/backward navigation
  in real time.


================================================================================
  14. ASSESSMENT MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  14.1  Question Types
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
  14.2  Assessment Dates
--------------------------------------------------------------------------------

  Release Date    Before this, students see title only — questions hidden.
  End Date        Submission deadline. Assessment auto-closes.

--------------------------------------------------------------------------------
  14.3  Template Configuration & Generation Flow
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
  14.4  Editing Generated Questions
--------------------------------------------------------------------------------

  - Educator can edit any AI-generated question before the release date.
  - Editable: question text, answer choices (MC), correct answer.
  - Essay question text is editable just like other types.
  - Once the release date passes, questions lock — no further edits.

--------------------------------------------------------------------------------
  14.5  Student Assignment & Status
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
  14.6  Assessment Attempt Control
--------------------------------------------------------------------------------

  Each student may have only one active attempt per assessment at any time.

  When a student opens an assessment:
    - An attempt record is created with status = Active.
    - All auto-save progress is stored under this attempt.

  If the same student opens the assessment from another tab or device:
    - System detects the existing Active attempt.
    - The existing attempt is resumed — no new attempt created.
    - Previous progress is restored exactly where left off.

  This prevents multiple simultaneous tab attempts, multiple device attempts,
  and accidental duplicate submissions.

  On submission: attempt status is set to Submitted. No further access.
  On end date:   all Draft attempts are closed automatically.

--------------------------------------------------------------------------------
  14.7  Score Publishing
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
  14.8  Assessment Deletion
--------------------------------------------------------------------------------

  WARNING: Deleting an assessment after students have submitted wipes all
  scores. Final grade recomputes without it.
  Assessment is soft-deleted — removed from active UI but preserved in DB.


================================================================================
  15. ATTENDANCE MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  15.1  Overview
--------------------------------------------------------------------------------

  Attendance is tracked per class session, not per calendar day.
  Sessions correspond to the class's scheduled weekday(s) within each week.
  Sessions that fall on Academic Calendar event days (Holiday / No Class Day)
  are automatically skipped — no record is created.

  The attendance view is organized by week (Week 1, Week 2, etc.) — not a
  full calendar. A class that meets once a week shows one session per week;
  a class meeting three times a week shows three sessions per week.

--------------------------------------------------------------------------------
  15.2  Auto-Attendance from Assessments
--------------------------------------------------------------------------------

  If an assessment is assigned to a student on a given session day:
    - Submitted    → Student is automatically marked Present for that session.
    - Not submitted (NULL, Draft, Exempted, Custom) → No automatic mark.
      Educator resolves manually.

--------------------------------------------------------------------------------
  15.3  Manual Attendance Entry
--------------------------------------------------------------------------------

  Educator can manually set or override attendance for any session:

  Status          Meaning
  -----------     --------------------------------------------------------------
  Present         Student attended.
  Absent          Student did not attend.
  Late            Student attended but arrived late.
  Excused         Absence is formally excused.

--------------------------------------------------------------------------------
  15.4  Attendance View — Weekly Layout
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
  15.5  Attendance in Grade Computation
--------------------------------------------------------------------------------

  If the rubric includes an Attendance category (manual entry type), the
  educator inputs the attendance summary score per student manually.
  The raw session-by-session records are for reference and tracking only.

  NOTE: Auto-calculation from session records may be added in a future version.


================================================================================
  16. GRADE MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  16.1  Grading by Terms
--------------------------------------------------------------------------------

  Grading is tracked per term within each semester. Each term (e.g. Prelim,
  Midterm, Pre-Finals, Finals) has its own set of assessments and produces
  its own term grade.

  At the end of the semester, the student's overall subject grade is computed
  from all term grades:

  Example (4 terms, equal weight):
    Prelim = 89  |  Midterm = 90  |  Pre-Finals = 88  |  Finals = 80
    Overall Subject Grade = average (or weighted, per rubric config) = 86.75

  The grade view is organized by term. Educators navigate between terms
  to view and manage assessments and scores.

--------------------------------------------------------------------------------
  16.2  Rubric System
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

  NOTE: Grading system (rubric weights and categories) can vary per subject.
        General subjects may have different weights than major subjects.
        See Section 9.1 for subject-level grading system assignment.

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
  16.3  Student Grade Visibility
--------------------------------------------------------------------------------

  Assessment scores       Visible only after educator publishes them.
  Final computed grade    Hidden until class grades are locked.
  On grade lock           ALL scores auto-published + final grade revealed.
  Essay pending           Score shows as incomplete until essay is graded.

--------------------------------------------------------------------------------
  16.4  Grade Display Modes  (Educator View)
--------------------------------------------------------------------------------

  Educators can switch between two views:

  Default View:
    Shows each student's scores per individual assessment item, grouped
    by assessment type. Scores display as earned/total (e.g. 19/20).
    Organized by term (Prelim, Midterm, etc.).

    Example (Prelim term):
      Name     Act 1   Act 2   Quiz 1  Quiz 2   Exam   Behavior  Attend  Recit  Grade
      Stud 1   19/20   21/30   11/20   19/20   45/50   80/100    5/14   90/100   94

  Clean View:
    Groups assessments by category. If a category has more than one
    assessment, scores are aggregated (sum of earned / sum of total).
    Organized by term.

    Example (Prelim term):
      Name     Activities  Quizzes  Exam   Behavior  Attend  Recit  Grade
      Stud 1   40/50       30/40   45/50   80/100    5/14   90/100   94

  Both views are organized by term. Educator can switch between them freely.

--------------------------------------------------------------------------------
  16.5  Grade Locking
--------------------------------------------------------------------------------

  Admin enables lock window    Admin sets a deadline (e.g. 24 hours).
  Educator locks manually      Permanent — no unlocking without platform override.
  On lock                      All unpublished scores published. Final grade
                               revealed to students.
  Auto-lock on deadline        System auto-locks if educator missed deadline.
  After lock                   Grades frozen. Read-only for everyone.
  Grade lock override          Admin can unlock grades directly in extreme cases
                               without any external approval — Admin has full authority.

  WARNING: If Essay items are ungraded when locking, system warns but allows.
  Educator takes full responsibility.


================================================================================
  17. GRADING SCALE CONFIGURATION  (Admin)
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
  18. GRADE EXPORT & CLASS CARDS
================================================================================

  PDF — Per Student Class Card:
    Student info, class info, grade breakdown per rubric category per term,
    term grades (Prelim, Midterm, etc.), final overall subject grade and
    remark, educator name, org name, school year, semester.

  CSV — Full Class Export:
    All students, all category scores per term, term grades, final grade,
    remark, passing status.

  Both Admin and Educators can trigger exports for their respective scope.
  Class card reflects educator active at grade finalization.


================================================================================
  19. MEETING MANAGEMENT  (Educator)
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
  20. NOTIFICATION SYSTEM
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
  Enrolled in subject/class             Student           On enrollment
  Student added to class by Admin       Educator          Admin adds student
  Student removed from class by Admin   Educator          Admin removes student
  Enrollment pending (capacity full)    Admin             On capacity block

  Retention Policy:
    Notifications older than 90 days are archived automatically.
    Archived notifications are removed from the active list but retained
    in internal logs. They are not visible to users after archiving.


================================================================================
  21. ADMIN DASHBOARD & ANALYTICS
================================================================================

  Admin sees aggregate analytics only — no access to live class internals
  (active assessments, current grades, unpublished scores).

  - Total enrollment per level section, course, strand, program, year/grade
    level, and section. Broken down by account status.
  - Pending students count (no section assigned).
  - Active class count per semester.
  - Grade distribution summaries (after locking), organized by term.
  - Educator count and class load overview.
  - Pending actions — classes near auto-lock with unlocked grades.


================================================================================
  22. SOFT DELETE POLICY
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
    - Raw soft-deleted data is retained in the database for dispute resolution
      or recovery by the Admin with platform-level DB access if needed.

  Hard deletes are never performed on any of the above record types.


================================================================================
  23. AUDIT LOGS
================================================================================

  EduTool maintains two tiers of activity logs — Admin-level and
  Educator-level — stored permanently and never deleted.

--------------------------------------------------------------------------------
  23.1  Admin Audit Log
--------------------------------------------------------------------------------

  Records high-impact administrative actions across the org.

  Logged Actions:
    - Student profile changes (field, old value, new value)
    - Account status changes (Active / Dropped / Suspended / etc.)
    - Subject enrollment changes (add / remove)
    - Educator class assignment changes (add / remove / reassign)
    - Section capacity overflow decisions (new section created / student pending)
    - Class capacity overflow decisions (new session added / student pending)
    - Password resets (who was reset, by whom)
    - Grade lock override actions (Admin-initiated)
    - Academic calendar event creation and modification

  Log Fields:
    Timestamp     |  Actor (Admin)  |  Action Type  |  Target Entity  |  Details

  Admin can filter and search the audit log by date, action type, or
  target entity (Student ID, Educator ID, class, etc.).

--------------------------------------------------------------------------------
  23.2  Educator Activity Log
--------------------------------------------------------------------------------

  Records class-level events scoped to each educator's classes.
  Educators see only their own class logs.

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

  Educator Activity Logs are also visible to Admin for oversight.


================================================================================
  24. SYSTEM SUMMARY
================================================================================

  Role            Manages                                   Cannot Do
  ----------      ----------------------------------------  --------------------
  Platform Owner  Admin account management only:          Access any org's
                  create, view, copy, reset password,       internal data.
                  block/unblock Admin accounts.             Cannot see students,
                  Credential distribution to schools.       grades, classes, or
                                                            any org structure.

  Admin           One org, school years, level defaults,    Manage lesson content,
                  programs (including custom programs),     generate assessments,
                  sections + capacity (all levels),         enter grades, view
                  courses/strands, subjects (incl.          live class internals,
                  grading system per subject), class        or override locks
                  structure + capacity + schedule,          without platform
                  academic calendar, all accounts           owner involvement.
                  (student + educator), student statuses,
                  subject enrollments (manual, per
                  student), educator class assignments,
                  semester settings (per program, with
                  customizable terms), password resets,
                  grading scales, rubric default, lock
                  windows, exports, analytics, audit log.

  Educators       Lessons, concept extraction, assessments  Create/modify class
                  (config + generation + editing +          structure. Add/remove
                  assignment + essay grading + score        student enrollments.
                  publishing), attendance management,       View other educators'
                  grades (by term), rubric library,         classes. Change
                  meetings, exports, activity log           student profiles or
                  (own classes only).                       statuses.

  Students        Take assessments (one active attempt),    Modify any academic
                  attend meetings, view published scores,   data. View other
                  view locked final grades + all scores     students' data.
                  on lock, full transcript (all years,
                  semesters, terms).


================================================================================
  EduTool  •  System Planning Document  v8.3
================================================================================