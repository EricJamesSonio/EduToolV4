
================================================================================
  C. ADMIN PORTAL
================================================================================

URL PREFIX: /admin
LAYOUT: Topbar + Sidebar + Content area

  SIDEBAR LINKS
    Dashboard          /admin/dashboard
    Organization       /admin/organization
    School Years       /admin/school-years
    Programs           /admin/programs
    Sections           /admin/sections
    Subjects           /admin/subjects
    Semester Settings  /admin/semester-settings
    Grading Scales     /admin/grading-scales
    Rubric             /admin/rubric
    Classes            /admin/classes
    Educators          /admin/educators
    Students           /admin/students
    Grade Lock         /admin/grade-lock
    Audit Log          /admin/audit-log

  PAGE: /admin  (index)
    Auto-redirects to /admin/dashboard

--------------------------------------------------------------------------------
  C1. /admin/dashboard  — Analytics Overview
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Dashboard"
    - No action buttons

  MAIN CONTENT  (stat cards + tables)

    Row 1 — Summary Stat Cards (4 across)
      [Total Students]  [Total Educators]  [Active Classes]  [Pending Students]
      Each card: icon, number, label
      "Pending Students" card: if count > 0, shows warning color + link "Resolve →"
        → Click: navigates to /admin/students?status=Pending

    Row 2 — Enrollment Breakdown Table
      Columns: Level Section | Program/Course | Year/Grade | Section | Active | Pending | Total
      Shows per-section enrollment counts

    Row 3 — Grade Distribution (after grades locked)
      Shows per-term grade distribution summaries (chart or table)
      Only visible once at least one grade lock has occurred

    Row 4 — Pending Actions Panel
      "Classes near auto-lock with unlocked grades"
      Lists class title, educator, deadline — each row has "View Class" link

--------------------------------------------------------------------------------
  C2. /admin/organization  — Org Settings
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Organization"
    - Action: "Save Changes" button (shown only when form is dirty)

  MAIN CONTENT
    Form card:
      - Organization Name (text input)
      - Description (textarea)
    "Save Changes" button
      → On click: calls PATCH /admin/organization
      → Shows success toast: "Organization updated."

--------------------------------------------------------------------------------
  C3. /admin/school-years  — School Year List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "School Years"
    - Action: "+ New School Year" button
      → Click: opens inline form or modal
        Fields: Title (e.g. "School Year 2027-2028"), Start Year, End Year
        On submit: creates as Pending, redirects to /admin/school-years/[id]

  MAIN CONTENT
    List of SchoolYearCards (one per year)
      Each card:
        - Title (e.g. "School Year 2026-2027")
        - Status badge: Pending / Active / Ended  
        - Date range
        - Actions row:
            "View"  → /admin/school-years/[id]
            SchoolYearStatusActions:
              If Pending + no Active year exists: "Set Active" button
                → ConfirmDialog "Activate this school year? This cannot be undone."
              If Active: "End School Year" button
                → ConfirmDialog "End this school year? It will become read-only."
              If Ended: no status action (read-only badge only)

--------------------------------------------------------------------------------
  C4. /admin/school-years/[id]  — School Year Detail
--------------------------------------------------------------------------------

  PAGEHEADER
    - Breadcrumb: School Years > [Year Title]
    - Title: [Year Title]
    - Status badge inline with title

  TABS / NAV LINKS (sub-navigation inside page):
    Overview  |  Levels  |  Calendar

    [Overview Tab]
      - Year title, status, dates
      - Programs participating in this year
      - Semester settings per program (each row: Program Name | Semester Template | "Edit" link)

    [Levels Tab → /admin/school-years/[id]/levels]
      - Shows full level structure for this year (inherited from Level Defaults)
      - Each level section is expandable:
          Shows grade/year levels → sections with capacity
      - "Edit Structure" button (if year is not Ended)
        → Allows inline editing of sections, capacities

    [Calendar Tab → /admin/school-years/[id]/calendar]
      - Academic calendar events for this year
      - Table: Date | Event Type | Title | Notes
      - "+ Add Event" button
        → Opens modal with fields: Date (date picker), Type (Holiday / No Class Day /
          Exam Week / Special Event), Title, Notes (optional)
        → On save: shows warning if retroactive ("Past sessions may need review.")
      - Each row: "Edit" and "Delete" icon buttons

--------------------------------------------------------------------------------
  C5. /admin/programs  — Programs List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Programs"
    - Action: "+ Add Program" (for custom programs only — built-in are fixed)

  MAIN CONTENT
    Cards or table listing all programs:
      Built-in: Elementary, High School, Senior High, College
      Custom: any Admin-added programs

    Each program row/card:
      - Name, Description, Type (built-in / custom)
      - "View" → /admin/programs/[id]
      - Custom programs: "Delete" button (with ConfirmDialog)

  PAGE: /admin/programs/[id]
    - Program title, description
    - Courses / Strands (if applicable):
        Table: Name | Description | Max Year/Grade
        "+ Add Course/Strand" button → inline form
        Each row: "Edit" (inline) | "Delete" (ConfirmDialog)
    - Linked Subjects (read-only list with links)

--------------------------------------------------------------------------------
  C6. /admin/sections  — Sections List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Sections"
    - Filter bar: Level Section dropdown | Grade/Year Level dropdown | Course/Strand dropdown
    - Action: "+ New Section" button
      → Opens modal: Name, Level Section, Grade/Year Level, Course/Strand, Capacity

  MAIN CONTENT
    DataTable
      Columns: Name | Level Section | Grade/Year Level | Course/Strand | Capacity | Students | Actions
      "Students" column: current enrolled student count
      Actions: "View" (→ detail page) | "Edit" (inline or modal) | "Delete" (ConfirmDialog)

  PAGE: /admin/sections/[id]
    - Section info card (Name, Level, Grade, Capacity)
    - "Edit" button → editable form inline
    - Student list enrolled in this section (read-only, links to each student)
    - Current headcount vs capacity (progress bar style)

--------------------------------------------------------------------------------
  C7. /admin/subjects  — Subjects List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Subjects"
    - Filter: Level Section | Year/Grade Level | Program
    - Action: "+ New Subject"
      → Modal: Title, Year/Grade Level, Program/Course, Assigned Educator (dropdown), Grading System (dropdown)

  MAIN CONTENT
    DataTable
      Columns: Title | Level | Year/Grade | Educator | Grading System | Lock Status | Actions
      Lock Status badge: Unlocked (green) / Locked (gray)
      Actions per row:
        "View"  → /admin/subjects/[id]
        "Lock" / "Unlock" button (if applicable)
          → Lock: ConfirmDialog "Lock this subject? It will become read-only."
          → Unlock: only available between years (auto-unlocks at new year)

  PAGE: /admin/subjects/[id]
    - Subject info (title, year/grade, educator, grading system)
    - "Edit" button (if unlocked)
    - Linked Classes (table: Class Title | Section | Semester | Educator | Schedule)
      "+ Add Class" link → goes to class creation with subject pre-filled

--------------------------------------------------------------------------------
  C8. /admin/semester-settings  — Semester Templates
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Semester Settings"
    - Action: "+ New Template"
      → Opens creation form (see detail page below)

  MAIN CONTENT
    DataTable
      Columns: Template Name | Semesters | Terms | Used By (programs count) | Actions
      Actions: "View" | "Edit" | "Delete" (ConfirmDialog, blocked if in use)

  PAGE: /admin/semester-settings/[id]
    - Template name (editable)
    - Semester list (up to 3):
        Each semester: Name, Start Date, End Date
        Under each semester: Terms list
          Each term: Name (e.g. Prelim, Midterm), Order
          "+ Add Term" button | Drag to reorder | "Delete" icon
        "+ Add Semester" button (max 3)
    - System validates no overlapping date ranges (inline error if overlap)
    - "Save" button

--------------------------------------------------------------------------------
  C9. /admin/grading-scales  — Grading Scales
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Grading Scales"
    - Action: "+ New Scale"

  MAIN CONTENT
    DataTable
      Columns: Name | Level Section | Passing Threshold | Lock Status | Actions
      Actions: "View/Edit" | "Delete" (ConfirmDialog)

  PAGE: /admin/grading-scales/[id]  — Scale Detail + Range Editor
    - Scale name, Level Section assignment, Passing threshold input
    - GradingScaleRangeEditor component:
        Visual 0–100 range builder
        Each row: Score Range (min–max) | Grade Value | Remark | Passed/Failed toggle
        "+ Add Range" button
        Validation: must cover full 0–100, no gaps, no overlaps
        Inline error messages if invalid
    - Lock status shown: "Locked (first grade locked for this level this year)"
    - "Save" button (disabled if locked)

--------------------------------------------------------------------------------
  C10. /admin/rubric  — Admin Default Rubric Editor
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Default Rubric"
    - Subtitle: "This rubric is pre-applied to all new classes."

  MAIN CONTENT
    RubricEditor component
      Category rows, each with:
        - Category Name (text input)
        - Weight (%) (number input)
        - Type: Assessment-linked or Manual Entry (toggle/select)
        - "Delete" icon (ConfirmDialog)
      "+ Add Category" button
      Total weight display: "Total: XX% / 100%"
        → Red if not 100%, green if exactly 100%
      "Save Rubric" button (disabled if total ≠ 100%)
      Lock guard banner: if any class has enrolled students,
        shows "This rubric is locked — remove all enrolled students first."
        Inputs become read-only.

--------------------------------------------------------------------------------
  C11. /admin/classes  — Classes List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Classes"
    - Filters: Level | Semester | Educator | Status (Active / Archived)
    - Action: "+ New Class"

  MAIN CONTENT
    DataTable
      Columns: Title | Level | Section | Semester | Term | Educator | Schedule | Enrolled | Actions
      Schedule column: e.g. "Mon / Wed — 9:00 AM"
      Enrolled: current student count
      Actions: "View" → /admin/classes/[id] | "Archive" (ConfirmDialog)

  PAGE: /admin/classes/[id]
    - Class info card (all properties)
    - "Edit" button (if not archived) → editable form inline, conflict validation
    - Enrolled Students section:
        Table: Student Name | Student ID | Status
        "+ Enroll Student" button → search dialog
          Search by name/ID → select student → confirm enrollment
          System validates (capacity, duplicate, active status)
        Each row: "Remove" button
          → ConfirmDialog with warning if grades/submissions exist
    - Capacity display: e.g. "18 / 30 enrolled" (progress bar)

    ClassForm schedule conflict validation:
      Inline error shown under weekday/time inputs if:
        - Same section has another class at same time on same day
        - Assigned educator is already in another class at that time

--------------------------------------------------------------------------------
  C12. /admin/educators  — Educators List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Educators"
    - Search: by name or Educator ID
    - Action: "+ New Educator"
      → Modal: Full Name, Email
        On submit: shows credentials card (same pattern as Admin creation)

  MAIN CONTENT
    EducatorTable
      Columns: Full Name | Educator ID | Email | Classes Assigned | Actions
      Actions: "View" → /admin/educators/[id] | "Reset Password"

  PAGE: /admin/educators/[id]
    - Profile card: Full Name, Educator ID, Email
    - Reset Password button → ConfirmDialog → shows new credentials
    - ClassAssignmentManager:
        Table: Class Title | Level | Schedule | Semester | School Year
        "+ Assign to Class" button
          → Search/select from available classes not yet assigned
          → On save: educator receives notification
        Each row: "Remove Assignment" button
          → Blocked if class is active (shows error: "Reassign class first.")
    - "Remove Educator" button (bottom)
      → Blocked if active classes exist (inline error)
      → ConfirmDialog otherwise

--------------------------------------------------------------------------------
  C13. /admin/students  — Students List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Students"
    - Filter bar: Status | Level Section | Year/Grade Level | Section | Course/Strand
    - Search: by name or Student ID
    - Action buttons:
        "+ New Student" → StudentProfileForm modal
        "Import CSV" → navigates to /admin/students/import
        "Download Credentials CSV" button → downloads all student credentials

  MAIN CONTENT
    StudentTable
      Columns: Full Name | Student ID | Level | Year/Grade | Section | Status | Actions
      Status: StatusBadge (color-coded)
      Actions: "View" → /admin/students/[id] | "Reset Password" (quick action)

  PAGE: /admin/students/[id]  — Student Detail
    PAGEHEADER
      - Breadcrumb: Students > [Student Name]
      - Title: [Full Name]
      - Status badge
      - Action buttons:
          "Edit Profile" (between semesters only — button disabled otherwise, tooltip explains)
          "Reset Password" → ConfirmDialog → shows new credentials
          "Change Status" → StudentStatusDialog

    TABS:
      Profile  |  Enrollments  |  Transcript

      [Profile Tab]
        - Full Name, Email, Student ID
        - Level Section, Grade/Year Level, Section, Course/Strand (as applicable)
        - Enrollment Validation warning banner (if Pending):
            "This student has no section assigned. Assign a section to activate."

      [Enrollments Tab]
        - Table: Subject | Class Title | Educator | Semester | Term | Status
        - "+ Add Subject Enrollment" button
          → Opens enrollment search dialog
          → Search classes by title / subject / educator / semester
          → On select: validation runs (no duplicate, capacity check)
          → On confirm: admin enrolls, educator notified
        - Each row: "Remove Enrollment" button
          → ConfirmDialog with warning if grades/submissions exist

      [Transcript Tab]
        → links to /admin/students/[id]/transcript (see below)
        (Or renders TranscriptViewer inline)

  PAGE: /admin/students/[id]/transcript
    - TranscriptViewer: grouped by School Year → Semester → Term → Subject
    - Each entry: Subject Name | Term Grade | Final Grade | Remarks
    - Read-only. Print button (triggers browser print view / PDF export)

  MODAL: StudentStatusDialog
    - Current status shown
    - Dropdown: select new status
    - Reverting Dropped/Transferred/Graduated → Active:
        Extra confirmation checkbox: "I confirm this action is deliberate."
        Logged in Audit Log
    - Optional note field
    - "Update Status" button

  PAGE: /admin/students/import  — Bulk CSV Import
    PAGEHEADER: "Bulk Student Import"
    Back link to /admin/students

    BulkImportWizard — step indicator at top (Step 1 of 8)

    Step 1 — Download Template
      "Download CSV Template" button
      Instruction text: columns listed

    Step 2 — Upload CSV
      File drop zone (or click to browse)
      Accepts .csv only

    Step 3 — Validating (auto-advances)
      Loading spinner: "Validating rows..."

    Step 4 — Validation Report
      Summary: "X rows valid, Y rows have errors"
      Valid rows table (preview, paginated)
      Error rows table: Row # | Data Preview | Error Reason
      Buttons:
        "Fix and Re-upload" → back to Step 2
        "Proceed with valid rows only (skip errors)" → Step 5

    Step 5 — Confirm Import
      "X students will be created. Proceed?"
      "Confirm Import" button → Step 6

    Step 6 — Importing (progress bar or spinner)

    Step 7 — Results
      "X accounts created successfully."
      Warning list: capacity conflicts (students set to Pending)
      "Download Credentials CSV" button

    Step 8 — Done
      Link back to Students list
      Link to resolve Pending students

--------------------------------------------------------------------------------
  C14. /admin/grade-lock  — Grade Lock Settings
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Grade Lock"

  MAIN CONTENT
    GradeLockSettingForm
      - Active School Year shown
      - Class list with lock status:
          Table: Class Title | Educator | Semester | Term | Lock Status | Deadline
          Lock Status: Unlocked / Locked / Auto-Locked
      - "Open Lock Window" button (per class or bulk)
        → Opens GradeLockSettingForm modal:
            Deadline date/time picker
            "Open Window" → educators notified
      - "Override Lock" button (per class, for Admin unlocking after lock)
        → GradeLockOverrideDialog:
            "Unlock grades for [Class]? This is irreversible without another lock."
            Reason input (required)
            "Confirm Override" button → logged in Audit Log

--------------------------------------------------------------------------------
  C15. /admin/audit-log  — Audit Log Viewer
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Audit Log"

  MAIN CONTENT
    Filter bar:
      Date range picker | Action Type dropdown | Search by Student ID / Educator ID / Entity

    DataTable
      Columns: Timestamp | Actor | Action Type | Target | Details
      Details column: expandable row or tooltip with full details

    Pagination
    "Export Audit Log CSV" button (top right, filtered export)
