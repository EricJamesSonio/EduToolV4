================================================================================
  2. DATA ISOLATION — MULTI-TENANT BOUNDARY
================================================================================

Every Admin account owns exactly one Organization. All data created inside
that org — students, educators, classes, subjects, sections, rubrics, semester
settings, grading scales, school years, calendar events, assessments, grades,
transcripts, and audit logs — is strictly scoped to that org and is never
visible, accessible, or shared with any other org or Admin.

This is an absolute system-level boundary. It is not a permission setting —
it cannot be toggled or overridden by any Admin. The Platform Owner has no
access to org-internal data either — their scope is Admin account
management only (see Section 3).

--------------------------------------------------------------------------------
  2.1  What Is Isolated Per Org
--------------------------------------------------------------------------------

  The following are fully isolated per org. An Admin in Org A will never see,
  search, or accidentally access anything belonging to Org B:

  Accounts:
    - Student accounts (profiles, statuses, IDs, sections, enrollments)
    - Educator accounts (profiles, IDs, class assignments)

  Academic Structure:
    - School years and their configuration
    - Level defaults and level structure
    - Programs, courses, strands (including custom programs)
    - Sections and their capacities
    - Subjects and subject-level grading system assignments
    - Classes (schedule, enrollment, capacity)
    - Semester settings and term configurations

  Grading and Assessment:
    - Rubric templates (Admin default rubric and educator rubric libraries)
    - Grading scales per level section
    - All assessment content, scores, and grades
    - Student transcripts and grade history

  Configuration and Logs:
    - Academic calendar events
    - Notification history
    - Admin Audit Log
    - Educator Activity Logs

--------------------------------------------------------------------------------
  2.2  Enforcement Rules
--------------------------------------------------------------------------------

  - All database queries are scoped to the authenticated Admin's org_id.
    No cross-org query is possible through any UI action.

  - An Admin performing any search (students, educators, classes, rubrics,
    semester templates, etc.) will only ever see records belonging to their
    own org. There are no global search results for Admin-level queries.

  - Educator rubric libraries are private to each educator within their org
    and are invisible to educators in other orgs.

  - Semester setting templates created by one Admin are not shared as
    system-wide templates — they exist only within that Admin's org.

  - Grading scales configured by Admin are scoped to their org's level
    sections only and have no effect on any other org.

  - Student IDs and Educator IDs are unique within an org, not globally.
    Two orgs may use the same ID values without any conflict.

  - Section names, class titles, and subject names are local to the org.
    Identical names in two orgs are entirely independent records.

--------------------------------------------------------------------------------
  2.3  Platform Owner Scope Boundary
--------------------------------------------------------------------------------

  The Platform Owner only knows that an Admin account exists — because they
  created it. They cannot see the org's name, structure, students, grades,
  or any internal data. Their scope ends entirely at the Admin account.
  See Section 3 for full Platform Owner capabilities.