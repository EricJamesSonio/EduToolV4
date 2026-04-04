
================================================================================
  D. EDUCATOR PORTAL
================================================================================

URL PREFIX: /educator
LAYOUT: Topbar + Sidebar + Content area

  SIDEBAR LINKS
    Classes         /educator/classes
    Rubric Library  /educator/rubric-library
    Activity Log    /educator/activity-log

  PAGE: /educator  (index)
    Auto-redirects to /educator/classes

--------------------------------------------------------------------------------
  D1. /educator/classes  — Class List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "My Classes"
    - Filter: Semester | School Year

  MAIN CONTENT
    Grid of class cards (or table)
      Each card:
        - Class Title
        - Level / Section
        - Schedule (e.g. Mon/Wed 9:00 AM)
        - Semester / Term
        - Student count
        - "Open" button → /educator/classes/[classId]

--------------------------------------------------------------------------------
  D2. /educator/classes/[classId]  — Class Overview
--------------------------------------------------------------------------------

  PAGEHEADER
    - Breadcrumb: Classes > [Class Title]
    - Title: [Class Title]
    - Subtitle: Level | Section | Schedule

  SUB-NAVIGATION (tabs or sidebar links within class context):
    Overview  |  Lessons  |  Assessments  |  Attendance  |  Grades  |  Rubric  |  Meetings

  [Overview Tab — default]
    - Class info card (all properties, read-only)
    - Enrolled Students table: Name | Student ID | Status
    - Quick stats: total students, pending essay grades count, unread submissions

--------------------------------------------------------------------------------
  D3. /educator/classes/[classId]/lessons  — Lesson List
--------------------------------------------------------------------------------

  PAGEHEADER (within class context)
    - Title: "Lessons"
    - Action: "+ New Lesson" → /educator/classes/[classId]/lessons/new

  MAIN CONTENT
    WeekCalendar component:
      - Calendar organized by week (Week 1, Week 2, ...)
      - Each week row expandable, showing lesson cards for that week
      - LessonCard per lesson:
          Title, week assigned, concept build status (None / Extracted / Outdated)
          "View/Edit" → /educator/classes/[classId]/lessons/[lessonId]

  PAGE: /educator/classes/[classId]/lessons/new
    LessonForm:
      - Title (required)
      - Description (optional)
      - Week Assignment (dropdown of available weeks for this class)
      - Lesson Detail (textarea, min 10 words enforced with counter)
      "Save" button
        → On save: concept extraction auto-triggers in background
        → Toast: "Lesson saved. Concept extraction running..."
        → In-app notification arrives when extraction complete

  PAGE: /educator/classes/[classId]/lessons/[lessonId]
    PAGEHEADER
      - Breadcrumb: Lessons > [Lesson Title]
      - Edit button (pencil icon or "Edit Lesson")
        → Enables inline editing of all fields
        → On save: if Lesson Detail changed and concept build exists,
            shows banner: "Content updated. Re-extract concepts?"
            "Re-extract" button → triggers extraction, replaces old build
            Warning: "Re-extraction does not affect already-generated assessments."
      - "Delete Lesson" button → ConfirmDialog

    ConceptBuildViewer section:
      If no concept build: "No concept build yet. Save lesson content (10+ words) to trigger extraction."
      If building: loading spinner + "Extracting concepts..."
      If ready: displays sections with keyword counts
        e.g. Stack: 5 items | Queue: 6 items | Binary Tree: 4 items
      "Use in Assessment" button → navigates to assessment creation pre-filled with this lesson

--------------------------------------------------------------------------------
  D4. /educator/classes/[classId]/assessments  — Assessment List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Assessments"
    - Filter: Type (Quiz / Activity / Exam / Custom) | Term
    - Action: "+ New Assessment" → /educator/classes/[classId]/assessments/new

  MAIN CONTENT
    DataTable
      Columns: Title | Type | Term | Release Date | End Date | Submitted | Pending Essays | Actions
      "Submitted" column: X / total assigned students
      Actions:
        "View" → /educator/classes/[classId]/assessments/[assessmentId]
        "Submissions" → /educator/classes/[classId]/assessments/[assessmentId]/submissions
        "Delete" → ConfirmDialog with strong warning:
          "This will permanently delete all submitted scores. Final grades will recompute."

  PAGE: /educator/classes/[classId]/assessments/new  — Assessment Builder (7-step)

    AssessmentBuilderStepper  — step indicator at top

    Step 1 — Select Lesson
      Dropdown or list of lessons for this class
      Shows concept build status next to each lesson
      Lessons without concept build: grayed out, tooltip "No concept build — save lesson content first."
      "Next" button

    Step 2 — View Concept Build
      ConceptBuildViewer (read-only display)
      Shows sections + item counts available
      "Next" button

    Step 3 — Basic Configuration
      - Title
      - Type: Quiz / Activity / Exam / Custom (dropdown)
      - Term (dropdown from class semester terms)
      - Total Items (number input)
        → Validates: cannot exceed concept build total available items
        Inline error: "Cannot exceed [X] total available items."
      "Next" button

    Step 4 — Configure Item Ranges
      ItemRangeConfigurator
        Each range row:
          - Start item # (auto-filled from previous range end + 1)
          - End item # (number input)
          - Question Type (dropdown: MCQ / True-False / Identification / Enumeration / Essay)
          - Concept Sections (multi-select checkboxes from concept build)
            → Shows available count per section
            → Validates: selected sections total ≥ range item count
            → Inline error if insufficient items selected
        "+ Add Range" button
        All item numbers 1 → Total Items must be covered (validated on step advance)
      "Next" button

    Step 5 — Generate
      Summary of configuration shown
      "Generate Questions" button
        → Triggers background job
        → Shows progress spinner: "Generating assessment questions..."
        → On completion: auto-advances to Step 6
        (In-app notification also sent when complete)

    Step 6 — Review & Edit Generated Questions
      QuestionEditor:
        Lists all generated questions grouped by range
        Each question:
          - Question text (editable input)
          - For MCQ: choice A/B/C/D inputs, correct answer radio
          - For True/False: T/F correct answer toggle
          - For Identification/Enumeration/Essay: answer input (editable)
        Note banner: "You can edit questions before publishing.
                      After release date, questions lock."
      "Next" button

    Step 7 — Set Dates & Assign
      - Release Date (date-time picker)
      - End Date (date-time picker)
        → Validates: End Date > Release Date
      - Assign To: "All enrolled students" (default) or "Selected students"
        If selected: student checklist
      "Publish Assessment" button
        → On save: assessment created
        → Students notified on release date (scheduled)
        → Redirects to /educator/classes/[classId]/assessments/[id]

  PAGE: /educator/classes/[classId]/assessments/[assessmentId]  — Detail

    PAGEHEADER
      - Title: [Assessment Title]
      - Breadcrumb: Assessments > [Title]
      - Badges: Type | Term | Status (Upcoming / Open / Closed)
      - Action buttons:
          "Edit Questions" (only before release date) → back to Step 6 view
          "View Submissions" → /[assessmentId]/submissions
          "Delete" → ConfirmDialog with warning

    CONTENT
      - Release Date / End Date
      - Total Items
      - Assigned students count / submitted count
      - Question list (read-only after release)

  PAGE: /educator/classes/[classId]/assessments/[assessmentId]/submissions  — Submissions

    PAGEHEADER
      - Title: "Submissions — [Assessment Title]"
      - Publish controls: "Publish All" button | "Unpublish All" button

    CONTENT
      SubmissionTable
        Columns: Student Name | Status | Score | Published | Essay Graded | Actions
        Status: NULL / Draft / Submitted / Exempted / Custom Score
        Actions:
          "Grade Essay" (if essay questions + not yet graded)
            → Opens EssayGrader panel (sidebar or modal)
              Shows question, student response, score input, feedback input
              "Save Score" button
          "Set Status" (override: Exempted / Custom Score / NULL)
            → Opens small modal with status dropdown + score input if Custom
          "Publish" / "Unpublish" toggle per student
      
      EssayGrader:
        - Student name displayed
        - Question text
        - Student's written response (read-only)
        - Score input (0 to max)
        - Feedback textarea (optional)
        - "Save" button

--------------------------------------------------------------------------------
  D5. /educator/classes/[classId]/attendance  — Weekly Attendance
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Attendance"
    - Week navigator: "< Week 3 >" (prev/next buttons, current week highlighted)

  MAIN CONTENT
    WeeklySessionList:
      Current week's sessions listed (e.g. Session 3.1, Session 3.2)
      Each session row:
        - Date, weekday label
        - "View / Edit" → /attendance/[sessionId]

  PAGE: /educator/classes/[classId]/attendance/[sessionId]  — Session Detail

    PAGEHEADER
      - Title: "Attendance — [Date]  Session [X.X]"
      - "Save All" button

    CONTENT
      AttendanceBulkEntry:
        Table: Student Name | Attendance Status (radio or dropdown: Present / Absent / Late / Excused)
        "Mark All Present" quick-action button at top
        Auto-filled rows if student submitted an assessment that day (Present auto-set)
        Educator can override any auto-set status
        "Save All" → saves all at once

--------------------------------------------------------------------------------
  D6. /educator/classes/[classId]/grades  — Grades by Term
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Grades"
    - Term selector: tab row (Prelim | Midterm | Pre-Finals | Finals)
    - View toggle: "Default View" / "Clean View"
    - Action: "Lock Grades" button (if within lock window)
      → GradeLockButton → ConfirmDialog with essay warning if ungraded:
          "X essays are ungraded. Lock anyway?"
          "Lock Grades" final confirm → grades locked, students notified

  MAIN CONTENT  (per selected term)

    Default View:
      GradeTable component
      Columns: Student Name | [each assessment as column] | Manual entries (Behavior, Attendance, etc.) | Term Grade
      Scores as "earned/total" (e.g. 19/20)
      Manual entry cells (Attendance, Behavior, Recitation, etc.):
        Editable inline — click cell to type score
      Term Grade column: computed, read-only

    Clean View:
      Same layout but assessment columns collapsed to category totals
      Columns: Student Name | Activities | Quizzes | Exam | [manual categories] | Term Grade

    ManualScoreInput:
      Click any manual category cell → input becomes active
      Tab to move to next student
      "Save" on blur or explicit save button

  PAGE: /educator/classes/[classId]/grades/[termId]
    Same as above but filtered to specific term (for deep link)

--------------------------------------------------------------------------------
  D7. /educator/classes/[classId]/grading-scheme  — Class Grading Scheme Editor
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Grading Scheme — [Class Title]"

  MAIN CONTENT
    GradingSchemeEditor (same as Admin grading scheme editor, but class-scoped)
    Pre-filled with Admin default or previously saved grading scheme
    Options at top:
      "Use Admin Default" button → resets to Admin default (ConfirmDialog)
      "Import from Library" button → opens educator's grading scheme library picker
      "Save as New Template" button → saves current config to library with name input
    Lock guard: if first student enrolled, grading scheme locks (read-only shown)

--------------------------------------------------------------------------------
  D8. /educator/classes/[classId]/meetings  — Meeting List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Meetings"
    - Action: "+ New Meeting" → /educator/classes/[classId]/meetings/new

  MAIN CONTENT
    List of MeetingCards
      Each card:
        - Title
        - Start Date/Time
        - Invited count
        - Status: Upcoming / Live / Ended
      Actions:
        "View" → /meetings/[meetingId]
        "Enter Room" (if Live) → /meetings/[meetingId]/room

  PAGE: /educator/classes/[classId]/meetings/new
    MeetingForm:
      - Title (required)
      - Description (optional)
      - Start Date/Time (date-time picker)
      - Invite: "All students" toggle or student checklist
      "Save Meeting" button
        → On save: invited students notified

  PAGE: /educator/classes/[classId]/meetings/[meetingId]  — Meeting Detail
    - Meeting info (title, time, description)
    - InviteManager: list of invited students, add/remove invite
    - JoinRequestPanel: non-invited students who requested to join
        Each row: Student Name | "Accept" / "Decline" buttons
    - "Enter Room" button (enabled when start time reached)
      → navigates to /meetings/[meetingId]/room
    - "Edit" button (before meeting starts)

  PAGE: /educator/classes/[classId]/meetings/[meetingId]/room  — Live Meeting Room

    LAYOUT: Full-screen room (no sidebar, minimal topbar just with End Meeting)

    MeetingRoom component:
      Left/main area: VideoGrid (Agora video tiles, participants in grid)
      Right panel (toggleable): ChatPanel (socket.io messages, text input at bottom)
      Bottom toolbar:
        Mic toggle (mute/unmute self)
        Camera toggle (on/off)
        Screen Share button → ScreenShareOverlay activates
        Reactions button → ReactionBar (emoji reactions)
        Participants button → toggles ParticipantList panel
          ParticipantList: list of online users, hand-raised indicators, mute controls
        Lesson Presentation button → LessonPresentationView activates
          Shows lesson content full-screen to all participants
          Educator controls forward/back navigation — all participants follow live
        End Meeting button (educator only, top right) → ConfirmDialog → ends session

--------------------------------------------------------------------------------
--------------------------------------------------------------------------------
  D9. /educator/grading-scheme-library  — Personal Grading Scheme Library
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Grading Scheme Library"
    - Action: "+ New Template"

  MAIN CONTENT
    List of saved grading scheme templates
      Each: Template Name | Categories summary | Actions
      Actions: "Apply to Class" (opens class picker) | "Edit" | "Delete"
    "+ New Template" → GradingSchemeEditor modal with name field, save to library

--------------------------------------------------------------------------------
  D10. /educator/activity-log  — Activity Log
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Activity Log"
    - Filter: Class | Event Type | Date range

  MAIN CONTENT
    DataTable
      Columns: Timestamp | Event Type | Class | Details
    Pagination
