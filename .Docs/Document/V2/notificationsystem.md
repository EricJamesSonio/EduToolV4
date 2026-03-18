================================================================================
  20. NOTIFICATION SYSTEM
================================================================================

  In-app only. No email or SMS. Simple list — no read/unread tracking.

  Trigger                               Recipient         When
  ------------------------------------  ----------------  ----------------------
  Concept extraction complete           Educator          Job finishes
  Assessment generation complete        Educator          Job finishes
  Assessment released                   Assigned students Release date reached
  Assessment deadline approaching       Assigned students Before end date
  Score published                       Student           Educator publishes
  Grades locked — scores visible        Students in class Grade lock applied
  Class reassigned                      New educator      Admin reassigns class
  Meeting created                       Invited students  On creation
  Grade lock window opened              All educators     Admin enables window
  Auto-lock applied                     Affected educator Class auto-locked
  Enrolled in subject/class             Student           On enrollment
  Student added to class by Admin       Educator          Admin adds student
  Student removed from class by Admin   Educator          Admin removes student
  Enrollment pending (capacity full)    Admin             On capacity block

  Retention Policy:
    Notifications older than 90 days are archived automatically.
    Archived notifications are removed from the active list but retained
    in internal logs. They are not visible to users after archiving.