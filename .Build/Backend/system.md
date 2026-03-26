
EduTool
System Planning Document  •  v8.3
1. System Overview
EduTool is a multi-tenant academic management platform for schools. The top-level container is an Organization — all data lives within an org and is never visible outside it. There is no public registration; the Platform Owner provisions Admin accounts, and Admins create all other accounts.

Platform Owner — Created by the EduTool team. Manages Admin accounts only; has zero access to any org's internal data.
Admin — Created by the Platform Owner. Manages one organization: its full academic structure, all educator and student accounts, subject assignments, and configurations.
Educators — Created by Admin. Manage lessons, assessments, grades, attendance, and meetings within their assigned classes only.
Students — Created by Admin. Take assessments, attend meetings, view published scores and locked final grades, and access their full transcript history.

2. Data Isolation — Multi-Tenant Boundary
Every Admin account owns exactly one Organization. All data within that org — students, educators, classes, subjects, rubrics, semester settings, grading scales, school years, assessments, grades, transcripts, and audit logs — is strictly scoped to that org and is never shared with any other org or Admin. This is an absolute system-level boundary, not a permission toggle; it cannot be overridden.
All database queries are scoped to the authenticated Admin's org_id. No cross-org query is possible through any UI action. Student IDs and Educator IDs are unique within an org only — two orgs may use the same ID values without conflict. Section names, class titles, and subject names are entirely local to each org.
The Platform Owner only knows that an Admin account exists. They cannot see org names, structure, students, grades, or any internal data — their scope ends at the Admin account.

3. Platform Owner
The Platform Owner (EduTool team) manages Admin accounts only. Their full set of capabilities: create new Admin accounts (one per school); view existing Admin accounts and credentials; view or copy a specific Admin's password in plain text for credential distribution; reset an Admin's password; block or unblock an Admin account. They have no visibility into any organization's internal data whatsoever.

4. Platform & Account Provisioning
4.1 School Onboarding
The school negotiates with the Platform Owner, who manually creates one Admin account. The Admin logs in, creates their Organization (name and description), then begins configuring level defaults, school years, and accounts. One org per Admin account — no reuse across schools.
4.2 Account Creation
Admin creates all accounts; no self-registration exists. System-generated 10-character credentials are assigned automatically. Educator accounts require a full name and school Gmail (system auto-generates an Educator ID). Student accounts require a full name, school Gmail, Admin-assigned Student ID, level section, grade/year level, section, and strand or course where applicable. The student form is fully dynamic — selecting a Level Section reveals the correct fields, and dropdowns show only what exists in the org.
Students are not automatically assigned subjects by their section. Section is an organizational grouping only — subject enrollment is managed independently (see Section 11).
4.3 Password Management
Admin can reset passwords for all educator accounts, all student accounts, or specific selected accounts. New passwords are generated immediately and previous passwords stop working at once. Educators and students cannot change their own passwords. Admin distributes credentials via CSV bulk download (columns: Full Name, ID, Email, Password, Level Section, Section, Course/Strand, Year/Grade Level, Account Status).
4.4 Bulk Student Import
For large schools, Admin can import student accounts via CSV upload. The template includes: Full Name, Student ID, Email, Level Section, Grade/Year Level, Section, and Strand/Course where applicable. The system validates each row for required fields, ID and email uniqueness, and valid structure values. A validation report is shown before any accounts are created — Admin can fix errors and re-upload, or proceed with valid rows only. Section capacity checks run per imported student; conflicts surface as Pending students for Admin to resolve after import. Bulk import does not bypass any validation rule.

5. Organization Structure
5.1 Level Defaults
Admin defines a default level structure for the org — a base template applied when a new school year is created, eliminating the need to rebuild from scratch each year. It covers all programs the school operates. When creating a new year, Admin can update the level defaults (affecting all future years) or manually adjust just that year's structure without touching the defaults.
5.2 Programs
EduTool supports multiple program types under one org: Elementary (Day Care, Kinder, Grades 1–6), High School (Grades 7–10), Senior High School (Grades 11–12 under defined Strands), College (Year Levels 1–N under defined Courses), and Admin-defined custom programs (e.g. TESDA programs) which follow the same course/year/section structure as College. Each program independently selects its own Semester Setting per school year.
5.3 Sections
All level sections support named Sections at each grade/year level. Sections are created and fully custom-named by Admin — no automatic naming is performed because naming schemes vary per school. Each section has a capacity limit. When a student is assigned to a full section, Admin is prompted to either create a new section or leave the student with no section (Pending status). Sections are organizational groupings only — they do not automatically determine subject enrollment, and classes are not automatically created from sections.

6. School Year Management
Multiple school years can coexist: Pending (future, pre-configurable), Active (current; only one at a time), and Ended (completed, fully archived and read-only). New school years inherit from Level Defaults as a starting template; Admin can then modify the year's structure independently. Schedules, classes, and grade locks reset for each new year; accounts, sections, programs, and semester setting selections carry over. All past school years are permanently archived and read-only. Students can view their full grade history across all years.

7. Semester Settings
Semester settings are reusable templates. Each program independently selects its own template per school year, allowing different programs in the same org to run on different academic structures. Templates support up to 3 semesters, each with its own start/end dates (non-overlapping, system-enforced) and a customizable set of terms. The standard is 4 terms per semester (Prelim, Midterm, Pre-Finals, Finals), but Admin can add fewer terms, rename them, or use any structure the school requires.

8. Academic Calendar
Admin manages an org-wide academic calendar per school year. Holiday and No Class Day events cause class sessions to be automatically skipped — no attendance record is created and lesson week assignments adjust so numbering stays continuous. Exam Week and Special Event are advisory only and have no scheduling effect. Meeting reminders are suppressed on event days. Educators do not need to manually adjust schedules for declared calendar events. If an event is added retroactively, Admin is warned that past records may need manual review.

9. Subject Management
Each subject has a title, year/grade level, assigned educator, and a grading system. Scheduling (weekday and time) is configured at the Class level, not the Subject level, because the same subject may be taught to multiple sections at different times. A single subject can have multiple class instances, each with its own schedule. Admin assigns a grading system to each subject individually, allowing general subjects and major subjects to follow different rubric and weight distributions. Subjects start unlocked at the beginning of each year; Admin manually locks them when enrollment begins, making them read-only. They automatically unlock again at the start of each new school year.

10. Class Management
10.1 Class Setup (Admin)
Admin configures each class with: title, level section, course/strand/program if applicable, year/grade level, section (optional — limits enrollment to students in that section), semester, term, school year, assigned educator, weekday(s), and time. Admin can select one to five weekdays per class. Capacity can be set as a hard limit or unlimited.
10.2 Enrollment & Capacity
Only Admin can enroll students in classes. Enrollment validates that the student's level section, year/grade level, course/strand, and section (if specified) match the class, and that the student is Active. If enrollment would exceed class capacity, Admin is prompted to add a new parallel session or mark the student as Pending Enrollment. Duplicate enrollment in the same subject and semester is blocked. Late additions require the educator to manually assign a status for each past assessment the student missed.
10.3 Week Computation
Week labels are based on calendar weeks, not session count. A class meeting once a week produces Week 1, Week 2, etc. Multiple sessions per week use sub-indexes: Week 1.1, 1.2, 1.3, and so on, ordered by weekday. Sessions that fall on Academic Calendar event days are skipped and do not consume a week index.
10.4 Educator Reassignment
When Admin reassigns a class mid-semester, the new educator inherits all lessons, assessments, grading responsibilities, unpublished scores, and attendance records. Previously recorded scores and grades remain attributed to the educator who graded them — attribution is never modified retroactively. A complete ownership history log is maintained per reassignment and is never deleted.

11. Educator & Student Management
11.1 Educators
Each educator has a system-generated Educator ID. Admin can view an educator's profile, see all assigned classes, add or remove class assignments, and reset their password. Removal is blocked if active classes exist — Admin must reassign all classes first.
11.2 Student Statuses
Active — normal access. Pending — profile incomplete or section unresolved; cannot access system. Dropped or Transferred — read-only, enrollments removed, transcript preserved, cannot log in. Suspended — temporarily cannot log in, enrollments remain intact. Graduated — system-set at max year level, read-only, cannot log in. Dropped, Transferred, and Graduated statuses cannot be reversed to Active without a deliberate Admin confirmation step (logged in Audit Log).
11.3 Subject Enrollment (Admin Only)
Educators cannot enroll students in subjects. Admin searches for the student, selects Add Subject, searches for the target class, and confirms after system validation (no duplicate, capacity available, student is Active). The assigned educator receives a notification. If the class has past assessments, the educator manually assigns a status for each missed item. Removing an enrollment similarly requires Admin confirmation; existing submissions and scores are archived, not deleted. All enrollment changes are logged in the Admin Audit Log.

12. Lesson Management
Educators create lessons with a title, optional description, week assignment, and lesson detail (minimum 10 words). Saving a lesson detail for the first time auto-triggers concept extraction in the background. Extraction feeds the Assessment Generator for that class. If lesson content is updated after a concept build exists, the old build remains until the educator manually triggers re-extraction, which replaces the previous build entirely. Re-extraction does not affect assessments already generated from the old build. Educators can present lesson content directly inside the meeting room — all participants follow navigation in real time.

13. Assessment Management
13.1 Question Types
Five question types are supported: Multiple Choice, True or False, Identification, and Enumeration — all AI-generated and auto-graded on submission. Essay — AI generates the question, but grading is done manually by the educator.
13.2 Generation Flow
Educator selects a lesson (must have a concept build), reviews available concept sections and item counts, sets the assessment type (Quiz, Activity, Exam, or Custom) and total items (cannot exceed concept build total), then builds item ranges — each with a question type and one or more concept sections to fulfill the count. Generation runs in the background; educator receives an in-app notification when complete. Educator can edit any generated question before the release date; once the release date passes, questions lock permanently.
13.3 Student Assignment & Scoring
Each student's status on an assessment defaults to NULL (unassigned, treated as missed). Educator can set Exempted (excluded from grade calc, counts as perfect), Custom Score (manually set), or students can submit on their own (Submitted) or save progress without submitting (Draft). Only one active attempt per student is allowed across all tabs and devices — reopening an existing assessment resumes progress exactly where the student left off. Scores are hidden by default; educator publishes to all or selected students when ready and can unpublish afterward. On grade lock, all unpublished scores are automatically published simultaneously with the final grade.

14. Attendance Management
Attendance is tracked per class session, not per calendar day. Sessions that fall on Academic Calendar event days are automatically skipped — no record is created. The attendance view is organized by week, mirroring the class schedule. If a student submits an assessment on a given session day, they are automatically marked Present for that session. Educator can manually set or override any status: Present, Absent, Late, or Excused. If the rubric includes an Attendance category, the educator inputs a summary score per student manually — session-by-session records are for reference only.

15. Grade Management
15.1 Grading by Terms
Grading is tracked per term within each semester (e.g. Prelim, Midterm, Pre-Finals, Finals). Each term produces its own grade from that term's assessments. At semester end, term grades combine into an overall subject grade using the rubric's configured weights.
15.2 Rubric System
Admin configures a default rubric for the org, which pre-fills at class creation. Educators can adjust it, pick from their personal rubric library, or build from scratch. Once the first student is enrolled in a class, the rubric locks permanently. All weights must total exactly 100%. Rubric categories can be assessment-linked (auto-pulls from assessments) or manual entry types (attendance, behavior, recitation, etc.). Grading systems can vary per subject — general and major subjects may carry different weight distributions.
15.3 Grade Locking
Admin sets a lock window with a deadline. Educators lock grades manually — this is permanent. On lock, all unpublished scores are published and final grades are revealed to students. If an educator misses the deadline, the system auto-locks the class. Admin can override and unlock grades directly in extreme cases without any external approval. If essay items are ungraded at lock time, the system warns but allows the educator to proceed at their own responsibility.

16. Grading Scale Configuration
Admin configures a grading scale per level section. Each scale defines percentage ranges, grade values, and remarks, with a passing threshold. Ranges must cover 0–100 with no gaps or overlaps (system-enforced). The scale is editable at the start of each school year and locks permanently once the first grade in that level section is locked for that year. It unlocks automatically at the start of the next school year.

17. Grade Export & Class Cards
Exports are available as PDF (per-student class card with grade breakdown per rubric category per term, term grades, final grade, remark, educator name, org name, school year, and semester) or CSV (full class export with all students, all category scores, term grades, final grade, remark, and passing status). Both Admin and Educators can trigger exports within their respective scope.

18. Meeting Management
EduTool has a built-in video meeting room — no third-party tools required. Meetings are created with a title, optional description, start date/time, and invited students (all enrolled or a selected subset). The room opens automatically at the scheduled time. Features include video and audio, chat, raise hand and reactions, screen sharing, and lesson presentation mode where all participants follow the educator's navigation in real time. Non-invited students can see that a meeting exists and send a join request; the educator accepts or declines from inside the room. Meetings are not recorded — live only. Educator manually ends the meeting with no duration limit. Meeting reminders are suppressed on Academic Calendar event days.

19. Notification System
In-app notifications only — no email or SMS. Notifications are triggered for: concept extraction and assessment generation completing; assessment release and approaching deadline (students); score publishing and grade locking (students); class reassignment (new educator); meeting creation (invited students); grade lock window opening and auto-lock applied (educators); student enrollment and removal events (educator and student). Notifications older than 90 days are automatically archived and removed from the active list; they remain in internal logs but are no longer visible to users.

20. Admin Dashboard & Analytics
Admin sees aggregate analytics only — no access to live class internals, active assessments, or unpublished scores. Dashboard includes: total enrollment per level section, course, strand, program, year/grade level, and section broken down by account status; pending students count; active class count per semester; grade distribution summaries after locking organized by term; educator count and class load overview; and pending actions showing classes near auto-lock with unlocked grades.

21. Soft Delete Policy
EduTool uses soft deletion for all critical records — no academic data is ever permanently destroyed. Deleted records (classes, assessments, lessons, enrollments, meetings) are flagged with a deleted_at timestamp and become invisible in the active UI but remain fully stored in the database. Historical grade and score records referencing soft-deleted items are preserved and still contribute to transcripts and exports. Hard deletes are never performed on any of these record types.

22. Audit Logs
Admin Audit Log records high-impact administrative actions: student profile changes (field, old and new value), account status changes, subject enrollment changes, educator class assignment changes, section and class capacity overflow decisions, password resets, grade lock overrides, and academic calendar modifications. Admin can filter and search by date, action type, or target entity.
Educator Activity Log records class-level events scoped to each educator's own classes: student enrollments and removals, meeting start/end, assessment creation, editing, publishing, and deletion, score publishing and unpublishing, grade locking, and lesson and concept extraction events. Educator Activity Logs are also visible to Admin for oversight. Both logs are stored permanently and never deleted.

EduTool  •  System Planning Document  •  v8.3
