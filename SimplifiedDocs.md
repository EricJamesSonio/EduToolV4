# Admin Panel Help

## Table of Contents

- [Dashboard](#dashboard)
- [Organization](#organization)
- [Academic Calendar](#academic-calendar)
- [Audit Log](#audit-log)
- [Classes](#classes)
- [Educators](#educators)
- [Grade Lock](#grade-lock)
- [Grading Scales](#grading-scales)
- [Grading Schemes](#grading-schemes)
- [Profile](#profile)
- [Programs](#programs)
- [School Years](#school-years)
- [Sections](#sections)
- [Semester Settings](#semester-settings)
- [Students](#students)
- [Subjects](#subjects)

---

## Dashboard

View key metrics and enrollment data at a glance.

### What you'll see
- Total students, educators, and active classes
- Pending students (with quick link to resolve)
- Enrollment breakdown by level/section

### When to use
- Daily overview of school status
- Check enrollment numbers
- Identify pending student issues

---

## Organization

Manage school settings and initial system setup.

### Organization Details
- Edit school/organization name
- Update organization description
- Changes save automatically

### Email Extension
Configure the official school email domain (e.g., `student@school.edu`)

⚠ **Required before** creating educators or students.

### Data Seeder
Generate foundational academic data quickly:
- Programs
- Grade levels
- Courses/subjects
- Sections
- Senior high strands (STEM, ABM, HUMSS)

**Best for:** Initial setup or demo environments.

---

## Academic Calendar

Manage holidays and program schedules.

### Holiday Base Calendar
- Set global holidays (applies to all programs)
- Configure per school year

### Program Calendars
- Create program-specific schedules
- Define break periods
- Auto-generate terms from school year dates

**Tip:** Override global holidays for specific programs when needed.

---

## Audit Log

Track all admin and educator activities.

### Audit Log Tab
Admin actions like:
- Student profile/status changes
- Enrollment changes
- Password resets
- Grade lock overrides
- Calendar changes

### Activity Log Tab
Educator actions like:
- Assessment creation/editing
- Score publishing
- Grade locking
- Lesson updates

### Features
- Filter by date, action type, or entity
- Export to CSV
- View detailed metadata

**When to use:** Investigate issues or track changes.

---

## Classes

Manage class assignments and scheduling.

### What you can do
- Create classes (assign subject + educator)
- Archive old classes (makes them read-only)
- Filter by semester, educator, or school year

### Class table shows
- Subject name
- Assigned educator
- Schedule
- Section
- Semester

**Tip:** Use the filter bar to find specific classes quickly.

---

## Educators

Manage teaching staff accounts.

### What you can do
- Create new educators
- Search by name or Educator ID
- Reset passwords
- View credentials after creation

### Requirements
⚠ **Email extension must be set** in Organization first.

### Password reset flow
1. Click reset on educator
2. Confirm action
3. New credentials display (show once)

**When to use:** Onboard new teachers or manage access.

---

## Grade Lock

Control grade submission deadlines.

### Global Templates
- Create reusable lock configurations
- Set deadline dates
- Mark one as default

### Apply to Classes
- Assign templates to individual classes
- Override locks manually (logged in audit trail)

### Filtering
Filter by school year → program → course/strand → level

**Stats:** View total locks, locked/unlocked classes, overrides.

---

## Grading Scales

Define grading scale templates and assign to programs.

### Global Templates
- Create scales (e.g., 90-100 = Excellent)
- Edit or delete unused scales

### Assignment
- Link scales to programs
- Filter by school year
- Change assignments per program

**When to use:** Set up grading standards before classes start.

---

## Grading Schemes

Create grading scheme templates (weight distributions).

### Global Templates
- Define schemes (e.g., 40% written, 30% performance, 30% quarterly)
- Edit existing configurations

### Assignment
- Assign to entire programs
- Override for specific classes
- Filter by school year

**Tip:** Use same template across programs of same type.

---

## Profile

Manage your personal admin account.

### What you can do
- Update personal information
- Change password
- Manage account preferences

---

## Programs

Manage academic programs within school years.

### What you can do
- Create programs (e.g., BS Computer Science, STEM)
- Delete programs (only if no levels/courses assigned)
- View program cards with associated data

### Requirements
⚠ School year must exist first.

**Tip:** Use data seeder in Organization for quick setup.

---

## School Years

Manage academic year calendar.

### What you can do
- Create school years with start/end dates
- Activate/deactivate years
- Edit year details

### Active Year
- Only one can be active at a time
- Used as default across system
- Highlighted in cards

**When to use:** Set up at start of academic year.

---

## Sections

Manage class sections within the hierarchy.

### What you can do
- Create sections (e.g., Section A, Section 1)
- Edit section names and assignments
- Delete sections (may affect enrolled students)
- Search by name

### Filtering
Filter by school year → program → course/strand → level

⚠ **Warning:** Deleting sections may affect enrolled students.

---

## Semester Settings

Define semester templates and assign to programs.

### Template Library
- Create semester structures per program type
- Set number of semesters, names, dates
- Edit or delete templates

### Assignment
- Link templates to programs
- Filter by school year
- Change assignments per program

**Tip:** Reuse templates across programs of same type.

---

## Students

Manage student accounts and enrollments.

### What you can do
- Create students
- Import from CSV (bulk)
- Download credentials (email/password export)
- View student details
- Filter by status, section, program, level

### Requirements
⚠ **Email extension must be set** in Organization first.

### Actions
- **Download Credentials** - Export all student logins
- **Import CSV** - Bulk upload students
- **New Student** - Add single student

**Pending students:** Highlighted in Dashboard with quick link.

---

## Subjects

Manage curriculum offerings.

### What you can do
- Create subjects
- Edit subject details
- Lock/unlock subjects (controls editability)
- Switch between Major/Minor tabs

### Filtering
Filter by school year → program → course/strand → level

### Lock/Unlock
- **Locked** - Read-only, can't edit
- **Unlocked** - Editable again
- Actions logged in audit trail

**Tip:** Lock subjects after school year starts to prevent changes.
