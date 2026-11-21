# ReliefEd — Features and Pages by Portal

A page-by-page guide to everything in ReliefEd, grouped by the portal you are logged into.

> **How to read this:** every entry shows the **route**, **who uses it**, **what it does**, and the **main actions** available on that page. Child pages (detail views, editors) are listed under their parent.
>
> **Registrar note:** a registrar is an admin account with the registrar flag. Registrars see a reduced sidebar (no School Years, Departments, Subjects, Academic Calendar, Semester Settings, Classes, Grading, Registrars, Grade Lock, or Audit Log). Where a page behaves differently for registrars, it is called out.
>
> **Hidden feature note:** the Groupy class chat routes still exist but are intentionally hidden/disabled in the UI. They are marked **[hidden]** below.

---

## Portal map

| Portal | Base route | Default landing | Who |
| --- | --- | --- | --- |
| Public site | `/` | `/` | Anyone |
| Public enrollment | `/enroll/[orgSlug]/[periodToken]` | same | Applicants (no account) |
| Platform owner | `/platform` | `/platform/admins` | ReliefEd platform staff |
| Admin | `/admin` | `/admin/dashboard` | School owner, admins, registrars |
| Educator | `/educator` | `/educator/classes` | Teachers |
| Student | `/student` | `/student/classes` | Students |

---

# 1. Public site (no login)

### Landing page
**Route:** `/`
**Who:** prospective schools and visitors.

The marketing home page. It introduces ReliefEd and routes authenticated users straight to their portal.

**Sections:**
- Hero and product overview
- Analytics preview
- Features for schools, educators, and students
- Solution showcase
- Resources
- Pricing (Free, Standard, Pro)
- Call to action and contact form
- Footer

### Register (request a school account)
**Route:** `/register`
**Who:** school owners requesting access.

A guided request form. It sends a one-time code to verify the requester's Gmail, then collects the details the platform owner needs to approve the school.

**Fields and steps:**
- Gmail verification via OTP
- Full name
- Institution name
- Role in the school
- Student count
- Programs/departments offered
- Plan selection (Free, Standard, Pro)

If the platform owner asks for a revision, the form comes back with the flagged fields highlighted and the reviewer's notes shown inline. If the email is already linked to an account, a notice blocks a duplicate request.

### Login
**Route:** `/login`
**Who:** everyone with an account.

Email and password sign-in with show/hide password, validation, and role-based redirect: platform owner → platform, admin/registrar → admin, educator → educator, student → student. Already-authenticated users are redirected automatically.

### Public enrollment portal
**Route:** `/enroll/[orgSlug]/[periodToken]`
**Who:** applicants applying to a school, with no ReliefEd account yet.

The self-service application form behind a school's shared enrollment link.

**Steps:**
1. **Identity** — enter personal email, receive a 6-digit OTP, verify it. Verification creates a short-lived session so the applicant can return and edit.
2. **Personal** — name, age, address, contact number, and last school graduated.
3. **Program** — choose program, then course or strand where applicable, then level, and optionally a section.
4. **Review** — confirm details and submit. The system returns an **application code**.
5. **Success** — the application code is displayed for follow-up.

**Other states:**
- Rejected applications show the reason and allow a revision.
- Locked or approved applications become read-only.
- A session timeout sends the applicant back to identity verification.

### Documentation and help
**Routes:** `/docs/get-started/getting-started`, `/docs/get-started/enroll-students`, `/docs/get-started/grading-guide`, `/docs/get-started/templates`, `/docs/get-started/help`
**Who:** admins and anyone learning the system.

Built-in guides covering initial setup, student enrollment, the grading workflow, reusable templates, and troubleshooting. These are static walkthroughs, separate from the in-app help guides attached to individual admin pages.

---

# 2. Platform Owner portal

**Base route:** `/platform`

### Admins
**Route:** `/platform/admins` (default landing)
**Who:** platform owner.

The master list of school admin accounts across all organizations.

**Actions:**
- Search and paginate admins
- Create a new admin account and show generated credentials
- Reset an admin's password (new password shown once)
- Block or unblock an admin
- Open an admin detail view (`/platform/admins/[id]`)

### Registration Requests
**Route:** `/platform/requests`
**Who:** platform owner.

The queue of schools asking for access.

**Actions:**
- Filter by status (pending, approved, rejected) and search by name or email
- Open a request to view all submitted details
- **Approve** — creates the admin account and profile, generates a login email and temporary password, and shows the credentials to send
- **Reject** — closes the request
- **Request revision** — returns the request to the applicant with notes

### Schools
**Route:** `/platform/schools`
**Who:** platform owner.

Every organization (school tenant) on the platform.

**Actions:**
- Search and paginate schools
- Open a school's detail dialog: logo, description, email extension, assigned admin, and admin status
- Jump to the admin account

### Profile
**Route:** `/platform/profile`
**Who:** platform owner.

View and update the platform owner's own profile details.

---

# 3. Admin portal

**Base route:** `/admin`

## 3.1 Main

### Dashboard
**Route:** `/admin/dashboard`
**Who:** admins (registrars use their own trimmed experience).

The school's operational snapshot for a selected school year.

**Contents:**
- **Stat cards:** Total Students, Total Educators, Active Classes, Pending Students (warning card with a "Resolve" shortcut to the pending students filter)
- **Enrollment Analytics** with a period filter (this week, month, term, year, custom range)
- **Enrollments over time** chart, grouped by student status
- **Donut charts:** student status, students by program, and section assignment coverage

### Organization
**Route:** `/admin/organization`
**Who:** admins. Registrars see a read-only version.

The school's tenant profile.

**Contents and actions:**
- School name, description, address, and logo
- Email extension used to generate student, educator, and registrar login emails
- Organization slug
- Edit organization details
- Organization-level enrollment defaults: require semester re-enrollment, auto-unenroll at year end, default shift outcome, and educator grading-scheme override permission
- **Schedule tab** (`/admin/organization/schedule`): school start/end time, slot duration, active weekdays, and recurring breaks (for example lunch and recess)

### School Profile
**Route:** `/admin/data-seeder`
**Who:** admins. Registrars see a read-only view.

The reusable blueprint used to seed school years. This is not a live year — it is the template.

**Contents:**
- Departments by type (daycare, kinder, elementary, junior high, senior high, college)
- Courses and strands per department
- Levels and sections, including section capacities
- Major subjects per level and shared/minor subjects across courses or strands
- Grading scales and grading schemes
- Semester and term configuration
- Automation card: auto-seed new school years from this profile
- Seeder workspace: guided, step-by-step generation of a school year from selected profile pieces, with progress feedback

### Enrollment
**Route:** `/admin/enrollment`
**Who:** admins and registrars.

The roster and placement workspace for a selected school year.

**Tabs:**
- **Enrollments** — every enrolled student, with program/level/section status; enroll a student in a program, change program enrollment, or unenroll
- **Pending** — students enrolled in the year but not yet placed in a section
- **Assignment** — bulk section assignment for unplaced students

**Also on this page:**
- Organization enrollment settings card
- Readiness warning when the school year is not ready
- Shortcut to the guided enrollment flow

**Guided enrollment** — `/admin/enrollment/enroll`
- **Students tab:** pick a program, then course/strand, then level, then section, and enroll students
- **Classes tab:** enroll students directly into specific classes
- School-year readiness guard before changes are allowed

### Enrollment Portal
**Route:** `/admin/enrollment-portal`
**Who:** admins and registrars.

The control center for public, self-service enrollment.

**Contents:**
- Dashboard for the selected period: applied vs. enrolled counts, conversion bar, and breakdowns by department, course, strand, and level
- **Applications tab:** recent applications with quick access to review
- **Departments tab:** per-department application and enrollment counts

**Periods** — `/admin/enrollment-portal/periods`
- Create, edit, and delete enrollment periods
- Fields: name, start date, end date, lock date, and section overflow action
- Section overflow actions: **auto-create** a new section, **expand capacity**, or **no section** (assign later)
- Share dialog with the public link and copy action
- Period phase indicator: upcoming, open, applications locked, ended

**Applications** — `/admin/enrollment-portal/applications`
- Filter by status (pending, locked, approved, rejected) and by period
- Search applicants
- Approve an application: creates the student account, profile, school-year enrollment, program enrollment, and section assignment in one step
- Reject with a reason
- Unlock a locked application so the applicant can correct it
- Open a full application detail view (`/applications/[id]`)

## 3.2 Academic

### School Years
**Route:** `/admin/school-years`
**Who:** admins (not registrars).

The list of academic years as cards, each showing status and a readiness summary.

**Actions:**
- Create a school year
- Edit, activate, end, or delete a year
- Open a year's detail page

**School year detail** — `/admin/school-years/[id]`
- Year information: name, status, start and end dates
- Readiness panel listing blocking and non-blocking issues with links to fix them
- Department cards for the year
- Activate the year (only when ready), or end it
- Ended years are read-only

**Levels** — `/admin/school-years/[id]/levels`
- Generate levels in bulk for the year
- Review levels grouped by program, with inline editing

### Departments
**Route:** `/admin/programs`
**Who:** admins (not registrars).

The departments/programs for the selected school year.

**Actions:**
- Create a department/program
- Open a department detail (`/programs/[id]`) with courses, strands, and levels
- Drill into a course (`/programs/[id]/courses/[courseId]`), strand (`/strands/[strandId]`), or section (`/sections/[sectionId]`)
- Delete with a dependency check that explains what would be affected

### Sections
**Route:** `/admin/sections`
**Who:** admins and registrars.

Section management for the selected school year.

**Actions:**
- Filter by level and browse sections
- Create, edit, and delete sections
- Set section capacity
- Use section presets to create common section sets quickly
- Open a section detail view (`/sections/[sectionId]`)

### Subjects
**Route:** `/admin/subjects`
**Who:** admins (not registrars).

The subject catalog for the selected school year.

**Actions:**
- Search and filter subjects
- Create, edit, lock/unlock, archive, and restore subjects
- Use subject presets to speed up common setups
- Share a subject to courses, strands, or levels, and remove sharing
- Open a subject detail (`/subjects/[id]`) with:
  - Prerequisites
  - Linked classes
  - Weekly sessions
  - Shared-to list

**Subject hierarchy** — `/admin/subjects/hierarchy`
- Visual prerequisite graph with legend
- Filter by program scope
- Inspect dependency chains and cycles

### Academic Calendar
**Route:** `/admin/academic-calendar`
**Who:** admins (not registrars).

Per-program calendars for the selected school year.

**Contents and actions:**
- Program calendar cards with terms, breaks, and holidays
- Add and edit breaks
- Holiday base tab and holiday list
- Calendar grid view
- These calendars drive session blocking for attendance and classes

### Semester Settings
**Route:** `/admin/semester-settings`
**Who:** admins (not registrars).

Semester and term templates, and their assignment to programs.

**Contents and actions:**
- Template library: create, edit, and delete semester templates
- Each template defines semesters, their order, and the terms inside them
- Assign a template to a program
- Set real term dates per program assignment
- Warnings when dates are missing or inconsistent

### Classes
**Route:** `/admin/classes`
**Who:** admins (not registrars).

All classes for the selected school year.

**Actions:**
- Filter and search classes
- Create a class with subject, level/section, educator, schedule slots, room, and capacity
- Use class presets for repeated setups
- Open a class detail (`/classes/[id]`) with:
  - Class information and schedule
  - Assigned educator
  - Enrolled students, with enroll/remove actions
  - Grading scheme for the class
  - Edit class
- Archive a class

**Auto-generate classes** — `/admin/classes/generate`
- Choose a generation window and scope
- Generate class blocks from the year's structure, respecting educator teachable subjects and schedules
- Review proposals before creating

### Rooms
**Route:** `/admin/rooms` (reachable from class scheduling; not in the sidebar)
**Who:** admins.

Room inventory and bookings.

**Actions:**
- Create, rename, and delete rooms
- View a room's weekly bookings
- Assign rooms to class schedule slots (`/rooms/[roomId]`)
- Detect schedule conflicts

## 3.3 Grading

### Grading Scales
**Route:** `/admin/grading-scales`
**Who:** admins (not registrars).

Numeric-to-letter (or equivalent) grade ranges, per program type.

**Actions:**
- Create and edit scales with range editors
- Delete a scale
- Assign scales to school years and programs
- Open a scale detail (`/grading-scales/[id]`)

### Grading Schemes
**Route:** `/admin/grading-schemes`
**Who:** admins (not registrars).

Reusable grading scheme templates that define components and weights.

**Contents and actions:**
- Create and edit scheme templates
- Component editor: category name, weight, and rules
- Assign schemes to classes for the selected school year
- Educator override setting: whether teachers may customize the scheme per class
- Apply a template to multiple classes

### Grade Templates
**Route:** `/admin/grade-templates`
**Who:** admins (not registrars).

CHED/DepEd-style workbooks that educators fill in and send back.

**Actions:**
- Upload a master workbook and map its columns to subjects/classes
- Preview the template and mapping
- Track submission progress across classes
- Download the master file
- Delete a template
- Open a template detail (`/grade-templates/[id]`)

## 3.4 People

### Educators
**Route:** `/admin/educators`
**Who:** admins and registrars.

The teaching staff list.

**Actions:**
- Search and paginate educators
- Create one educator or bulk-create many
- Show generated credentials
- Reset password
- Delete with dependency checks
- Open an educator detail (`/educators/[id]`) with:
  - Profile and credentials
  - Teachable subjects
  - Availability/schedule profile
  - Assigned classes

### Students
**Route:** `/admin/students`
**Who:** admins and registrars.

The student directory.

**Actions:**
- Search and filter by status, level, section, and school year
- Create a student individually or bulk-create
- Open a student detail (`/students/[id]`) with:
  - Profile and account status
  - School-year and program enrollments
  - Class enrollments and schedule
  - Regular-student toggle
  - Request subjects for the student
  - Shift program
  - Change school year
  - Update status (active, suspended, dropped, transferred, graduated)
  - Reset password
  - Academic history and timeline
  - Subject completion overrides
  - Review pending subject/class requests
- **Student hierarchy** (`/students/[id]/hierarchy`): subject prerequisite/completion graph for that student, with completion overrides and reasons
- **Student review** (`/students/[id]/review`): approve or deny a student's requested classes one by one, with conflict detection and a schedule preview
- **Student credentials** (`/admin/students/import`): list student logins, last password reset, and download credentials as a file

### Registrars
**Route:** `/admin/registrars`
**Who:** admins (not registrars).

Registrar account management.

**Actions:**
- Create a registrar (requires the organization email extension to be set)
- Show generated credentials
- Reset password
- Activate or suspend a registrar
- Search and paginate

## 3.5 System

### Grade Lock
**Route:** `/admin/grade-lock`
**Who:** admins (not registrars).

Deadline control over grade editing.

**Contents and actions:**
- Grade lock settings/templates with deadlines
- Apply a template to one class, selected classes, or all classes
- Hierarchy filter by school year, program, course/strand, and level
- Lock statistics
- Per-class lock state and override
- Unlock requests from educators: grant or deny
- Full lock/unlock history

### Audit Log
**Route:** `/admin/audit-log`
**Who:** admins (not registrars).

Two logs in one page:
- **Audit Log** — administrative and security-relevant actions
- **Activity Log** — day-to-day activity records

Both support review of who did what and when.

## 3.6 Support

### Concerns
**Route:** `/admin/concerns`
**Who:** admins and registrars.

The student concern inbox.

**Contents and actions:**
- Filter by status, category, and sender role
- Paginated concern list
- Thread panel to read and reply
- Change concern status through resolution
- Category manager: create and manage concern categories
- Student details dialog for context
- Deep-link support from notifications (`?concernId=`)

### Profile
**Route:** `/admin/profile`
**Who:** all admin-portal users.

View and update the logged-in user's own profile.

---

# 4. Educator portal

**Base route:** `/educator`

### My Classes
**Route:** `/educator/classes`
**Who:** educators.

Cards for every class assigned to the educator, with subject, section, schedule, and student counts. Selecting a class opens its workspace.

### Class Overview
**Route:** `/educator/classes/[classId]`
**Who:** the class's educator.

The class home page.

**Contents:**
- Class information: subject, section, level, semester, schedule, room, student count
- Student roster
- Upcoming assessments
- Attendance snapshot
- Attention section highlighting items that need action

### Lessons
**Route:** `/educator/classes/[classId]/lessons`
**Who:** the class's educator.

**Actions:**
- Browse lessons by week
- Create a lesson (`/lessons/new`) with content and concepts
- Open a lesson (`/lessons/[lessonId]`) to view or edit
- Build concepts inside a lesson

### Presentations
**Route:** `/educator/classes/[classId]/presentations`
**Who:** the class's educator.

**Actions:**
- List presentations
- Create a presentation (`/presentations/new`) with slides
- Open the slide viewer (`/presentations/[presentationId]/view`)

### Assessments
**Route:** `/educator/classes/[classId]/assessments`
**Who:** the class's educator.

**Actions:**
- List assessments with filters by type, term, and week
- Create an assessment (`/assessments/new`) using the assessment builder
- Open an assessment (`/assessments/[assessmentId]`) to view details, questions, and settings
- Assign students to an assessment
- Reopen a closed assessment
- View submissions (`/submissions`)
- Review a submission (`/submissions/[submissionId]/review`) and score it

### Attendance
**Route:** `/educator/classes/[classId]/attendance`
**Who:** the class's educator.

**Actions:**
- Open attendance sessions for class dates
- View the attendance grid across sessions
- Open a session (`/attendance/[sessionId]`) and mark students present, absent, late, or excused

### Grades
**Route:** `/educator/classes/[classId]/grades`
**Who:** the class's educator.

**Actions:**
- Switch between terms
- View the grade table in default or clean layout
- See computed category and final grades
- Enter or adjust manual scores where the scheme allows
- Recompute grades
- Check readiness before finalizing
- Lock grades
- Request an unlock after the deadline
- Submit grades to the admin

**Term view** — `/grades/[termId]` focuses the table on a single term.

### Grading Scheme (per class)
**Route:** `/educator/classes/[classId]/grading-scheme`
**Who:** the class's educator.

View the scheme assigned to the class. If the organization allows educator overrides, customize components and weights for this class.

### Grading Scale (per class)
**Route:** `/educator/classes/[classId]/grading-scale`
**Who:** the class's educator.

View the grading scale applied to the class and how numeric results map to the reported grade.

### Published Grades
**Route:** `/educator/classes/[classId]/published-grades`
**Who:** the class's educator.

A read-only, student-facing view of released grades, with a per-student list and grade cards.

### Meetings
**Route:** `/educator/classes/[classId]/meetings`
**Who:** the class's educator.

**Actions:**
- List scheduled meetings
- Create a meeting (`/meetings/new`) with date, time, and details
- Open a meeting (`/meetings/[meetingId]`) to view or manage invitations and join requests
- Enter the meeting room (`/meetings/[meetingId]/room`)

### Groupy class chat **[hidden]**
**Route:** `/educator/classes/[classId]/groupy`
**Who:** the class's educator.

Class group chat with messages, reactions, and polls. Present in the codebase but hidden/disabled in the current UI.

### Schedule
**Route:** `/educator/schedule`
**Who:** educators.

Weekly teaching schedule across all assigned classes, with empty state when no classes are assigned.

### Grading Scheme Library
**Route:** `/educator/grading-scheme-library`
**Who:** educators.

Browse reusable grading scheme templates and apply one to a class, subject to organization override settings.

### Grade Templates
**Route:** `/educator/grade-templates`
**Who:** educators.

Workbooks assigned by the admin.

**Actions:**
- Download a workbook pre-filled with the educator's classes
- Fill it outside the system
- Submit it back; the system writes the grade rows and reports how many were written
- Filter by school year, semester, and term

### Activity Log
**Route:** `/educator/activity-log`
**Who:** educators.

A personal log of the educator's actions in the system. Standalone route; not in the sidebar.

### Profile
**Route:** `/educator/profile`
**Who:** educators.

View and update personal profile details.

### Help
**Route:** `/educator/help`
**Who:** educators.

FAQ-style help covering attendance, assessments, grade computation, and grade locking.

---

# 5. Student portal

**Base route:** `/student`

### My Classes
**Route:** `/student/classes`
**Who:** students.

Cards for every class the student is enrolled in, with subject, section, educator, and schedule. Selecting a class opens its workspace.

### Class Overview
**Route:** `/student/classes/[classId]`
**Who:** enrolled students.

**Contents:**
- Class information and schedule
- Upcoming assessments
- Grade summary
- Attendance summary
- Shortcuts to lessons, meetings, assessments, attendance, and grades

### Lessons
**Route:** `/student/classes/[classId]/lessons`
**Who:** enrolled students.

Browse published lessons by week and open a lesson (`/lessons/[lessonId]`) to read its content and concepts.

### Assessments
**Route:** `/student/classes/[classId]/assessments`
**Who:** enrolled students.

**Actions:**
- List available and past assessments
- Open an assessment (`/assessments/[assessmentId]`) and answer it
- Submit work
- View the result (`/assessments/[assessmentId]/result`)

### Attendance
**Route:** `/student/classes/[classId]/attendance`
**Who:** enrolled students.

Personal attendance record for the class, including session history and summary counts.

### Grades
**Route:** `/student/classes/[classId]/grades`
**Who:** enrolled students.

Released grades for the class, broken down by category and term, with the final grade once available.

### Meetings
**Routes:** `/student/classes/[classId]/meetings`, `/student/classes/[classId]/meetings/[meetingId]`, `/student/classes/[classId]/meetings/[meetingId]/room`
**Who:** enrolled students.

View scheduled class meetings, open meeting details, and join the meeting room. The top-level `/student/meetings` route simply redirects to My Classes because meetings are organized per class.

### Groupy class chat **[hidden]**
**Route:** `/student/classes/[classId]/groupy`
**Who:** enrolled students.

Class group chat with messages, reactions, and polls. Present in the codebase but hidden/disabled in the current UI.

### Schedule
**Route:** `/student/schedule`
**Who:** students.

Weekly class schedule across all enrollments, with an empty state when the student has no classes yet.

### Transcript
**Route:** `/student/transcript`
**Who:** students.

A printable transcript grouped by school year, semester, and class.

**Contents:**
- Final grade per class
- Released vs. pending status
- Year and semester grouping
- Print action

### My Academic History
**Route:** `/student/academic-history`
**Who:** students.

A chronological view of the student's academic record: enrollments, subject completions, program shifts, and outcomes across school years.

### Concerns
**Route:** `/student/concerns`
**Who:** students.

Submit and track concerns.

**Actions:**
- Choose a category
- Write and submit a concern
- View your concern list and statuses
- Open a thread and reply
- Receive replies from staff

### Profile
**Route:** `/student/profile`
**Who:** students.

View and update personal profile details.

### Help
**Route:** `/student/help`
**Who:** students.

FAQ-style help covering grades, assessments, results, and attendance.

---

# 6. Cross-cutting features

These appear across multiple portals rather than on a single page.

| Feature | Where it appears | What it does |
| --- | --- | --- |
| **Notifications** | Top bar in every portal | Bell with unread badge; deep links into the relevant page (for example a concern thread). |
| **Help guides** | Admin pages | Contextual help drawer keyed to the page (`HelpGuide` slug), separate from the public docs. |
| **Search, filters, pagination** | All list pages | Consistent list behavior with debounced search, filters, page size, and empty states. |
| **Status badges** | Everywhere | Shared visual language for pending, active, ended, locked, approved, rejected, suspended, and similar states. |
| **Audit and activity logging** | Admin | Admin actions and day-to-day activity are recorded and reviewable. |
| **OTP verification** | Registration, enrollment portal, email change | Six-digit codes verify ownership of an email before sensitive actions. |
| **Generated credentials** | Platform, admin | System-generated login emails and temporary passwords, shown once and emailed where configured. |
| **Registrar restrictions** | Admin | Registrar accounts see a reduced sidebar and read-only views for organization and school profile. |
| **Grade lock and unlock** | Admin, educator | Deadlines prevent grade edits; educators request unlocks and admins grant or deny them. |
| **Grading engine** | Admin, educator | Scales map scores to grades; schemes define weighted components; manual scores are allowed only where configured. |
| **Subject prerequisites and completion** | Admin, student | Prerequisite chains, eligibility warnings, and completion overrides with reasons. |
| **Program shifting** | Admin | Move a student between programs while preserving history through shift events. |
| **Academic timeline and transcript** | Admin, student | Permanent record of grades, completions, shifts, and outcomes. |
| **File upload and export** | Admin, educator | Logos, grade workbooks, credential downloads, and report exports. |
| **Realtime meetings** | Educator, student | Meeting rooms with invitations and join requests. |
| **Groupy chat** | Educator, student | **[hidden]** Class chat with messages, reactions, and polls; currently disabled in the UI. |

---

# 7. Route index

A quick reference for every page route.

**Public**
- `/` — landing
- `/register` — school account request
- `/login` — sign in
- `/enroll/[orgSlug]/[periodToken]` — public enrollment portal
- `/docs/get-started/*` — getting started, enroll students, grading guide, templates, help

**Platform**
- `/platform/admins`, `/platform/admins/[id]`
- `/platform/requests`
- `/platform/schools`
- `/platform/profile`

**Admin**
- `/admin/dashboard`
- `/admin/organization`, `/admin/organization/schedule`
- `/admin/data-seeder`
- `/admin/enrollment`, `/admin/enrollment/enroll`
- `/admin/enrollment-portal`, `/admin/enrollment-portal/periods`, `/admin/enrollment-portal/applications`, `/admin/enrollment-portal/applications/[id]`
- `/admin/school-years`, `/admin/school-years/[id]`, `/admin/school-years/[id]/levels`
- `/admin/programs`, `/admin/programs/[id]`, `/admin/programs/[id]/courses/[courseId]`, `/admin/programs/[id]/strands/[strandId]`, `/admin/programs/[id]/sections/[sectionId]`
- `/admin/sections`, `/admin/sections/[sectionId]`
- `/admin/subjects`, `/admin/subjects/hierarchy`, `/admin/subjects/[id]`
- `/admin/academic-calendar`
- `/admin/semester-settings`
- `/admin/classes`, `/admin/classes/generate`, `/admin/classes/[id]`
- `/admin/rooms`, `/admin/rooms/[roomId]`
- `/admin/grading-scales`, `/admin/grading-scales/[id]`
- `/admin/grading-schemes`
- `/admin/grade-templates`, `/admin/grade-templates/[id]`
- `/admin/educators`, `/admin/educators/[id]`
- `/admin/students`, `/admin/students/import`, `/admin/students/[id]`, `/admin/students/[id]/hierarchy`, `/admin/students/[id]/review`
- `/admin/registrars`
- `/admin/grade-lock`
- `/admin/audit-log`
- `/admin/concerns`
- `/admin/profile`

**Educator**
- `/educator/classes`, `/educator/classes/[classId]`
- `/educator/classes/[classId]/lessons`, `/lessons/new`, `/lessons/[lessonId]`
- `/educator/classes/[classId]/presentations`, `/presentations/new`, `/presentations/[presentationId]/view`
- `/educator/classes/[classId]/assessments`, `/assessments/new`, `/assessments/[assessmentId]`, `/assessments/[assessmentId]/submissions`, `/submissions/[submissionId]/review`
- `/educator/classes/[classId]/attendance`, `/attendance/[sessionId]`
- `/educator/classes/[classId]/grades`, `/grades/[termId]`
- `/educator/classes/[classId]/grading-scheme`
- `/educator/classes/[classId]/grading-scale`
- `/educator/classes/[classId]/published-grades`
- `/educator/classes/[classId]/meetings`, `/meetings/new`, `/meetings/[meetingId]`, `/meetings/[meetingId]/room`
- `/educator/classes/[classId]/groupy` **[hidden]**
- `/educator/schedule`
- `/educator/grading-scheme-library`
- `/educator/grade-templates`
- `/educator/activity-log`
- `/educator/profile`
- `/educator/help`

**Student**
- `/student/classes`, `/student/classes/[classId]`
- `/student/classes/[classId]/lessons`, `/lessons/[lessonId]`
- `/student/classes/[classId]/assessments`, `/assessments/[assessmentId]`, `/assessments/[assessmentId]/result`
- `/student/classes/[classId]/attendance`
- `/student/classes/[classId]/grades`
- `/student/classes/[classId]/meetings`, `/meetings/[meetingId]`, `/meetings/[meetingId]/room`
- `/student/classes/[classId]/groupy` **[hidden]**
- `/student/schedule`
- `/student/transcript`
- `/student/academic-history`
- `/student/concerns`
- `/student/profile`
- `/student/help`
