EDUTOOL
SYSTEM PLANNING DOCUMENT  v8.4
Multi-tenant academic management system for schools

1. SYSTEM OVERVIEW
EduTool is a multi-tenant platform for schools. The top-level container is an Organization. All data lives within an org and is never visible outside it. No public registration exists — the platform owner provisions Admin accounts, and Admins create all other accounts.

Role	Managed By	Core Scope
Platform Owner	EduTool team	Creates and manages Admin accounts only. No access to any org's internal data.
Admin	Platform owner	Creates and manages one org. Manages the full academic structure within that org. Creates and manages all educator and student accounts, including subject assignments. One org per Admin account.
Educators	Admin	Manage lessons, assessments, grades, attendance, and meetings — only within assigned classes.
Students	Admin	Take assessments, attend meetings, view published scores, view locked final grades, access full transcript history.

 
2. DATA ISOLATION — MULTI-TENANT BOUNDARY
Every Admin account owns exactly one Organization. All data created inside that org — students, educators, classes, subjects, sections, rubrics, semester settings, grading scales, school years, calendar events, assessments, grades, transcripts, and audit logs — is strictly scoped to that org and is never visible, accessible, or shared with any other org or Admin.
This is an absolute system-level boundary. It is not a permission setting — it cannot be toggled or overridden by any Admin. The Platform Owner has no access to org-internal data either — their scope is Admin account management only (see Section 3).

2.1  What Is Isolated Per Org
The following are fully isolated per org. An Admin in Org A will never see, search, or accidentally access anything belonging to Org B:

Accounts:
•	Student accounts (profiles, statuses, IDs, sections, enrollments)
•	Educator accounts (profiles, IDs, class assignments)

Academic Structure:
•	School years and their configuration
•	Level defaults and level structure
•	Programs, courses, strands (including custom programs)
•	Sections and their capacities
•	Subjects and subject-level grading system assignments
•	Classes (schedule, enrollment, capacity)
•	Semester settings and term configurations

Grading and Assessment:
•	Rubric templates (Admin default rubric and educator rubric libraries)
•	Grading scales per level section
•	All assessment content, scores, and grades
•	Student transcripts and grade history

Configuration and Logs:
•	Academic calendar events
•	Notification history
•	Admin Audit Log
•	Educator Activity Logs

2.2  Enforcement Rules
•	All database queries are scoped to the authenticated Admin's org_id. No cross-org query is possible through any UI action.
•	An Admin performing any search will only ever see records belonging to their own org. There are no global search results for Admin-level queries.
•	Educator rubric libraries are private to each educator within their org and are invisible to educators in other orgs.
•	Semester setting templates created by one Admin exist only within that Admin's org.
•	Grading scales configured by Admin are scoped to their org's level sections only.
•	Student IDs and Educator IDs are unique within an org, not globally.
•	Section names, class titles, and subject names are local to the org.

2.3  Platform Owner Scope Boundary
The Platform Owner only knows that an Admin account exists — because they created it. They cannot see the org's name, structure, students, grades, or any internal data. Their scope ends entirely at the Admin account. See Section 3 for full Platform Owner capabilities.

 
3. PLATFORM OWNER
The Platform Owner is the EduTool team. Their sole responsibility is managing Admin accounts. They have no visibility into any organization's internal data — no students, no grades, no classes, no structure of any kind.

3.1  Platform Owner Capabilities
Admin Account Management (the full and only scope):
•	Create new Admin accounts (one per school).
•	View all existing Admin accounts and their credentials.
•	View a specific Admin's password in plain text — for distributing login credentials to the school client.
•	Copy Admin account credentials for distribution.
•	Reset an Admin's password.
•	Block an Admin account (disables login; the org is unaffected).
•	Unblock a blocked Admin account.

NOTE: Platform Owner cannot see, enter, or manage any organization's internal data — no students, no educators, no classes, no grades, no structure, no logs. The org belongs entirely to the Admin.

 
4. PLATFORM & ACCOUNT PROVISIONING

4.1  School Onboarding Flow
1.	School negotiates with the platform owner (us).
2.	Platform owner manually creates one Admin account for the school.
3.	Admin logs in and creates their Organization — setting the name and description at this point.
4.	Org is active. Admin begins configuring level defaults, school years, and creating educator and student accounts.

NOTE: One org per Admin account. Prevents account reuse across schools and ensures each school has a clean, isolated environment.

Organization Fields:
•	Name
•	Description

4.2  Account Creation by Admin
Admin creates all accounts. No self-registration. Credentials system-generated (10 characters).

Educator Account Fields:
•	Full Name
•	Email (school-provided Gmail)
•	System auto-generates an Educator ID on creation

Student Account Fields:
•	Full Name
•	Email (school-provided Gmail)
•	Student ID (Admin-assigned, unique within org)
•	Level Section (Elementary / High School / Senior High / College / any custom program added by Admin)
•	Grade/Year Level (based on level section)
•	Section (from org's existing sections for that grade/year level)
•	Strand — if Senior High
•	Course — if College or custom program

NOTE: The student form is fully dynamic. Selecting a Level Section reveals the correct fields. Students are NOT automatically assigned subjects by their section. Section is an organizational grouping only.

4.3  Password Management
Property	Details
Reset scope	All educator accounts | All student accounts | Both | Selected specific accounts
Effect	New password generated. Previous password stops working immediately.
User control	Educators and students cannot change their own passwords. Only Admin can reset them.

4.4  Credential Distribution
Property	Details
Format	CSV bulk download — all accounts at once
Columns	Full Name, Student ID / Educator ID, Email, Generated Password, Level Section, Section, Course/Strand, Year/Grade Level, Account Status
Delivery	Admin distributes externally (print, email, hand out)

4.5  Bulk Student Import
For large schools (1,000+ students), Admin can import student accounts in bulk via CSV upload instead of creating accounts one by one.

CSV Template Columns:
Full Name, Student ID, Email, Level Section, Grade/Year Level, Section, Strand (if Senior High), Course (if College or custom program)

Import Flow:
5.	Admin downloads the blank CSV template from the system.
6.	Admin fills in student data externally (spreadsheet editor).
7.	Admin uploads the completed CSV.
8.	System validates each row: required fields present, Student ID unique within org, Email unique within org, Level Section / Grade/Year Level / Section / Strand/Course values exist in the org's structure.
9.	Validation report shown before any accounts are created.
10.	Admin can fix errors externally and re-upload, or proceed with valid rows only.
11.	System creates accounts for all valid rows with system-generated passwords.
12.	Section capacity checks run per imported student. Capacity conflicts surface as Pending students for Admin to resolve after import.

 
5. ORGANIZATION STRUCTURE

5.1  Organization Overview
An Organization contains School Years, Level Defaults, Programs, Educators List, and Students List.

5.2  Level Defaults (Org-Wide Template)
Admin defines a default level structure for the org. This serves as the base template applied when a new school year is created — eliminating the need to rebuild the structure from scratch each year.

5.3  Programs
EduTool supports multiple program types under one organization. Admin can configure as many programs as the school runs.

Built-in Program Types:
•	Elementary — Grade levels: Day Care, Kinder, Grade 1–6
•	High School — Grade levels: Grade 7–10
•	Senior High School — Grade levels: Grade 11–12 under defined Strands
•	College — Year levels 1–N under defined Courses
•	Custom Programs (Admin-defined) — e.g. TESDA Programs with courses like TechVoc

5.4  Sections
All level sections support named Sections at each grade/year level. Sections are created and managed by Admin.

Section Properties:
•	Name — e.g. Section A, Block A, Narra
•	Level Section — which level section this belongs to
•	Grade/Year Level — which specific grade or year
•	Course/Strand — for Senior High and College/programs only
•	Capacity — maximum number of students allowed in this section

NOTE: Sections are organizational groupings for students ONLY. A student's section does NOT automatically determine what subjects they are enrolled in. Subject enrollment is independent. See Section 11.

 
5A. AUTOMATED DEFAULT SETUP PLAN FOR NEW ORGANIZATIONS
When an Admin creates a new Organization, the system supports an automated default setup flow that seeds the org with a pre-defined academic structure. This eliminates manual setup effort while giving Admins full control over which defaults are applied.

5A.1  Frontend — Organization Creation Form
The organization creation form collects basic org info and includes a dedicated section for default setup configuration.

Basic Organization Info Fields:
•	Organization name
•	Description
•	Admin account credentials

Default Setup Section:
•	Admin can choose whether to initialize the org with defaults (opt-in).
•	Admin sees a grouped list of default options by type:
◦	Programs
◦	Levels
◦	Sections
◦	Subjects (with prerequisite chains — see Section 5A.4)
◦	Grading Scales
•	Admin can deselect any individual defaults they do not want applied.
•	Optional: Admin can preview all selected defaults before final submission.

5A.2  Backend — Organization Initialization
The backend handles org creation and default seeding as a two-step process:

13.	Backend receives the organization creation request and creates the org record.
14.	Backend waits for the default selection submission from the Admin.
15.	Once defaults are submitted, backend seeds the organization's data for each selected category: Programs, Levels, Sections, Subjects (with prerequisites), and Grading Scales.
16.	Each seeded item is tied to the organization via org_id to ensure full data isolation.
17.	Org is flagged as initialized (is_initialized = true) to prevent duplicate seeding.

NOTE: Default templates are stored outside the database (in code or JSON files) for maintainability. This means updating default templates does not require database migrations — only code or config updates.

5A.3  Database Structure Principle
Principle	Detail
Org scoping	All seeded records include the org_id as a foreign key. No seeded record is globally shared.
Template storage	Default templates stored in code or JSON — not in the database. Easier to version and update.
Initialization flag	Organization record includes is_initialized flag. Backend checks this before seeding to prevent duplicate runs.
Data isolation	Seeded data follows the same multi-tenant isolation rules as all other org data. See Section 2.

5A.4  Subject Prerequisites in Default Templates
Subjects in the default templates support prerequisite chains. When subjects are seeded into a new org, their prerequisite relationships are seeded along with them. Each subject record includes:

•	Subject title
•	Year/Grade Level assignment
•	Semester term assignment (e.g. 1st Year, 1st Semester)
•	Prerequisite subject(s) — None, or one or more subject titles that must be completed before enrollment

Example — BS Tourism Management (BSTM) default subject template with prerequisites:

Major Subjects (Core Tourism):

#	Subject Title	Year/Term	Prerequisite(s)	Notes
1	Principles of Tourism	1st Year, 1st Sem	None	
2	Tourism Planning and Development	2nd Year, 1st Sem	Principles of Tourism	
3	Travel Agency Operations	2nd Year, 2nd Sem	Principles of Tourism	
4	Tour Guiding and Tour Operations	2nd Year, 2nd Sem	Principles of Tourism	
5	Tourism Marketing and Promotion	3rd Year, 1st Sem	Tourism Planning and Development	
6	Hospitality and Tourism Law	2nd Year, 2nd Sem	Principles of Tourism	
7	Sustainable Tourism	3rd Year, 2nd Sem	Tourism Planning and Development	
8	Event and Convention Management	3rd Year, 1st Sem	Tourism Marketing and Promotion	
9	Tourism Research and Statistics	2nd Year, 2nd Sem	None	
10	Cultural and Heritage Tourism	3rd Year, 2nd Sem	Tourism Planning and Development	
11	Tourism Policy and Governance	3rd Year, 2nd Sem	Principles of Tourism; Sustainable Tourism	
12	Airline and Cruise Management	4th Year, 1st Sem	Travel Agency Operations	
13	Tourism Entrepreneurship	4th Year, 1st Sem	Tourism Marketing and Promotion	
14	Internship / OJT	4th Year, 2nd Sem	Completion of all core tourism subjects	

Minor / General Education Subjects:

1	Mathematics in the Modern World	1st Year, 1st Sem	None	
2	Purposive Communication	1st Year, 1st Sem	None	
3	Understanding the Self	1st Year, 1st Sem	None	
4	Readings in Philippine History	1st Year, 2nd Sem	None	
5	The Contemporary World	1st Year, 2nd Sem	None	
6	Ethics	2nd Year, 1st Sem	Understanding the Self	
7	Art Appreciation	2nd Year, 2nd Sem	None	
8	Science, Technology, and Society	2nd Year, 2nd Sem	None	
9	Life and Works of Jose Rizal	1st Year, 2nd Sem	None	
10	Physical Education (PE 1 and 2)	1st Year, Both Sems	None	
11	NSTP 1 and 2	2nd Year, Both Sems	None	

NOTE: The prerequisite data is stored as part of the subject seed record. When prerequisites are seeded, the system links subjects by title within the same org. Prerequisite enforcement (blocking enrollment if prerequisites are unmet) is handled at the enrollment validation layer — see Section 12.4.

5A.5  Optional Enhancements
•	Different default templates for different curriculum types (College, K-12, TESDA, etc.).
•	Preview tree view of all defaults — including prerequisite chains — for Admin review before applying.
•	Ability to reset and re-seed defaults, only if the organization is empty or Admin provides explicit confirmation (logged in Admin Audit Log).

5A.6  Process Flow
18.	Admin creates organization and enters basic info.
19.	Admin selects which default categories to apply (Programs, Levels, Sections, Subjects, Grading Scales). Admin may deselect any unwanted defaults.
20.	Admin optionally previews the full default structure — including subject prerequisite chains — before submitting.
21.	Admin confirms submission. Backend seeds the organization with all selected defaults, each tied to the org_id.
22.	Organization is marked as initialized (is_initialized = true).
23.	Organization is ready to use with its own isolated academic structure.

This plan ensures:
•	Admin has full control over which defaults are applied — no forced seeding.
•	All seeded data is isolated per organization — no cross-org leakage.
•	Subject prerequisite relationships are seeded alongside subjects — no manual re-linking needed.
•	Default data setup is automated but flexible and reversible.

 
6. SCHOOL YEAR MANAGEMENT  (Admin)
Admin manages school years within the organization. Multiple school years can exist simultaneously.

Status	Meaning
Pending	A future school year planned in advance. Admin can pre-configure structure, subjects, and classes ahead of time.
Active	The current running school year. Only one Active year at a time.
Ended	A completed school year. Fully archived and read-only.

When a new school year is created, it inherits from the org's Level Defaults as a starting template. Admin can then modify the new year's structure without affecting the defaults or any past years.

7. SEMESTER SETTINGS  (Admin)
Reusable templates. Each program (course/strand, including custom programs) independently selects its own semester template per school year.

•	Up to 3 semesters per template — each with its own start and end date and its own set of terms.
•	Date ranges must not overlap — system enforced.
•	Each semester can be subdivided into terms. Standard configuration: Prelim, Midterm, Pre-Finals, Finals.
•	Admin can customize: add fewer terms, rename them, or use a different structure.

8. ACADEMIC CALENDAR  (Admin)
Admin manages an org-wide academic calendar per school year. This is optional but recommended. It affects lesson scheduling, attendance, and meeting behavior across all classes.

8.1  Calendar Event Types
Event Type	Effect on Classes
Holiday	Class sessions scheduled on this date are skipped. Attendance record is not created. Lesson scheduling shifts automatically.
No Class Day	Same behavior as Holiday — sessions skipped.
Exam Week	Advisory only. No automatic session changes.
Special Event	Informational only. No scheduling effect.

 
9. SUBJECT MANAGEMENT  (Admin)
Property	Details
Title	e.g. Data Structure, Biology
Year/Grade Level	e.g. 1st Year, Grade 11
Assigned Educator	Who teaches this subject
Grading System	Which grading system applies to this subject (see Section 9.1)
Prerequisite(s)	Subject(s) that must be completed before enrollment. Can be None or one or more subjects. Set at subject creation or during default seeding.

NOTE: Subjects do NOT contain weekday or time schedule. Scheduling is configured at the Class level. A single subject may be taught to multiple sections at different times.

Lock/Unlock Cycle:
•	Start of year — Unlocked. Admin edits freely.
•	Enrollment trigger — Admin manually locks. Subjects become read-only.
•	New school year — Automatically unlocks again.

9.1  Grading System per Subject
Different subjects within the same school may follow different grading systems. Admin assigns a grading system to each subject individually. The grading system assigned to a subject is inherited by all classes created for that subject, but can be adjusted at the class level by the Educator within the rules of the rubric system (see Section 16).

10. CLASS MANAGEMENT  (Admin & Educator)
Admin creates class structure. Educator manages all content inside.

10.1  Admin — Class Setup Properties
Title, Level Section, Course/Strand/Program (if applicable), Year/Grade Level, Section (optional), Semester, Term (within that semester), School Year, Assigned Educator, Weekday(s), Time.

10.2  Enrollment and Class Capacity Enforcement
Students are enrolled in classes by Admin only — either through the subject assignment flow (see Section 11.3) or directly per student. Educators do NOT add students to classes.

10.3  Week Computation
Schedule	Week Labeling
Single weekday	Week 1, Week 2, Week 3 ...
Two weekdays (e.g. Mon+Fri)	Week 1.1, Week 1.2, Week 2.1, Week 2.2 ...
Three weekdays	Week 1.1, Week 1.2, Week 1.3, Week 2.1 ...
Five weekdays (daily)	Week 1.1 through Week 1.5, Week 2.1 ...

10.4  Class Archiving
Admin manually closes and archives at end of semester. Read-only after. Records are soft-deleted — invisible in active UI but permanently stored in the database. See Section 22 for soft delete policy.

10.5  Educator Reassignment Mid-Semester
When Admin reassigns a class to a new educator mid-semester, the new educator inherits all lessons, assessments, grading responsibilities, unpublished scores, and attendance records. Historical attribution is never modified retroactively. A complete ownership history log is maintained.

 
11. EDUCATOR MANAGEMENT  (Admin)

11.1  Educator Accounts
Each educator has a system-generated Educator ID used for lookup and search. From an educator's account view, Admin can view the educator's profile, see all assigned classes, add or remove class assignments, and reset password.

11.2  Educator Removal
Blocked if active classes exist. Admin must reassign all classes first. Once no active classes remain, removal goes through.

12. STUDENT MANAGEMENT  (Admin)

12.1  Student Account Status
Status	Meaning
Active	Normal enrolled student. Can log in, take assessments, attend meetings, view grades.
Pending	Profile incomplete or capacity conflict unresolved. Student has no section assigned yet.
Dropped	Student has dropped out. Account is read-only. Subject enrollments removed. Transcript preserved.
Transferred	Student transferred to another institution. Same behavior as Dropped.
Suspended	Temporary restriction. Student cannot log in. Account and enrollments remain intact.
Graduated	System-set when student reaches max year level. Read-only. Full transcript accessible.

12.2  Student Profile
The student profile form is fully dynamic based on the selected Level Section. Profile changes are between semesters only and handle retakers, shifters, irregular students, and conditional advancement cases.

NOTE: Updating a student's profile does NOT automatically change their subject enrollments. Admin manages subject enrollment independently.

12.3  Student Account Search
Admin can search students by Student ID, Full Name, Status, Level Section, Year Level, Section, Course, Strand, or Program.

12.4  Adding a Subject Enrollment to a Student  (Admin only)
Educators cannot enroll students in subjects. Only Admin can. The system validates for duplicate enrollments, capacity limits, and Active student status. Educators receive a notification when a new student is added to their class.

12.5  Removing a Subject Enrollment from a Student  (Admin only)
Admin searches for the student, selects the enrollment to remove, and confirms. Existing submissions and scores are archived, not wiped. Removal is soft-deleted. Educators receive a notification when a student is removed.

12.6  Enrollment Validation on Save
Every time Admin saves a student profile, the system runs a section capacity check. Subject enrollment is NOT triggered automatically from profile save. Admin manages subject enrollment separately.

 
13. LESSON MANAGEMENT  (Educator)
Properties: Title, Description (optional), Week Assignment, Lesson Detail (min 10 words).

13.1  Concept Extraction
•	Auto-triggered when Lesson Detail of 10+ words is saved for the first time.
•	If lesson content is updated after a concept build already exists, educator manually triggers re-extraction.
•	Re-extraction replaces the previous concept build entirely.
•	Runs in background — non-blocking. In-app notification on completion.
•	Feeds only the Assessment Generator for this class.

NOTE: Re-extracting does not affect assessments already generated from the old build. Only new assessments use the updated concept build.

13.2  Lesson Viewer & Presentation Mode
Calendar layout by week. Educator can present lesson content directly inside the meeting room — all participants follow the forward/backward navigation in real time.

14. ASSESSMENT MANAGEMENT  (Educator)

14.1  Question Types
Type	AI Generated / Auto-Graded / Notes
Multiple Choice	AI Generated | Auto-Graded | Checked on submission
True or False	AI Generated | Auto-Graded | Checked on submission
Identification	AI Generated | Auto-Graded | Checked on submission
Enumeration	AI Generated | Auto-Graded | Checked on submission
Essay	AI Generated | Manually Graded | Educator manually grades

14.2  Assessment Dates
•	Release Date — Before this, students see title only — questions hidden.
•	End Date — Submission deadline. Assessment auto-closes.

14.3  Template Configuration & Generation Flow
24.	Select lesson. If no concept build exists, lesson is blocked.
25.	Concept build displays sections and available item counts.
26.	Set type (Quiz / Activity / Exam / Custom) and total items. System validates — cannot exceed concept build total.
27.	Build item ranges — each range has an item span, one question type, and one or more concept sections.
28.	Generation runs in background — non-blocking.
29.	In-app notification when complete.
30.	Set release date, end date, assign to students.

14.4  Editing Generated Questions
Educator can edit any AI-generated question before the release date. Editable: question text, answer choices, correct answer. Once the release date passes, questions lock — no further edits.

14.5  Student Assignment & Status
Status	Meaning
NULL (default)	Not assigned. Treated as missed. Educator can override.
Exempted	Excused. Excluded from grade calc. Counts as perfect score.
Custom Score	Educator manually sets a score.
Submitted	Submitted within deadline. Feeds grade computation.
Draft	Opened, not submitted. Auto-saved. Can resume before end date.

14.6  Assessment Attempt Control
Each student may have only one active attempt per assessment at any time. If the same student opens the assessment from another tab or device, the existing attempt is resumed. This prevents multiple simultaneous tab attempts, multiple device attempts, and accidental duplicate submissions.

14.7  Score Publishing
Scores hidden by default. Educator publishes when ready — to all students or selected students. On grade lock, ALL unpublished scores are automatically published.

14.8  Assessment Deletion
Deleting an assessment after students have submitted wipes all scores. Final grade recomputes without it. Assessment is soft-deleted.

 
15. ATTENDANCE MANAGEMENT  (Educator)

15.1  Overview
Attendance is tracked per class session, not per calendar day. Sessions corresponding to Academic Calendar event days (Holiday / No Class Day) are automatically skipped. The attendance view is organized by week.

15.2  Auto-Attendance from Assessments
If an assessment is assigned to a student on a given session day and the student submits, they are automatically marked Present for that session.

15.3  Manual Attendance Entry
Status	Meaning
Present	Student attended.
Absent	Student did not attend.
Late	Student attended but arrived late.
Excused	Absence is formally excused.

15.4  Attendance View — Weekly Layout
Each week expands to show its sessions. For each session, the educator sees each enrolled student and their attendance status for that day.

15.5  Attendance in Grade Computation
If the rubric includes an Attendance category (manual entry type), the educator inputs the attendance summary score per student manually. The raw session-by-session records are for reference and tracking only.

16. GRADE MANAGEMENT  (Educator)

16.1  Grading by Terms
Grading is tracked per term within each semester. Each term (e.g. Prelim, Midterm, Pre-Finals, Finals) has its own set of assessments and produces its own term grade. At the end of the semester, the student's overall subject grade is computed from all term grades.

16.2  Rubric System
Admin configures a default rubric for the org, pre-filled at class creation. Educators can adjust or replace it from their personal rubric library or build from scratch. Rubric locks permanently once the first student is enrolled. All weights must total exactly 100%.

16.3  Student Grade Visibility
•	Assessment scores — Visible only after educator publishes them.
•	Final computed grade — Hidden until class grades are locked.
•	On grade lock — ALL scores auto-published + final grade revealed.

16.4  Grade Display Modes  (Educator View)
Default View: shows each student's scores per individual assessment item, grouped by assessment type and organized by term.
Clean View: groups assessments by category; scores are aggregated if a category has more than one assessment.

16.5  Grade Locking
Action	Behavior
Admin enables lock window	Admin sets a deadline (e.g. 24 hours).
Educator locks manually	Permanent — no unlocking without platform override.
On lock	All unpublished scores published. Final grade revealed to students.
Auto-lock on deadline	System auto-locks if educator missed deadline.
Grade lock override	Admin can unlock grades directly in extreme cases without any external approval.

 
17. GRADING SCALE CONFIGURATION  (Admin)
Per level section. Each section can use a completely different scale.

Property	Details
Score Range	Percentage range (e.g. 97-100)
Grade Value	Value for that range (e.g. 1.00, A, Outstanding)
Remark	Label (e.g. Passed, Failed, Incomplete)
Passing Threshold	Minimum score considered passing
Validation	Ranges must cover 0-100 fully, no gaps or overlaps

NOTE: Grading scale is editable at the start of each school year. Once the first grade in that level section is locked for the year, the scale locks for the remainder of the year. It unlocks again automatically at the start of the next school year.

18. GRADE EXPORT & CLASS CARDS
PDF — Per Student Class Card: student info, class info, grade breakdown per rubric category per term, term grades, final overall subject grade and remark, educator name, org name, school year, semester.

CSV — Full Class Export: all students, all category scores per term, term grades, final grade, remark, passing status.

Both Admin and Educators can trigger exports for their respective scope.

19. MEETING MANAGEMENT  (Educator)
Built-in video meeting room — no third-party tools. Opens automatically at scheduled date and time.

Properties: Title, Description (optional), Start Date/Time, Invited Students (all or selected subset).

Built-In Room Features:
•	Video & Audio
•	Chat (text during meeting)
•	Raise hand / reactions
•	Screen sharing
•	Lesson Presentation Mode — educator displays lesson to all in real time
•	Forward/backward lesson navigation — all participants follow
•	Educator controls muting and presenting

NOTE: Meetings are NOT recorded — live only. No playback after session ends.

20. NOTIFICATION SYSTEM
In-app only. No email or SMS. Simple list — no read/unread tracking.

Trigger	Recipient / When
Concept extraction complete	Educator — Job finishes
Assessment generation complete	Educator — Job finishes
Assessment released	Assigned students — Release date reached
Assessment deadline approaching	Assigned students — Before end date
Score published	Student — Educator publishes
Grades locked — scores visible	Students in class — Grade lock applied
Class reassigned	New educator — Admin reassigns class
Meeting created	Invited students — On creation
Grade lock window opened	All educators — Admin enables window
Auto-lock applied	Affected educator — Class auto-locked
Enrolled in subject/class	Student — On enrollment
Student added to class by Admin	Educator — Admin adds student
Student removed from class by Admin	Educator — Admin removes student
Enrollment pending (capacity full)	Admin — On capacity block

Retention Policy: Notifications older than 90 days are archived automatically. Archived notifications are not visible to users after archiving.

 
21. ADMIN DASHBOARD & ANALYTICS
Admin sees aggregate analytics only — no access to live class internals (active assessments, current grades, unpublished scores).

•	Total enrollment per level section, course, strand, program, year/grade level, and section. Broken down by account status.
•	Pending students count (no section assigned).
•	Active class count per semester.
•	Grade distribution summaries (after locking), organized by term.
•	Educator count and class load overview.
•	Pending actions — classes near auto-lock with unlocked grades.

22. SOFT DELETE POLICY
EduTool uses soft deletion for critical records. No academic data is permanently destroyed. Deleted records are flagged with a deleted_at timestamp and become invisible in the active UI but remain fully stored in the database.

Soft Delete Applies To:
•	Classes
•	Assessments
•	Lessons
•	Enrollments
•	Meetings

NOTE: Hard deletes are never performed on any of the above record types.

23. AUDIT LOGS

23.1  Admin Audit Log
Records high-impact administrative actions across the org. Stored permanently and never deleted.

Logged Actions:
•	Student profile changes (field, old value, new value)
•	Account status changes
•	Subject enrollment changes (add / remove)
•	Educator class assignment changes (add / remove / reassign)
•	Section capacity overflow decisions
•	Class capacity overflow decisions
•	Password resets
•	Grade lock override actions
•	Academic calendar event creation and modification

23.2  Educator Activity Log
Records class-level events scoped to each educator's classes. Educators see only their own class logs. Educator Activity Logs are also visible to Admin for oversight.

Logged Events:
•	New student enrolled in class (by Admin)
•	Student removed from class (by educator or Admin)
•	Meeting started / ended
•	Assessment created, edited, published, deleted
•	Scores published / unpublished
•	Grade locked (by educator or auto-lock)
•	Lesson created or updated
•	Concept extraction triggered / completed

 
24. SYSTEM SUMMARY

Role	Manages	Cannot Do
Platform Owner	Admin account management only: create, view, copy, reset password, block/unblock Admin accounts. Credential distribution to schools.	Access any org's internal data. Cannot see students, grades, classes, or any org structure.
Admin	One org, school years, level defaults, programs (including custom programs), sections + capacity, courses/strands, subjects (incl. grading system and prerequisites per subject), class structure + capacity + schedule, academic calendar, all accounts (student + educator), student statuses, subject enrollments (manual, per student), educator class assignments, semester settings (per program, with customizable terms), password resets, grading scales, rubric default, lock windows, exports, analytics, audit log.	Manage lesson content, generate assessments, enter grades, view live class internals, or override locks without platform owner involvement.
Educators	Lessons, concept extraction, assessments (config + generation + editing + assignment + essay grading + score publishing), attendance management, grades (by term), rubric library, meetings, exports, activity log (own classes only).	Create/modify class structure. Add/remove student enrollments. View other educators' classes. Change student profiles or statuses.
Students	Take assessments (one active attempt), attend meetings, view published scores, view locked final grades + all scores on lock, full transcript (all years, semesters, terms).	Modify any academic data. View other students' data.


EduTool  •  System Planning Document  v8.4
EDUTOOL
SYSTEM PLANNING DOCUMENT  v8.4
Multi-tenant academic management system for schools

1. SYSTEM OVERVIEW
EduTool is a multi-tenant platform for schools. The top-level container is an Organization. All data lives within an org and is never visible outside it. No public registration exists — the platform owner provisions Admin accounts, and Admins create all other accounts.

Role	Managed By	Core Scope
Platform Owner	EduTool team	Creates and manages Admin accounts only. No access to any org's internal data.
Admin	Platform owner	Creates and manages one org. Manages the full academic structure within that org. Creates and manages all educator and student accounts, including subject assignments. One org per Admin account.
Educators	Admin	Manage lessons, assessments, grades, attendance, and meetings — only within assigned classes.
Students	Admin	Take assessments, attend meetings, view published scores, view locked final grades, access full transcript history.

 
2. DATA ISOLATION — MULTI-TENANT BOUNDARY
Every Admin account owns exactly one Organization. All data created inside that org — students, educators, classes, subjects, sections, rubrics, semester settings, grading scales, school years, calendar events, assessments, grades, transcripts, and audit logs — is strictly scoped to that org and is never visible, accessible, or shared with any other org or Admin.
This is an absolute system-level boundary. It is not a permission setting — it cannot be toggled or overridden by any Admin. The Platform Owner has no access to org-internal data either — their scope is Admin account management only (see Section 3).

2.1  What Is Isolated Per Org
The following are fully isolated per org. An Admin in Org A will never see, search, or accidentally access anything belonging to Org B:

Accounts:
•	Student accounts (profiles, statuses, IDs, sections, enrollments)
•	Educator accounts (profiles, IDs, class assignments)

Academic Structure:
•	School years and their configuration
•	Level defaults and level structure
•	Programs, courses, strands (including custom programs)
•	Sections and their capacities
•	Subjects and subject-level grading system assignments
•	Classes (schedule, enrollment, capacity)
•	Semester settings and term configurations

Grading and Assessment:
•	Rubric templates (Admin default rubric and educator rubric libraries)
•	Grading scales per level section
•	All assessment content, scores, and grades
•	Student transcripts and grade history

Configuration and Logs:
•	Academic calendar events
•	Notification history
•	Admin Audit Log
•	Educator Activity Logs

2.2  Enforcement Rules
•	All database queries are scoped to the authenticated Admin's org_id. No cross-org query is possible through any UI action.
•	An Admin performing any search will only ever see records belonging to their own org. There are no global search results for Admin-level queries.
•	Educator rubric libraries are private to each educator within their org and are invisible to educators in other orgs.
•	Semester setting templates created by one Admin exist only within that Admin's org.
•	Grading scales configured by Admin are scoped to their org's level sections only.
•	Student IDs and Educator IDs are unique within an org, not globally.
•	Section names, class titles, and subject names are local to the org.

2.3  Platform Owner Scope Boundary
The Platform Owner only knows that an Admin account exists — because they created it. They cannot see the org's name, structure, students, grades, or any internal data. Their scope ends entirely at the Admin account. See Section 3 for full Platform Owner capabilities.

 
3. PLATFORM OWNER
The Platform Owner is the EduTool team. Their sole responsibility is managing Admin accounts. They have no visibility into any organization's internal data — no students, no grades, no classes, no structure of any kind.

3.1  Platform Owner Capabilities
Admin Account Management (the full and only scope):
•	Create new Admin accounts (one per school).
•	View all existing Admin accounts and their credentials.
•	View a specific Admin's password in plain text — for distributing login credentials to the school client.
•	Copy Admin account credentials for distribution.
•	Reset an Admin's password.
•	Block an Admin account (disables login; the org is unaffected).
•	Unblock a blocked Admin account.

NOTE: Platform Owner cannot see, enter, or manage any organization's internal data — no students, no educators, no classes, no grades, no structure, no logs. The org belongs entirely to the Admin.

 
4. PLATFORM & ACCOUNT PROVISIONING

4.1  School Onboarding Flow
1.	School negotiates with the platform owner (us).
2.	Platform owner manually creates one Admin account for the school.
3.	Admin logs in and creates their Organization — setting the name and description at this point.
4.	Org is active. Admin begins configuring level defaults, school years, and creating educator and student accounts.

NOTE: One org per Admin account. Prevents account reuse across schools and ensures each school has a clean, isolated environment.

Organization Fields:
•	Name
•	Description

4.2  Account Creation by Admin
Admin creates all accounts. No self-registration. Credentials system-generated (10 characters).

Educator Account Fields:
•	Full Name
•	Email (school-provided Gmail)
•	System auto-generates an Educator ID on creation

Student Account Fields:
•	Full Name
•	Email (school-provided Gmail)
•	Student ID (Admin-assigned, unique within org)
•	Level Section (Elementary / High School / Senior High / College / any custom program added by Admin)
•	Grade/Year Level (based on level section)
•	Section (from org's existing sections for that grade/year level)
•	Strand — if Senior High
•	Course — if College or custom program

NOTE: The student form is fully dynamic. Selecting a Level Section reveals the correct fields. Students are NOT automatically assigned subjects by their section. Section is an organizational grouping only.

4.3  Password Management
Property	Details
Reset scope	All educator accounts | All student accounts | Both | Selected specific accounts
Effect	New password generated. Previous password stops working immediately.
User control	Educators and students cannot change their own passwords. Only Admin can reset them.

4.4  Credential Distribution
Property	Details
Format	CSV bulk download — all accounts at once
Columns	Full Name, Student ID / Educator ID, Email, Generated Password, Level Section, Section, Course/Strand, Year/Grade Level, Account Status
Delivery	Admin distributes externally (print, email, hand out)

4.5  Bulk Student Import
For large schools (1,000+ students), Admin can import student accounts in bulk via CSV upload instead of creating accounts one by one.

CSV Template Columns:
Full Name, Student ID, Email, Level Section, Grade/Year Level, Section, Strand (if Senior High), Course (if College or custom program)

Import Flow:
5.	Admin downloads the blank CSV template from the system.
6.	Admin fills in student data externally (spreadsheet editor).
7.	Admin uploads the completed CSV.
8.	System validates each row: required fields present, Student ID unique within org, Email unique within org, Level Section / Grade/Year Level / Section / Strand/Course values exist in the org's structure.
9.	Validation report shown before any accounts are created.
10.	Admin can fix errors externally and re-upload, or proceed with valid rows only.
11.	System creates accounts for all valid rows with system-generated passwords.
12.	Section capacity checks run per imported student. Capacity conflicts surface as Pending students for Admin to resolve after import.

 
5. ORGANIZATION STRUCTURE

5.1  Organization Overview
An Organization contains School Years, Level Defaults, Programs, Educators List, and Students List.

5.2  Level Defaults (Org-Wide Template)
Admin defines a default level structure for the org. This serves as the base template applied when a new school year is created — eliminating the need to rebuild the structure from scratch each year.

5.3  Programs
EduTool supports multiple program types under one organization. Admin can configure as many programs as the school runs.

Built-in Program Types:
•	Elementary — Grade levels: Day Care, Kinder, Grade 1–6
•	High School — Grade levels: Grade 7–10
•	Senior High School — Grade levels: Grade 11–12 under defined Strands
•	College — Year levels 1–N under defined Courses
•	Custom Programs (Admin-defined) — e.g. TESDA Programs with courses like TechVoc

5.4  Sections
All level sections support named Sections at each grade/year level. Sections are created and managed by Admin.

Section Properties:
•	Name — e.g. Section A, Block A, Narra
•	Level Section — which level section this belongs to
•	Grade/Year Level — which specific grade or year
•	Course/Strand — for Senior High and College/programs only
•	Capacity — maximum number of students allowed in this section

NOTE: Sections are organizational groupings for students ONLY. A student's section does NOT automatically determine what subjects they are enrolled in. Subject enrollment is independent. See Section 11.

 
5A. AUTOMATED DEFAULT SETUP PLAN FOR NEW ORGANIZATIONS
When an Admin creates a new Organization, the system supports an automated default setup flow that seeds the org with a pre-defined academic structure. This eliminates manual setup effort while giving Admins full control over which defaults are applied.

5A.1  Frontend — Organization Creation Form
The organization creation form collects basic org info and includes a dedicated section for default setup configuration.

Basic Organization Info Fields:
•	Organization name
•	Description
•	Admin account credentials

Default Setup Section:
•	Admin can choose whether to initialize the org with defaults (opt-in).
•	Admin sees a grouped list of default options by type:
◦	Programs
◦	Levels
◦	Sections
◦	Subjects (with prerequisite chains — see Section 5A.4)
◦	Grading Scales
•	Admin can deselect any individual defaults they do not want applied.
•	Optional: Admin can preview all selected defaults before final submission.

5A.2  Backend — Organization Initialization
The backend handles org creation and default seeding as a two-step process:

13.	Backend receives the organization creation request and creates the org record.
14.	Backend waits for the default selection submission from the Admin.
15.	Once defaults are submitted, backend seeds the organization's data for each selected category: Programs, Levels, Sections, Subjects (with prerequisites), and Grading Scales.
16.	Each seeded item is tied to the organization via org_id to ensure full data isolation.
17.	Org is flagged as initialized (is_initialized = true) to prevent duplicate seeding.

NOTE: Default templates are stored outside the database (in code or JSON files) for maintainability. This means updating default templates does not require database migrations — only code or config updates.

5A.3  Database Structure Principle
Principle	Detail
Org scoping	All seeded records include the org_id as a foreign key. No seeded record is globally shared.
Template storage	Default templates stored in code or JSON — not in the database. Easier to version and update.
Initialization flag	Organization record includes is_initialized flag. Backend checks this before seeding to prevent duplicate runs.
Data isolation	Seeded data follows the same multi-tenant isolation rules as all other org data. See Section 2.

5A.4  Subject Prerequisites in Default Templates
Subjects in the default templates support prerequisite chains. When subjects are seeded into a new org, their prerequisite relationships are seeded along with them. Each subject record includes:

•	Subject title
•	Year/Grade Level assignment
•	Semester term assignment (e.g. 1st Year, 1st Semester)
•	Prerequisite subject(s) — None, or one or more subject titles that must be completed before enrollment

Example — BS Tourism Management (BSTM) default subject template with prerequisites:

Major Subjects (Core Tourism):

#	Subject Title	Year/Term	Prerequisite(s)	Notes
1	Principles of Tourism	1st Year, 1st Sem	None	
2	Tourism Planning and Development	2nd Year, 1st Sem	Principles of Tourism	
3	Travel Agency Operations	2nd Year, 2nd Sem	Principles of Tourism	
4	Tour Guiding and Tour Operations	2nd Year, 2nd Sem	Principles of Tourism	
5	Tourism Marketing and Promotion	3rd Year, 1st Sem	Tourism Planning and Development	
6	Hospitality and Tourism Law	2nd Year, 2nd Sem	Principles of Tourism	
7	Sustainable Tourism	3rd Year, 2nd Sem	Tourism Planning and Development	
8	Event and Convention Management	3rd Year, 1st Sem	Tourism Marketing and Promotion	
9	Tourism Research and Statistics	2nd Year, 2nd Sem	None	
10	Cultural and Heritage Tourism	3rd Year, 2nd Sem	Tourism Planning and Development	
11	Tourism Policy and Governance	3rd Year, 2nd Sem	Principles of Tourism; Sustainable Tourism	
12	Airline and Cruise Management	4th Year, 1st Sem	Travel Agency Operations	
13	Tourism Entrepreneurship	4th Year, 1st Sem	Tourism Marketing and Promotion	
14	Internship / OJT	4th Year, 2nd Sem	Completion of all core tourism subjects	

Minor / General Education Subjects:

1	Mathematics in the Modern World	1st Year, 1st Sem	None	
2	Purposive Communication	1st Year, 1st Sem	None	
3	Understanding the Self	1st Year, 1st Sem	None	
4	Readings in Philippine History	1st Year, 2nd Sem	None	
5	The Contemporary World	1st Year, 2nd Sem	None	
6	Ethics	2nd Year, 1st Sem	Understanding the Self	
7	Art Appreciation	2nd Year, 2nd Sem	None	
8	Science, Technology, and Society	2nd Year, 2nd Sem	None	
9	Life and Works of Jose Rizal	1st Year, 2nd Sem	None	
10	Physical Education (PE 1 and 2)	1st Year, Both Sems	None	
11	NSTP 1 and 2	2nd Year, Both Sems	None	

NOTE: The prerequisite data is stored as part of the subject seed record. When prerequisites are seeded, the system links subjects by title within the same org. Prerequisite enforcement (blocking enrollment if prerequisites are unmet) is handled at the enrollment validation layer — see Section 12.4.

5A.5  Optional Enhancements
•	Different default templates for different curriculum types (College, K-12, TESDA, etc.).
•	Preview tree view of all defaults — including prerequisite chains — for Admin review before applying.
•	Ability to reset and re-seed defaults, only if the organization is empty or Admin provides explicit confirmation (logged in Admin Audit Log).

5A.6  Process Flow
18.	Admin creates organization and enters basic info.
19.	Admin selects which default categories to apply (Programs, Levels, Sections, Subjects, Grading Scales). Admin may deselect any unwanted defaults.
20.	Admin optionally previews the full default structure — including subject prerequisite chains — before submitting.
21.	Admin confirms submission. Backend seeds the organization with all selected defaults, each tied to the org_id.
22.	Organization is marked as initialized (is_initialized = true).
23.	Organization is ready to use with its own isolated academic structure.

This plan ensures:
•	Admin has full control over which defaults are applied — no forced seeding.
•	All seeded data is isolated per organization — no cross-org leakage.
•	Subject prerequisite relationships are seeded alongside subjects — no manual re-linking needed.
•	Default data setup is automated but flexible and reversible.

 
6. SCHOOL YEAR MANAGEMENT  (Admin)
Admin manages school years within the organization. Multiple school years can exist simultaneously.

Status	Meaning
Pending	A future school year planned in advance. Admin can pre-configure structure, subjects, and classes ahead of time.
Active	The current running school year. Only one Active year at a time.
Ended	A completed school year. Fully archived and read-only.

When a new school year is created, it inherits from the org's Level Defaults as a starting template. Admin can then modify the new year's structure without affecting the defaults or any past years.

7. SEMESTER SETTINGS  (Admin)
Reusable templates. Each program (course/strand, including custom programs) independently selects its own semester template per school year.

•	Up to 3 semesters per template — each with its own start and end date and its own set of terms.
•	Date ranges must not overlap — system enforced.
•	Each semester can be subdivided into terms. Standard configuration: Prelim, Midterm, Pre-Finals, Finals.
•	Admin can customize: add fewer terms, rename them, or use a different structure.

8. ACADEMIC CALENDAR  (Admin)
Admin manages an org-wide academic calendar per school year. This is optional but recommended. It affects lesson scheduling, attendance, and meeting behavior across all classes.

8.1  Calendar Event Types
Event Type	Effect on Classes
Holiday	Class sessions scheduled on this date are skipped. Attendance record is not created. Lesson scheduling shifts automatically.
No Class Day	Same behavior as Holiday — sessions skipped.
Exam Week	Advisory only. No automatic session changes.
Special Event	Informational only. No scheduling effect.

 
9. SUBJECT MANAGEMENT  (Admin)
Property	Details
Title	e.g. Data Structure, Biology
Year/Grade Level	e.g. 1st Year, Grade 11
Assigned Educator	Who teaches this subject
Grading System	Which grading system applies to this subject (see Section 9.1)
Prerequisite(s)	Subject(s) that must be completed before enrollment. Can be None or one or more subjects. Set at subject creation or during default seeding.

NOTE: Subjects do NOT contain weekday or time schedule. Scheduling is configured at the Class level. A single subject may be taught to multiple sections at different times.

Lock/Unlock Cycle:
•	Start of year — Unlocked. Admin edits freely.
•	Enrollment trigger — Admin manually locks. Subjects become read-only.
•	New school year — Automatically unlocks again.

9.1  Grading System per Subject
Different subjects within the same school may follow different grading systems. Admin assigns a grading system to each subject individually. The grading system assigned to a subject is inherited by all classes created for that subject, but can be adjusted at the class level by the Educator within the rules of the rubric system (see Section 16).

10. CLASS MANAGEMENT  (Admin & Educator)
Admin creates class structure. Educator manages all content inside.

10.1  Admin — Class Setup Properties
Title, Level Section, Course/Strand/Program (if applicable), Year/Grade Level, Section (optional), Semester, Term (within that semester), School Year, Assigned Educator, Weekday(s), Time.

10.2  Enrollment and Class Capacity Enforcement
Students are enrolled in classes by Admin only — either through the subject assignment flow (see Section 11.3) or directly per student. Educators do NOT add students to classes.

10.3  Week Computation
Schedule	Week Labeling
Single weekday	Week 1, Week 2, Week 3 ...
Two weekdays (e.g. Mon+Fri)	Week 1.1, Week 1.2, Week 2.1, Week 2.2 ...
Three weekdays	Week 1.1, Week 1.2, Week 1.3, Week 2.1 ...
Five weekdays (daily)	Week 1.1 through Week 1.5, Week 2.1 ...

10.4  Class Archiving
Admin manually closes and archives at end of semester. Read-only after. Records are soft-deleted — invisible in active UI but permanently stored in the database. See Section 22 for soft delete policy.

10.5  Educator Reassignment Mid-Semester
When Admin reassigns a class to a new educator mid-semester, the new educator inherits all lessons, assessments, grading responsibilities, unpublished scores, and attendance records. Historical attribution is never modified retroactively. A complete ownership history log is maintained.

 
11. EDUCATOR MANAGEMENT  (Admin)

11.1  Educator Accounts
Each educator has a system-generated Educator ID used for lookup and search. From an educator's account view, Admin can view the educator's profile, see all assigned classes, add or remove class assignments, and reset password.

11.2  Educator Removal
Blocked if active classes exist. Admin must reassign all classes first. Once no active classes remain, removal goes through.

12. STUDENT MANAGEMENT  (Admin)

12.1  Student Account Status
Status	Meaning
Active	Normal enrolled student. Can log in, take assessments, attend meetings, view grades.
Pending	Profile incomplete or capacity conflict unresolved. Student has no section assigned yet.
Dropped	Student has dropped out. Account is read-only. Subject enrollments removed. Transcript preserved.
Transferred	Student transferred to another institution. Same behavior as Dropped.
Suspended	Temporary restriction. Student cannot log in. Account and enrollments remain intact.
Graduated	System-set when student reaches max year level. Read-only. Full transcript accessible.

12.2  Student Profile
The student profile form is fully dynamic based on the selected Level Section. Profile changes are between semesters only and handle retakers, shifters, irregular students, and conditional advancement cases.

NOTE: Updating a student's profile does NOT automatically change their subject enrollments. Admin manages subject enrollment independently.

12.3  Student Account Search
Admin can search students by Student ID, Full Name, Status, Level Section, Year Level, Section, Course, Strand, or Program.

12.4  Adding a Subject Enrollment to a Student  (Admin only)
Educators cannot enroll students in subjects. Only Admin can. The system validates for duplicate enrollments, capacity limits, and Active student status. Educators receive a notification when a new student is added to their class.

12.5  Removing a Subject Enrollment from a Student  (Admin only)
Admin searches for the student, selects the enrollment to remove, and confirms. Existing submissions and scores are archived, not wiped. Removal is soft-deleted. Educators receive a notification when a student is removed.

12.6  Enrollment Validation on Save
Every time Admin saves a student profile, the system runs a section capacity check. Subject enrollment is NOT triggered automatically from profile save. Admin manages subject enrollment separately.

 
13. LESSON MANAGEMENT  (Educator)
Properties: Title, Description (optional), Week Assignment, Lesson Detail (min 10 words).

13.1  Concept Extraction
•	Auto-triggered when Lesson Detail of 10+ words is saved for the first time.
•	If lesson content is updated after a concept build already exists, educator manually triggers re-extraction.
•	Re-extraction replaces the previous concept build entirely.
•	Runs in background — non-blocking. In-app notification on completion.
•	Feeds only the Assessment Generator for this class.

NOTE: Re-extracting does not affect assessments already generated from the old build. Only new assessments use the updated concept build.

13.2  Lesson Viewer & Presentation Mode
Calendar layout by week. Educator can present lesson content directly inside the meeting room — all participants follow the forward/backward navigation in real time.

14. ASSESSMENT MANAGEMENT  (Educator)

14.1  Question Types
Type	AI Generated / Auto-Graded / Notes
Multiple Choice	AI Generated | Auto-Graded | Checked on submission
True or False	AI Generated | Auto-Graded | Checked on submission
Identification	AI Generated | Auto-Graded | Checked on submission
Enumeration	AI Generated | Auto-Graded | Checked on submission
Essay	AI Generated | Manually Graded | Educator manually grades

14.2  Assessment Dates
•	Release Date — Before this, students see title only — questions hidden.
•	End Date — Submission deadline. Assessment auto-closes.

14.3  Template Configuration & Generation Flow
24.	Select lesson. If no concept build exists, lesson is blocked.
25.	Concept build displays sections and available item counts.
26.	Set type (Quiz / Activity / Exam / Custom) and total items. System validates — cannot exceed concept build total.
27.	Build item ranges — each range has an item span, one question type, and one or more concept sections.
28.	Generation runs in background — non-blocking.
29.	In-app notification when complete.
30.	Set release date, end date, assign to students.

14.4  Editing Generated Questions
Educator can edit any AI-generated question before the release date. Editable: question text, answer choices, correct answer. Once the release date passes, questions lock — no further edits.

14.5  Student Assignment & Status
Status	Meaning
NULL (default)	Not assigned. Treated as missed. Educator can override.
Exempted	Excused. Excluded from grade calc. Counts as perfect score.
Custom Score	Educator manually sets a score.
Submitted	Submitted within deadline. Feeds grade computation.
Draft	Opened, not submitted. Auto-saved. Can resume before end date.

14.6  Assessment Attempt Control
Each student may have only one active attempt per assessment at any time. If the same student opens the assessment from another tab or device, the existing attempt is resumed. This prevents multiple simultaneous tab attempts, multiple device attempts, and accidental duplicate submissions.

14.7  Score Publishing
Scores hidden by default. Educator publishes when ready — to all students or selected students. On grade lock, ALL unpublished scores are automatically published.

14.8  Assessment Deletion
Deleting an assessment after students have submitted wipes all scores. Final grade recomputes without it. Assessment is soft-deleted.

 
15. ATTENDANCE MANAGEMENT  (Educator)

15.1  Overview
Attendance is tracked per class session, not per calendar day. Sessions corresponding to Academic Calendar event days (Holiday / No Class Day) are automatically skipped. The attendance view is organized by week.

15.2  Auto-Attendance from Assessments
If an assessment is assigned to a student on a given session day and the student submits, they are automatically marked Present for that session.

15.3  Manual Attendance Entry
Status	Meaning
Present	Student attended.
Absent	Student did not attend.
Late	Student attended but arrived late.
Excused	Absence is formally excused.

15.4  Attendance View — Weekly Layout
Each week expands to show its sessions. For each session, the educator sees each enrolled student and their attendance status for that day.

15.5  Attendance in Grade Computation
If the rubric includes an Attendance category (manual entry type), the educator inputs the attendance summary score per student manually. The raw session-by-session records are for reference and tracking only.

16. GRADE MANAGEMENT  (Educator)

16.1  Grading by Terms
Grading is tracked per term within each semester. Each term (e.g. Prelim, Midterm, Pre-Finals, Finals) has its own set of assessments and produces its own term grade. At the end of the semester, the student's overall subject grade is computed from all term grades.

16.2  Rubric System
Admin configures a default rubric for the org, pre-filled at class creation. Educators can adjust or replace it from their personal rubric library or build from scratch. Rubric locks permanently once the first student is enrolled. All weights must total exactly 100%.

16.3  Student Grade Visibility
•	Assessment scores — Visible only after educator publishes them.
•	Final computed grade — Hidden until class grades are locked.
•	On grade lock — ALL scores auto-published + final grade revealed.

16.4  Grade Display Modes  (Educator View)
Default View: shows each student's scores per individual assessment item, grouped by assessment type and organized by term.
Clean View: groups assessments by category; scores are aggregated if a category has more than one assessment.

16.5  Grade Locking
Action	Behavior
Admin enables lock window	Admin sets a deadline (e.g. 24 hours).
Educator locks manually	Permanent — no unlocking without platform override.
On lock	All unpublished scores published. Final grade revealed to students.
Auto-lock on deadline	System auto-locks if educator missed deadline.
Grade lock override	Admin can unlock grades directly in extreme cases without any external approval.

 
17. GRADING SCALE CONFIGURATION  (Admin)
Per level section. Each section can use a completely different scale.

Property	Details
Score Range	Percentage range (e.g. 97-100)
Grade Value	Value for that range (e.g. 1.00, A, Outstanding)
Remark	Label (e.g. Passed, Failed, Incomplete)
Passing Threshold	Minimum score considered passing
Validation	Ranges must cover 0-100 fully, no gaps or overlaps

NOTE: Grading scale is editable at the start of each school year. Once the first grade in that level section is locked for the year, the scale locks for the remainder of the year. It unlocks again automatically at the start of the next school year.

18. GRADE EXPORT & CLASS CARDS
PDF — Per Student Class Card: student info, class info, grade breakdown per rubric category per term, term grades, final overall subject grade and remark, educator name, org name, school year, semester.

CSV — Full Class Export: all students, all category scores per term, term grades, final grade, remark, passing status.

Both Admin and Educators can trigger exports for their respective scope.

19. MEETING MANAGEMENT  (Educator)
Built-in video meeting room — no third-party tools. Opens automatically at scheduled date and time.

Properties: Title, Description (optional), Start Date/Time, Invited Students (all or selected subset).

Built-In Room Features:
•	Video & Audio
•	Chat (text during meeting)
•	Raise hand / reactions
•	Screen sharing
•	Lesson Presentation Mode — educator displays lesson to all in real time
•	Forward/backward lesson navigation — all participants follow
•	Educator controls muting and presenting

NOTE: Meetings are NOT recorded — live only. No playback after session ends.

20. NOTIFICATION SYSTEM
In-app only. No email or SMS. Simple list — no read/unread tracking.

Trigger	Recipient / When
Concept extraction complete	Educator — Job finishes
Assessment generation complete	Educator — Job finishes
Assessment released	Assigned students — Release date reached
Assessment deadline approaching	Assigned students — Before end date
Score published	Student — Educator publishes
Grades locked — scores visible	Students in class — Grade lock applied
Class reassigned	New educator — Admin reassigns class
Meeting created	Invited students — On creation
Grade lock window opened	All educators — Admin enables window
Auto-lock applied	Affected educator — Class auto-locked
Enrolled in subject/class	Student — On enrollment
Student added to class by Admin	Educator — Admin adds student
Student removed from class by Admin	Educator — Admin removes student
Enrollment pending (capacity full)	Admin — On capacity block

Retention Policy: Notifications older than 90 days are archived automatically. Archived notifications are not visible to users after archiving.

 
21. ADMIN DASHBOARD & ANALYTICS
Admin sees aggregate analytics only — no access to live class internals (active assessments, current grades, unpublished scores).

•	Total enrollment per level section, course, strand, program, year/grade level, and section. Broken down by account status.
•	Pending students count (no section assigned).
•	Active class count per semester.
•	Grade distribution summaries (after locking), organized by term.
•	Educator count and class load overview.
•	Pending actions — classes near auto-lock with unlocked grades.

22. SOFT DELETE POLICY
EduTool uses soft deletion for critical records. No academic data is permanently destroyed. Deleted records are flagged with a deleted_at timestamp and become invisible in the active UI but remain fully stored in the database.

Soft Delete Applies To:
•	Classes
•	Assessments
•	Lessons
•	Enrollments
•	Meetings

NOTE: Hard deletes are never performed on any of the above record types.

23. AUDIT LOGS

23.1  Admin Audit Log
Records high-impact administrative actions across the org. Stored permanently and never deleted.

Logged Actions:
•	Student profile changes (field, old value, new value)
•	Account status changes
•	Subject enrollment changes (add / remove)
•	Educator class assignment changes (add / remove / reassign)
•	Section capacity overflow decisions
•	Class capacity overflow decisions
•	Password resets
•	Grade lock override actions
•	Academic calendar event creation and modification

23.2  Educator Activity Log
Records class-level events scoped to each educator's classes. Educators see only their own class logs. Educator Activity Logs are also visible to Admin for oversight.

Logged Events:
•	New student enrolled in class (by Admin)
•	Student removed from class (by educator or Admin)
•	Meeting started / ended
•	Assessment created, edited, published, deleted
•	Scores published / unpublished
•	Grade locked (by educator or auto-lock)
•	Lesson created or updated
•	Concept extraction triggered / completed

 
24. SYSTEM SUMMARY

Role	Manages	Cannot Do
Platform Owner	Admin account management only: create, view, copy, reset password, block/unblock Admin accounts. Credential distribution to schools.	Access any org's internal data. Cannot see students, grades, classes, or any org structure.
Admin	One org, school years, level defaults, programs (including custom programs), sections + capacity, courses/strands, subjects (incl. grading system and prerequisites per subject), class structure + capacity + schedule, academic calendar, all accounts (student + educator), student statuses, subject enrollments (manual, per student), educator class assignments, semester settings (per program, with customizable terms), password resets, grading scales, rubric default, lock windows, exports, analytics, audit log.	Manage lesson content, generate assessments, enter grades, view live class internals, or override locks without platform owner involvement.
Educators	Lessons, concept extraction, assessments (config + generation + editing + assignment + essay grading + score publishing), attendance management, grades (by term), rubric library, meetings, exports, activity log (own classes only).	Create/modify class structure. Add/remove student enrollments. View other educators' classes. Change student profiles or statuses.
Students	Take assessments (one active attempt), attend meetings, view published scores, view locked final grades + all scores on lock, full transcript (all years, semesters, terms).	Modify any academic data. View other students' data.


EduTool  •  System Planning Document  v8.4
