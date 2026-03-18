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