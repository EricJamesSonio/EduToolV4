================================================================================
  10. CLASS MANAGEMENT  (Admin & Educator)
================================================================================

Admin creates class structure. Educator manages all content inside.

--------------------------------------------------------------------------------
  10.1  Admin — Class Setup Properties
--------------------------------------------------------------------------------

  Title, Level Section, Course/Strand/Program (if applicable),
  Year/Grade Level, Section (optional — target specific section),
  Semester, Term (within that semester), School Year,
  Assigned Educator, Weekday(s), Time

  Weekday(s) and Time:
    Admin selects one or more weekdays for the class (e.g. Mon only,
    Mon+Wed+Fri, Mon through Fri for daily classes). Up to 5 days/week.
    Each class instance has its own independent schedule.

  Section Targeting:
    Admin can optionally assign a class to a specific section.
    If a section is specified, enrollment filters to students in that
    section only. If no section is set, all matching students at that
    level are eligible.

  Capacity:
    Limited (hard cap set by Admin) or Unlimited.
    When capacity is reached and more eligible students exist, see
    Section 10.2 for the overflow handling flow.

--------------------------------------------------------------------------------
  10.2  Enrollment and Class Capacity Enforcement
--------------------------------------------------------------------------------

  Students are enrolled in classes by Admin — either through the
  subject assignment flow (see Section 11.3) or directly per student.
  Educators do NOT add students to classes.

  Enrollment Matching Logic:
    When Admin enrolls a student in a subject/class, the system validates:
      - Level Section matches the student's Level Section
      - Year/Grade Level matches the student's Year/Grade Level
      - Course/Strand/Program matches, if applicable
      - Section matches, if the class has a section assigned
      - Student's account status is Active

    Only Active students can be enrolled.

  Class Capacity Overflow:
    If enrollment would exceed a class's capacity limit:
      - System prompts Admin: "Class [Title] is full ([N] students). Add
        another session to split the load, or leave the student pending
        enrollment?"
      - If Admin adds a session: a new parallel class is created with the
        same subject and settings but a different or additional weekday/time.
        The overflow student(s) are enrolled in the new class.
      - If Admin declines: the student is marked as Pending Enrollment for
        that subject. Admin must resolve before the student can access it.
      - Logged in the Admin Audit Log.

  Duplicate Prevention:
    System blocks enrollment if the student is already enrolled in a class
    for the same subject in the same semester.

  Late Student Additions:
    If a student is enrolled mid-semester, the educator must manually assign
    a status (NULL, Exempted, or Custom Score) for each past assessment the
    student missed.

  Removal:
    Educator can manually remove a student from a class if needed
    (e.g. wrong section, transfer). Removal is logged in the Educator
    Activity Log.

  NOTE: Changes to a student's profile (e.g. section, strand, year level)
        do NOT automatically re-enroll the student in subjects. Subject
        enrollment is managed explicitly by Admin.

--------------------------------------------------------------------------------
  10.3  Week Computation  (by calendar week, not session count)
--------------------------------------------------------------------------------

  Single weekday:               Week 1, Week 2, Week 3 ...
  Two weekdays (e.g. Mon+Fri):  Week 1.1, Week 1.2, Week 2.1, Week 2.2 ...
  Three weekdays:               Week 1.1, Week 1.2, Week 1.3, Week 2.1 ...
  Four weekdays:                Week 1.1, Week 1.2, Week 1.3, Week 1.4 ...
  Five weekdays (daily):        Week 1.1 through Week 1.5, Week 2.1 ...

  The week label reflects the calendar week. Each session within that week
  gets a sub-index (1.1, 1.2, etc.) ordered by weekday.
  Sessions that fall on Academic Calendar event days are skipped and do not
  consume a week index.

--------------------------------------------------------------------------------
  10.4  Class Archiving
--------------------------------------------------------------------------------

  Admin manually closes and archives at end of semester. Read-only after.
  Records are soft-deleted — invisible in active UI but permanently stored
  in the database. See Section 22 for soft delete policy.

--------------------------------------------------------------------------------
  10.5  Educator Reassignment Mid-Semester
--------------------------------------------------------------------------------

  When Admin reassigns a class to a new educator mid-semester:

  The new educator inherits:
    - All lessons and concept builds
    - All assessments (including generated questions)
    - All grading responsibilities (including ungraded essays)
    - All unpublished scores
    - All attendance records

  Historical Attribution:
    Scores and grades already recorded remain attributed to the educator
    who graded them at the time. Attribution is never modified retroactively.

  Ownership History Log (on every reassignment):
    - Original educator name, period (from → to date)
    - Reason for reassignment (optional Admin note)
    - New educator name and start date
    - Complete audit trail — never deleted