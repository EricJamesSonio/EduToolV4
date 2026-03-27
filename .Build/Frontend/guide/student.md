

================================================================================
  E. STUDENT PORTAL
================================================================================

URL PREFIX: /student
LAYOUT: Topbar + Sidebar + Content area

  SIDEBAR LINKS
    Classes     /student/classes
    Meetings    /student/meetings
    Transcript  /student/transcript

  PAGE: /student  (index)
    Auto-redirects to /student/classes

--------------------------------------------------------------------------------
  E1. /student/classes  — Enrolled Classes List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "My Classes"
    - Filter: Semester

  MAIN CONTENT
    Grid of class cards
      Each card:
        - Subject / Class Title
        - Educator name
        - Schedule
        - Semester / Term
        - "Open" → /student/classes/[classId]

--------------------------------------------------------------------------------
  E2. /student/classes/[classId]  — Class Overview
--------------------------------------------------------------------------------

  SUB-NAVIGATION (tabs)
    Overview  |  Lessons  |  Assessments  |  Attendance  |  Grades

  [Overview]
    - Class info (subject, educator, schedule)
    - Upcoming assessments (next 2–3 with release/end dates)
    - Latest grade summary (if published)

--------------------------------------------------------------------------------
  E3. /student/classes/[classId]/lessons  — Lesson List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Lessons"

  MAIN CONTENT
    Lesson list organized by week (read-only calendar view)
    Each lesson: Title, Week, "View" button

  PAGE: /student/classes/[classId]/lessons/[lessonId]  — Lesson Content Viewer
    - Lesson title
    - Lesson detail (full content, read-only)
    - No concept build visible to students
    - Navigation: "← Previous Lesson" / "Next Lesson →"

--------------------------------------------------------------------------------
  E4. /student/classes/[classId]/assessments  — Assessment List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Assessments"

  MAIN CONTENT
    DataTable or card list
      Columns/fields: Title | Type | Term | Release Date | End Date | Status | Score
      Status badge: Not Yet Open / Open / Submitted / Missed / Draft / Exempted
      Score: shown only if published by educator
      Actions:
        If status = Open: "Take Assessment" → /assessments/[assessmentId]
        If status = Submitted and score published: "View Result" → /assessments/[assessmentId]/result
        If status = Draft: "Resume" → /assessments/[assessmentId]

  PAGE: /student/classes/[classId]/assessments/[assessmentId]  — Assessment Taker

    LAYOUT: Clean focus mode (no sidebar during active attempt, or sidebar collapsed)

    PAGEHEADER
      - Title: [Assessment Title]
      - Timer display (countdown to End Date)

    AssessmentTaker:
      Question navigator (numbered sidebar or top strip)
        Each number: answered (filled) / unanswered / flagged
      Question area (main):
        Question text
        Answer input based on type:
          MCQ: radio buttons A/B/C/D
          True/False: True / False radio
          Identification: text input
          Enumeration: multiple text inputs (numbered)
          Essay: large textarea
      Navigation: "Previous" / "Next" buttons
      "Flag for Review" toggle per question
      Auto-save indicator: "All answers saved" or "Saving..."
        → Auto-saves on answer change (debounced)
        → Auto-saves on disconnect — progress restored on reconnect
      "Submit Assessment" button
        → ConfirmDialog: "Submit now? Unanswered: X questions."
        → On confirm: attempt marked Submitted
        → Redirects to result page (if score published) or confirmation page

    Attempt guard:
      On load: system checks for existing active attempt
      If existing: resumes from last saved state (no new attempt created)
      If submitted: read-only result view, no re-entry

  PAGE: /student/classes/[classId]/assessments/[assessmentId]/result  — Score View
    ResultView:
      - Score: [earned] / [total] (shown only if published)
      - Per-question breakdown (if enabled by educator)
      - Essay questions: pending or graded (shows feedback if provided)
      - "Back to Assessments" link

--------------------------------------------------------------------------------
  E5. /student/classes/[classId]/attendance  — Own Attendance View
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "My Attendance"

  MAIN CONTENT
    Read-only weekly view
    Table: Week | Session | Date | Status (Present / Absent / Late / Excused)
    Summary row: totals per status type

--------------------------------------------------------------------------------
  E6. /student/classes/[classId]/grades  — Published Grades View
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "My Grades"

  MAIN CONTENT
    GradeCard per term (Prelim, Midterm, etc.)
      Each card:
        - Term name
        - Per-assessment scores (only published ones visible)
        - Manual category scores (if published)
        - Computed term grade (shown only after grade lock)
    Final Subject Grade: shown only after grade lock
      Includes grade value, remark (Passed/Failed), grading scale label

--------------------------------------------------------------------------------
  E7. /student/meetings  — Meeting List
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Meetings"

  MAIN CONTENT
    List of meetings student is invited to + public meetings in their classes
    Each row: Title | Class | Start Time | Status | Action
    Status: Upcoming / Live / Ended
    Action:
      Invited + Live: "Join" → /meetings/[meetingId]/room
      Not invited: "Request to Join" button
        → Sends join request to educator
        → Button changes to "Request Sent" (pending)
      Ended: "View Details" (no room access)

  PAGE: /student/meetings/[meetingId]  — Meeting Detail
    - Meeting title, description, start time, class
    - If invited: "Join Room" button (enabled when live)
    - If not invited: "Request to Join" button / pending state

  PAGE: /student/meetings/[meetingId]/room  — Live Meeting Room
    Same MeetingRoom layout as educator but with student controls:
      Mic, Camera, Screen Share (if allowed), Reactions, Participants list
      No "End Meeting" button (educator-only)
      No lesson navigation controls (educator-only — student view follows)
      JoinRequestButton: not present (student is already in)

--------------------------------------------------------------------------------
  E8. /student/transcript  — Full Transcript
--------------------------------------------------------------------------------

  PAGEHEADER
    - Title: "Transcript"

  MAIN CONTENT
    TranscriptViewer:
      Grouped by: School Year → Semester → Term → Subject
      Each entry: Subject Name | Term Grade | Final Subject Grade | Grading Scale Remark | Status
      Collapse/expand per school year
      Print button (browser print or PDF export)
