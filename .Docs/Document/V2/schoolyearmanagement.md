================================================================================
  6. SCHOOL YEAR MANAGEMENT  (Admin)
================================================================================

  Admin manages school years within the organization. Multiple school years
  can exist simultaneously:

  Status      Meaning
  ----------  -----------------------------------------------------------------
  Pending     A future school year planned in advance. Admin can pre-configure
              structure, subjects, and classes ahead of time.
  Active      The current running school year. Only one Active year at a time.
  Ended       A completed school year. Fully archived and read-only.

  Example School Years:
    Title: School Year 2025-2026  |  Status: Ended
    Title: School Year 2026-2027  |  Status: Active
    Title: School Year 2027-2028  |  Status: Pending

  When a new school year is created, it inherits from the org's Level Defaults
  as a starting template. Admin can then modify the new year's structure
  without affecting the defaults or any past years.

  Carries Over from Previous Year       Resets / Unlocks for New Year
  ------------------------------------  ----------------------------------------
  Level sections and structure          Schedules — rebuilt fresh
  Sections (all levels)                 Subjects — unlocked until enrollment
  Courses, strands, programs            Classes — created fresh
  Semester setting selections           Grade locks — all start unlocked
  Educator accounts
  Student accounts (with statuses)

  NOTE: All past school years permanently archived and read-only. Students
        can view full grade history across all years.