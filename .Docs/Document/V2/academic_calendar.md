================================================================================
  8. ACADEMIC CALENDAR  (Admin)
================================================================================

  Admin manages an org-wide academic calendar per school year. This is
  optional but recommended. It affects lesson scheduling, attendance, and
  meeting behavior across all classes.

--------------------------------------------------------------------------------
  8.1  Calendar Event Types
--------------------------------------------------------------------------------

  Event Type      Effect on Classes
  --------------  --------------------------------------------------------------
  Holiday         Class sessions scheduled on this date are skipped.
                  Attendance record is not created for that session.
                  Lesson scheduling shifts automatically.
  No Class Day    Same behavior as Holiday — sessions skipped.
  Exam Week       Advisory only. No automatic session changes. Informs
                  educators of the exam period for planning.
  Special Event   Informational only. No scheduling effect.

--------------------------------------------------------------------------------
  8.2  System Behavior on Event Days
--------------------------------------------------------------------------------

  - Attendance sessions that fall on a Holiday or No Class Day are
    automatically skipped — no record is created, no mark needed.
  - Lesson week assignments adjust so that skipped sessions don't
    create gaps in the week numbering sequence.
  - Meeting reminders and notifications are suppressed on event days.
  - Educators are NOT required to manually adjust their schedules for
    declared calendar events.

  NOTE: If a calendar event is added retroactively (after sessions have
        already been created), Admin is warned that past records may need
        manual review.