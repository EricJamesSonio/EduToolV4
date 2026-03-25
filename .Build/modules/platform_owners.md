================================================================================
  EDUTOOL — PLATFORM OWNER LEVEL
  Role reference extracted from System Planning Document v8.3
================================================================================


================================================================================
  OVERVIEW
================================================================================

The Platform Owner is the EduTool team. Their sole responsibility is managing
Admin accounts. They have no visibility into any organization's internal data —
no students, no grades, no classes, no structure of any kind. They simply
provision and maintain the Admin accounts that schools use to access the
platform.

  Scope boundary:
    Platform Owner scope ends at the Admin account itself.
    Everything inside an org belongs entirely to that org's Admin.


================================================================================
  CAPABILITIES
================================================================================

  Admin Account Management (the full and only scope):
    - Create new Admin accounts (one per school).
    - View all existing Admin accounts and their credentials.
    - View a specific Admin's password in plain text — for distributing
      login credentials to the school client.
    - Copy Admin account credentials for distribution.
    - Reset an Admin's password.
    - Block an Admin account (disables login; the org is unaffected).
    - Unblock a blocked Admin account.

  NOTE: Platform Owner cannot see, enter, or manage any organization's
        internal data — no students, no educators, no classes, no grades,
        no structure, no logs.


================================================================================
  SCHOOL ONBOARDING FLOW
================================================================================

  Step 1  School negotiates with the platform owner (us).
  Step 2  Platform owner manually creates one Admin account for the school.
  Step 3  Admin logs in and sets up their org independently from this point.
  Step 4  Platform owner's involvement ends. The org belongs to the Admin.

  NOTE: One Admin account per school. One org per Admin account.


================================================================================
  DATA ISOLATION — WHAT PLATFORM OWNER CANNOT SEE
================================================================================

  The Platform Owner only knows that an Admin account exists because they
  created it. They cannot see or access any of the following:

    - The org's name or description
    - School years, level structure, programs, courses, strands
    - Sections and their capacities
    - Student accounts, profiles, statuses, or transcripts
    - Educator accounts or class assignments
    - Subjects, classes, schedules
    - Semester settings or term configurations
    - Rubric templates or grading scales
    - Assessment content, scores, or grades
    - Academic calendar events
    - Audit logs or notification history

  The isolation boundary is absolute and cannot be toggled or overridden.


================================================================================
  WHAT PLATFORM OWNER DOES NOT DO
================================================================================

    - Does not manage org structure (that is the Admin's job).
    - Does not unlock grades (Admin handles this directly with full authority).
    - Does not access or resolve enrollment conflicts.
    - Does not interfere with any org-internal operation.


================================================================================
  EduTool  •  Platform Owner Level  •  v8.3
================================================================================