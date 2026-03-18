================================================================================
  23. AUDIT LOGS
================================================================================

  EduTool maintains two tiers of activity logs — Admin-level and
  Educator-level — stored permanently and never deleted.

--------------------------------------------------------------------------------
  23.1  Admin Audit Log
--------------------------------------------------------------------------------

  Records high-impact administrative actions across the org.

  Logged Actions:
    - Student profile changes (field, old value, new value)
    - Account status changes (Active / Dropped / Suspended / etc.)
    - Subject enrollment changes (add / remove)
    - Educator class assignment changes (add / remove / reassign)
    - Section capacity overflow decisions (new section created / student pending)
    - Class capacity overflow decisions (new session added / student pending)
    - Password resets (who was reset, by whom)
    - Grade lock override actions (Admin-initiated)
    - Academic calendar event creation and modification

  Log Fields:
    Timestamp     |  Actor (Admin)  |  Action Type  |  Target Entity  |  Details

  Admin can filter and search the audit log by date, action type, or
  target entity (Student ID, Educator ID, class, etc.).

--------------------------------------------------------------------------------
  23.2  Educator Activity Log
--------------------------------------------------------------------------------

  Records class-level events scoped to each educator's classes.
  Educators see only their own class logs.

  Logged Events:
    - New student enrolled in class (by Admin)
    - Student removed from class (by educator or Admin)
    - Meeting started / ended
    - Assessment created, edited, published, deleted
    - Scores published / unpublished
    - Grade locked (by educator or auto-lock)
    - Lesson created or updated
    - Concept extraction triggered / completed

  Log Fields:
    Timestamp  |  Event Type  |  Details  |  Class

  Educator Activity Logs are also visible to Admin for oversight.