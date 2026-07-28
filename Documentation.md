# Admin Panel Documentation



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



The Dashboard provides an at-a-glance overview of the entire school system with key metrics and enrollment data.



**Key Features:**

- **School Year Selector** - Switch between different school years to view historical or current data

- **Statistics Cards** displaying:

  - Total Students enrolled in the selected school year

  - Total Educators in the system

  - Active Classes for the selected school year

  - Pending Students with a direct link to resolve them

- **Enrollment Breakdown Table** showing:

  - Level/Section combinations

  - Program/Course names

  - Year/Grade levels

  - Section names

  - Active student counts (highlighted in green)

  - Pending student counts (highlighted in amber if > 0)

  - Total student counts



**Organization Setup Modal:**

- Appears on first visit if no organization exists

- Allows setting the school/organization name and optional description

- Can be skipped and configured later in Organization settings



---



## Organization



The Organization page manages the core school information and provides data seeding capabilities.



**Key Features:**



### Organization Details Card

- **School/Organization Name** - Modify the primary name of your institution

- **Description** - Add or update a brief description of the school

- Changes are saved immediately



### Email Extension Card

- **Email Extension Configuration** - Set the email domain extension for the school

- This is required before creating educators or students

- Used to generate email addresses automatically (e.g., `student@extension.edu`)

- Must be configured in Organization Settings before user management features become available



### Data Seeder Card

- **Program Seeding** - Automatically create academic programs based on school structure

- **Level Seeding** - Generate grade levels (e.g., Grade 1, Grade 2, Year 1, Year 2)

- **Course Seeding** - Create courses/subjects for specific programs

- **Section Seeding** - Generate class sections for each level

- **Strand Seeding** - Create specialized tracks (e.g., STEM, ABM, HUMSS for senior high)

- Helps quickly populate the system with foundational data structure



---



## Academic Calendar



The Academic Calendar page manages holidays and program-specific academic schedules.



**Key Features:**



### Holiday Base Calendar Tab

- Configure global holidays that apply to all programs

- Set holiday dates and descriptions

- Holidays automatically apply to all program calendars

- Managed per school year



### Program Calendars Tab

- Create program-specific academic calendars

- Define break periods (e.g., semestral breaks, Christmas breaks)

- Auto-generate terms based on school year dates

- Override global holidays for specific programs if needed

- Each program can have its own calendar configuration



**School Year Selector:**

- Switch between school years to configure calendars for different periods

- Calendar configurations are scoped to the selected school year



---



## Audit Log



The Audit Log page provides comprehensive tracking of all administrative and educator activities.



**Key Features:**



### Audit Log Tab (Administrative Actions)

Tracks all admin-level actions including:

- Student profile changes

- Student status changes

- Enrollment creation/removal

- Password resets

- Class reassignments

- Grade lock overrides

- Capacity overflow warnings

- Academic calendar changes

- Grade lock/unlock events



**Filtering Options:**

- Date range (From/To)

- Action type (dropdown with all admin actions)

- Entity type (e.g., student, class)

- Actor/Entity ID search (UUID search)



### Activity Log Tab (Educator Actions)

Tracks per-class educator activities including:

- Enrollment creation/removal

- Meeting start/end

- Assessment creation/editing/publishing/deletion

- Score publishing/unpublishing

- Grade locking

- Lesson creation/updates

- Concept extraction requests/completions

- Class reassignments



**Filtering Options:**

- Date range (From/To)

- Action type (dropdown with all educator actions)

- Class ID filter



**Shared Features:**

- Expandable metadata for detailed information

- CSV export functionality for both logs

- Pagination (20 entries per page)

- Color-coded action badges (destructive for deletions/unlocks, default for creations, outline for locks)

- Actor identification (system vs user)



---



## Classes



The Classes page manages all class assignments and scheduling.



**Key Features:**



### Class Management

- **Create Classes** - Assign subjects to educators with specific schedules

- **Archive Classes** - Make classes read-only and hide from active views

- **Filter Classes** by:

  - Semester

  - Educator

  - School year

- **View Class Details** including subject, educator, schedule, and enrollment



### School Year Selector

- Filter classes by school year

- Only classes from the selected year are displayed



### Filter Bar

- Semester dropdown to narrow down classes

- Educator dropdown to find specific teacher assignments

- Filters work in combination



### Class Table

- Displays class name/subject

- Assigned educator

- Schedule information

- Section assignment

- Semester

- Archive action for each class



**Empty State:**

- Shows when no classes exist for the selected filters

- Provides "New Class" action to create the first class



---



## Educators



The Educators page manages all teaching staff accounts.



**Key Features:**



### Educator Management

- **Create Educators** - Add new teaching staff to the system

- **Search** - Find educators by name or Educator ID

- **Reset Password** - Generate new passwords for educators

- **View Credentials** - Display educator codes, emails, and passwords after creation/reset



### Email Extension Requirement

- **Email Extension Must Be Set** - Cannot create educators without configuring the email extension in Organization settings

- Alert banner displays when email extension is not configured

- "Setup Email Extension" button redirects to Organization page



### Educator Table

- Displays educator name

- Email address

- Educator ID/code

- Status

- Actions (reset password, view details)



### Password Reset Flow

1. Click reset on an educator

2. Confirm reset action

3. New credentials card displays with:

   - Full name

   - Email

   - Educator code

   - New plain-text password (show once)



**Empty State:**

- Shows when no educators exist

- Action depends on email extension status:

  - "New Educator" if extension is configured

  - "Setup Email Extension" if not configured



---



## Grade Lock



The Grade Lock System manages grade submission deadlines and locking templates.



**Key Features:**



### Global Grade Lock Templates

- **Create Templates** - Define reusable lock configurations with deadlines

- **Edit Templates** - Modify existing template settings

- **Default Template** - Mark one template as the default for new classes

- Templates include:

  - Template name

  - Lock deadline date/time

  - Lock settings configuration



### Template Application

- **Apply Template to Classes** - Assign lock templates to individual classes

- **Override Locks** - Manually override grade locks for specific classes (logged in audit trail)

- Template selector shows all available templates

- Selected template details displayed before application



### Hierarchy Filtering

- Filter grade locks by:

  - School year

  - Program

  - Course/Strand

  - Level

- Cascading filters (selecting a program shows its courses/strands, then levels)



### Grade Lock Stats

- Overview statistics showing:

  - Total locks

  - Locked classes

  - Unlocked classes

  - Overridden locks



### Grade Lock Table

- Class name

- Program

- Level

- Lock status

- Applied template

- Actions (apply template, override)



**Global Rule Display:**

- Shows the default template's deadline if configured

- Displays at the top for quick reference



---



## Grading Scales



The Grading Scales page manages grading scale templates and their assignment to programs.



**Key Features:**



### Global Templates Section

- **Create Scales** - Define grading scale templates (e.g., 90-100 = Excellent, 75-89 = Very Good)

- **Edit Scales** - Modify existing scale definitions

- **Delete Scales** - Remove unused scales

- View all scale templates with their grade ranges



### Assignment Section

- **Assign Scales to Programs** - Link grading scales to specific programs

- Filter by school year

- View current assignments

- Change scale assignments per program



### Scale List

- Displays scale name

- Grade ranges (if applicable)

- Edit/Delete actions

- "New Scale" button to create templates



**Empty State:**

- Shows when no scales exist

- "New Scale" action to create the first scale



**Assignment Visibility:**

- Assignment section only appears when scales exist

- Requires school year selection to view program assignments



---



## Grading Schemes



The Grading Scheme Templates page manages reusable grading scheme configurations.



**Key Features:**



### Global Templates Section

- **Create Templates** - Define grading scheme templates (e.g., 40% written work, 30% performance, 30% quarterly assessment)

- **Edit Templates** - Modify existing scheme configurations

- View all scheme templates with their component breakdowns



### Template Assignment Panel

- **Assign to Programs** - Link grading schemes to entire programs

- **Assign to Classes** - Override program-level assignments for specific classes

- Filter by school year

- View programs with their assigned schemes

- View classes within programs for granular assignment



### School Year Selector

- Switch between school years to manage assignments for different periods

- Auto-selects active school year on load



### Template List

- Displays template name

- Component breakdown (weights, categories)

- Edit actions

- "New Template" button



**Assignment Visibility:**

- Assignment section only appears when templates exist

- Shows programs and their classes for the selected school year

- Supports both program-level and class-level scheme assignments



---



## Profile



The Profile page allows administrators to manage their personal account settings.



**Key Features:**

- Update personal information

- Change password

- Manage account preferences

- Uses the shared ProfileContent component



---



## Programs



The Programs page manages academic programs within school years.



**Key Features:**



### Program Management

- **Create Programs** - Add new academic programs (e.g., BS Computer Science, ABM, STEM)

- **Delete Programs** - Remove programs (only if no levels, courses, or strands are assigned)

- View program cards with:

  - Program name

  - Program type

  - Associated levels/courses count



### School Year Selector

- Filter programs by school year

- Programs are scoped to the selected school year

- Auto-selects active school year on load



### Program Cards

- Display program name and type

- Show associated data (levels, courses)

- Delete action (with confirmation)

- Grid layout for easy browsing



**Empty States:**

- **No School Years** - Shows when no school years exist, directs to create school year first

- **No Programs** - Shows when no programs exist for the selected school year

  - Suggests adding programs manually

  - Mentions data seeder from Organization page as alternative



**Delete Protection:**

- Cannot delete programs with associated levels, courses, or strands

- Warning message in delete confirmation dialog



---



## School Years



The School Years page manages the academic year calendar.



**Key Features:**



### School Year Management

- **Create School Years** - Define new academic years with start and end dates

- **Activate/Deactivate** - Set a school year as active or inactive

- **Edit School Years** - Modify dates and names

- View school year cards with:

  - School year name (e.g., "2024-2025")

  - Start and end dates

  - Status (active/inactive)

  - Associated data counts



### School Year Cards

- Display year name and date range

- Status badge (active/inactive)

- Edit/Delete actions

- Grid layout for easy management



### Active Year Indicator

- Only one school year can be active at a time

- Active year is highlighted

- Used as default across the system



**Empty State:**

- Shows when no school years exist

- "New School Year" action to create the first year



**Delete Protection:**

- Cannot delete school years with associated data (programs, classes, etc.)



---



## Sections



The Sections page manages class sections within the academic hierarchy.



**Key Features:**



### Section Management

- **Create Sections** - Add new sections to levels (e.g., "Section A", "Section 1")

- **Edit Sections** - Modify section names and assignments

- **Delete Sections** - Remove sections (may affect enrolled students)

- Search sections by name



### Hierarchy Filtering

- Filter by:

  - School year

  - Program

  - Course/Strand

  - Level

- Cascading filters (program → course/strand → level)

- Reset filters button



### Section Table

- Displays section name

- Associated level

- Program information

- Course/Strand information

- Edit/Delete actions



### School Year Selector

- Filter sections by school year

- Auto-selects active school year on load

- Reset all filters when year changes



**Empty States:**

- **No School Year** - Shows when no school year is selected

- **No Sections** - Shows when no sections match filters

- **Filtered Results** - Shows when search/filter returns no results



**Delete Warning:**

- Confirmation dialog warns that enrolled students may be affected



---



## Semester Settings



The Semester Settings page manages semester templates and their assignment to programs.



**Key Features:**



### Template Library

- **Create Templates** - Define semester structures per program type

  - Number of semesters

  - Semester names

  - Start/end dates for each semester

- **Edit Templates** - Modify existing semester configurations

- **Delete Templates** - Remove unused templates

- Create from program type for quick setup



### Assignment Section

- **Assign Templates to Programs** - Link semester templates to specific programs

- Filter by school year

- View current assignments per program

- Change template assignments



### Template Types

- Templates are created per program type (e.g., K-12, College, Senior High)

- Same template can be reused across multiple programs of the same type

- Supports different semester structures for different program types



### School Year Selector

- Switch between school years to manage assignments

- Assignments are scoped to the selected school year



**Template Library Display:**

- Shows all templates with their program type

- Semester count and structure preview

- Edit/Delete/Create actions



**Assignment Panel:**

- Lists programs for selected school year

- Shows currently assigned template

- Allows template changes



---



## Students



The Students page manages student accounts and enrollments.



**Key Features:**



### Student Management

- **Create Students** - Add new students to the system

- **Import CSV** - Bulk import students from CSV file

- **Download Credentials** - Export all student credentials (email, password)

- **View Student Details** - Navigate to individual student pages

- Filter students by:

  - Status (Active, Pending, Inactive)

  - Section

  - Program

  - Level



### Email Extension Requirement

- **Email Extension Must Be Set** - Cannot create students without configuring the email extension

- Alert banner displays when email extension is not configured

- "Setup Email Extension" button redirects to Organization page



### Student Filter Bar

- Status dropdown (All, Active, Pending, Inactive)

- Section dropdown

- Program dropdown

- Level dropdown

- Filters work in combination



### Student Table

- Displays student name

- LRN/Student ID

- Email

- Section

- Status

- View action (navigates to student detail page)



### Actions

- **Download Credentials** - Exports CSV with student emails and passwords

- **Import CSV** - Opens CSV import page for bulk student creation

- **New Student** - Opens create student dialog (requires email extension)



**Empty State:**

- Shows when no students match filters

- Action depends on email extension status:

  - "New Student" if extension is configured

  - "Setup Email Extension" if not configured



**Pending Students:**

- Highlighted in Dashboard with direct link to resolve

- Can filter by "Pending" status to view all pending enrollments



---



## Subjects



The Subjects page manages subject offerings across the academic hierarchy.



**Key Features:**



### Subject Management

- **Create Subjects** - Add new subjects to the curriculum

- **Edit Subjects** - Modify subject details

- **Lock/Unlock Subjects** - Control subject editability

  - Locked subjects become read-only

  - Can be unlocked between school years

- **Major/Minor Tabs** - Separate views for major and minor subjects



### Hierarchy Filtering

- Filter by:

  - School year

  - Program

  - Course/Strand

  - Level

- Cascading filters with clear reset options

- Filters apply to both major and minor tabs



### Subject Search

- Real-time search by subject title

- Result count display

- Works in combination with hierarchy filters



### Subject Table

- Displays subject title

- Assigned educator

- Program

- Level

- Course/Strand

- Lock status

- Actions (edit, lock/unlock)



### Subject Tabs

- **Major Subjects** - Primary curriculum subjects

- **Minor Subjects** - Secondary or elective subjects

- Tab switching maintains filter state



**Empty State:**

- **No School Year** - Shows when no school year is selected

- **No Subjects** - Shows when no subjects match filters

- "New Subject" or "New Minor Subject" button based on active tab



**Lock/Unlock Flow:**

- Lock confirmation dialog warns subject becomes read-only

- Unlock confirmation allows editing again

- Lock/unlock actions are logged in audit trail



**Educator Assignment:**

- Subjects can be assigned to educators during creation/editing

- Educator dropdown shows available teachers

