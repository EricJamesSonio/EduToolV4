EDUTOOL — ADMIN DOMAIN
=======================

SCOPE
-----
Admin manages one Organization. Everything inside that org — its structure,
accounts, academic data, and configuration — is the Admin's responsibility.
Admins cannot see or interact with other orgs. One Admin account = one org.

DATA ISOLATION RULES
--------------------
- All data is scoped to the Admin's org_id. Cross-org access is impossible.
- Student IDs and Educator IDs are unique within the org, not globally.
- Section names, class titles, subject names are local to the org.
- Grading scales, rubric templates, and semester settings are org-private.

ORGANIZATION SETUP
------------------
When an Admin creates their org, they set:
- Organization name
- Organization description

Optional automated default setup is available at creation time. Admin can
opt in to seed the org with pre-defined:
- Programs
- Levels
- Sections
- Subjects (with prerequisite chains)
- Grading Scales

Admin can deselect any individual defaults before applying. All seeded data
is tied to the org via org_id. Once seeded, is_initialized = true, preventing
duplicate seeding. Default templates are stored in code/JSON, not the database.

PROGRAMS
--------
Built-in types: Elementary, High School, Senior High School, College, Custom.
Admin can configure as many programs as the school runs.
- Elementary: Day Care, Kinder, Grade 1–6
- High School: Grade 7–10
- Senior High: Grade 11–12 under defined Strands
- College: Year levels 1–N under defined Courses
- Custom: Admin-defined (e.g. TESDA programs with their own courses)

SECTIONS
--------
Sections are organizational groupings for students ONLY.
A student's section does NOT automatically assign subjects.
Section properties: Name, Level Section, Grade/Year Level,
Course/Strand (if applicable), Capacity.

SCHOOL YEARS
------------
Statuses: Pending (future, pre-configurable), Active (current, only one at a time),
Ended (archived, read-only).
A new school year inherits from the org's Level Defaults as a starting template.
Admin can modify the new year's structure without affecting past years.

SEMESTER SETTINGS
-----------------
Reusable templates. Each program independently selects its own semester
template per school year.
- Up to 3 semesters per template
- Each semester has its own date range (no overlaps, system enforced)
- Each semester subdivides into terms (e.g. Prelim, Midterm, Pre-Finals, Finals)
- Admin can rename, add fewer terms, or use custom term structures

ACADEMIC CALENDAR
-----------------
Admin manages an org-wide calendar per school year. Optional but recommended.
Event types:
- Holiday: sessions on this date are skipped, attendance not created, lesson
  scheduling shifts automatically
- No Class Day: same behavior as Holiday
- Exam Week: advisory only, no scheduling changes
- Special Event: informational only

SUBJECT MANAGEMENT
------------------
Properties: Title, Year/Grade Level, Assigned Educator, Grading System,
Prerequisite(s).

Lock/Unlock Cycle:
- Start of year: unlocked, Admin edits freely
- Enrollment trigger: Admin manually locks, subjects become read-only
- New school year: automatically unlocks

Subjects do NOT have a schedule. Scheduling is at the Class level.
A subject can be taught to multiple sections at different times.
Each subject has its own grading system assignment. This is inherited by
all classes created for that subject but can be adjusted by the Educator
at the class level (within rubric rules).

Subject Prerequisites:
- Set at creation or during default seeding
- Can be None, one, or multiple subjects
- Prerequisite enforcement (blocking enrollment) happens at the enrollment
  validation layer

CLASS MANAGEMENT (Admin's role)
--------------------------------
Admin creates the class structure. Educator manages all content inside.

Class setup properties:
Title, Level Section, Course/Strand/Program (if applicable), Year/Grade Level,
Section (optional), Semester, Term, School Year, Assigned Educator,
Weekday(s), Time.

Week computation:
- Single weekday: Week 1, Week 2, Week 3...
- Two weekdays: Week 1.1, Week 1.2, Week 2.1, Week 2.2...
- Three weekdays: Week 1.1, Week 1.2, Week 1.3, Week 2.1...
- Five weekdays (daily): Week 1.1 through Week 1.5, Week 2.1...

Class archiving: Admin manually closes and archives at end of semester.
Read-only after archiving. Records are soft-deleted — invisible in active UI
but permanently stored in the database.

Educator reassignment mid-semester: New educator inherits all lessons,
assessments, grading responsibilities, unpublished scores, and attendance.
Historical attribution is never modified. Ownership history log maintained.

EDUCATOR ACCOUNT MANAGEMENT
----------------------------
Each educator gets a system-generated Educator ID.
Admin can: view profile, see all assigned classes, add/remove class assignments,
reset password.

Educator removal is blocked if active classes exist. Admin must reassign all
classes first. Once no active classes remain, removal proceeds.

Educator account fields: Full Name, Email (school Gmail).

STUDENT ACCOUNT MANAGEMENT
----------------------------
Student account fields:
Full Name, Email, Student ID (Admin-assigned, unique within org),
Level Section, Grade/Year Level, Section, Strand (if Senior High),
Course (if College or custom program).

Account statuses:
- Active: normal student, full access
- Pending: profile incomplete or capacity conflict unresolved, no section yet
- Dropped: read-only, enrollments removed, transcript preserved
- Transferred: same as Dropped
- Suspended: cannot log in, account and enrollments intact
- Graduated: system-set at max year level, read-only, full transcript accessible

Profile changes: between semesters only.
Updating a profile does NOT automatically change subject enrollments.

Student search filters: Student ID, Full Name, Status, Level Section,
Year Level, Section, Course, Strand, Program.

SUBJECT ENROLLMENT (Admin only)
--------------------------------
Only Admin can enroll students in subjects. Educators cannot.
Validation checks: duplicate enrollment, capacity limits, Active student status.
Educator receives a notification when a new student is added to their class.

Removing an enrollment: existing submissions and scores are archived, not wiped.
Removal is soft-deleted. Educator receives a notification.

Enrollment validation on save: every time Admin saves a student profile, a
section capacity check runs. Subject enrollment is NOT triggered automatically.

BULK STUDENT IMPORT
--------------------
For large schools. Admin uploads a CSV instead of creating accounts one by one.

CSV columns: Full Name, Student ID, Email, Level Section, Grade/Year Level,
Section, Strand (Senior High), Course (College or custom).

Import flow:
1. Admin downloads blank CSV template from the system
2. Admin fills in data externally
3. Admin uploads completed CSV
4. System validates each row: required fields, unique IDs/emails, valid
   Level/Grade/Section/Strand/Course values within the org
5. Validation report shown before any accounts are created
6. Admin can re-upload fixes or proceed with valid rows only
7. Accounts created with system-generated passwords
8. Section capacity checks run per row — conflicts surface as Pending students

CREDENTIAL MANAGEMENT
----------------------
Passwords: system-generated, 10 characters. Students and educators cannot
change their own passwords. Only Admin can reset.

Reset scope options: all educator accounts, all student accounts, both,
or selected specific accounts.

Credential distribution: CSV bulk download.
Columns: Full Name, Student/Educator ID, Email, Generated Password,
Level Section, Section, Course/Strand, Year/Grade Level, Account Status.

PASSWORD VISIBILITY
-------------------
Admin cannot view passwords in plain text. Password reset generates a new one.

GRADING SCALE CONFIGURATION
-----------------------------
Per level section. Each section can use a completely different scale.
Properties: Score Range (percentage), Grade Value (e.g. 1.00, A, Outstanding),
Remark (Passed, Failed, Incomplete), Passing Threshold.
Validation: ranges must cover 0–100 fully, no gaps or overlaps.

Lock cycle: editable at start of each school year. Locks once the first grade
in that level section is locked for the year. Unlocks automatically at the
start of the next school year.

RUBRIC DEFAULT
--------------
Admin configures a default rubric for the org. This is pre-filled at class
creation. Educators can adjust or replace it from their personal library.
Rubric locks permanently once the first student is enrolled.
All weights must total exactly 100%.

GRADE LOCK MANAGEMENT
----------------------
Admin sets a deadline (lock window). If an educator misses the deadline, the
system auto-locks. Admin can unlock grades directly in extreme cases without
any external approval.

Grade lock override is logged in the Admin Audit Log.

EXPORTS
-------
PDF — Per Student Class Card: student info, class info, grade breakdown per
rubric category per term, term grades, final overall subject grade and remark,
educator name, org name, school year, semester.

CSV — Full Class Export: all students, all category scores per term, term
grades, final grade, remark, passing status.

Both Admin and Educators can trigger exports within their scope.

ADMIN DASHBOARD & ANALYTICS
-----------------------------
Admin sees aggregate analytics only — no live class internals, no active
assessment data, no unpublished scores.

Available analytics:
- Total enrollment per level section, course, strand, program, year/grade
  level, and section — broken down by account status
- Pending students count (no section assigned)
- Active class count per semester
- Grade distribution summaries (after locking), organized by term
- Educator count and class load overview
- Pending actions — classes near auto-lock with unlocked grades

ADMIN AUDIT LOG
---------------
Records high-impact administrative actions. Stored permanently, never deleted.

Logged actions:
- Student profile changes (field, old value, new value)
- Account status changes
- Subject enrollment changes (add / remove)
- Educator class assignment changes (add / remove / reassign)
- Section capacity overflow decisions
- Class capacity overflow decisions
- Password resets
- Grade lock override actions
- Academic calendar event creation and modification

NOTIFICATION TRIGGERS (Admin as recipient)
------------------------------------------
- Enrollment pending (capacity full): Admin is notified when a capacity block
  occurs during enrollment

WHAT ADMIN CANNOT DO
---------------------
- Manage lesson content
- Generate assessments
- Enter grades directly
- View live class internals (active assessments, current grades, unpublished scores)
- Override grade locks without going through the grade lock override process
- See any data from another org