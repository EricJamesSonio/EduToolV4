================================================================================
  16. GRADE MANAGEMENT  (Educator)
================================================================================

--------------------------------------------------------------------------------
  16.1  Grading by Terms
--------------------------------------------------------------------------------

  Grading is tracked per term within each semester. Each term (e.g. Prelim,
  Midterm, Pre-Finals, Finals) has its own set of assessments and produces
  its own term grade.

  At the end of the semester, the student's overall subject grade is computed
  from all term grades:

  Example (4 terms, equal weight):
    Prelim = 89  |  Midterm = 90  |  Pre-Finals = 88  |  Finals = 80
    Overall Subject Grade = average (or weighted, per rubric config) = 86.75

  The grade view is organized by term. Educators navigate between terms
  to view and manage assessments and scores.

--------------------------------------------------------------------------------
  16.2  Rubric System
--------------------------------------------------------------------------------

  Admin default rubric
    Admin configures a default rubric for the org. Pre-filled at class
    creation. Educator can adjust or replace it.

  Educator rubric library
    Personal per educator. Saved reusable sets. Built over time.

  Applying a rubric at class creation:
    (a) Use the Admin default
    (b) Pick from personal library
    (c) Build from scratch

  Lock rule     Rubric locks permanently once first student is enrolled.
  Validation    All weights must total exactly 100%.

  NOTE: Grading system (rubric weights and categories) can vary per subject.
        General subjects may have different weights than major subjects.
        See Section 9.1 for subject-level grading system assignment.

  Admin Default Rubric Example:
    Activities       20%   Assessment-linked  (auto-pulls from assessments)
    Quizzes          20%   Assessment-linked
    Exams            25%   Assessment-linked
    Attendance       10%   Manual entry
    Behavior         10%   Manual entry
    Recitation       10%   Manual entry
    Participation     5%   Manual entry
    Total           100%

--------------------------------------------------------------------------------
  16.3  Student Grade Visibility
--------------------------------------------------------------------------------

  Assessment scores       Visible only after educator publishes them.
  Final computed grade    Hidden until class grades are locked.
  On grade lock           ALL scores auto-published + final grade revealed.
  Essay pending           Score shows as incomplete until essay is graded.

--------------------------------------------------------------------------------
  16.4  Grade Display Modes  (Educator View)
--------------------------------------------------------------------------------

  Educators can switch between two views:

  Default View:
    Shows each student's scores per individual assessment item, grouped
    by assessment type. Scores display as earned/total (e.g. 19/20).
    Organized by term (Prelim, Midterm, etc.).

    Example (Prelim term):
      Name     Act 1   Act 2   Quiz 1  Quiz 2   Exam   Behavior  Attend  Recit  Grade
      Stud 1   19/20   21/30   11/20   19/20   45/50   80/100    5/14   90/100   94

  Clean View:
    Groups assessments by category. If a category has more than one
    assessment, scores are aggregated (sum of earned / sum of total).
    Organized by term.

    Example (Prelim term):
      Name     Activities  Quizzes  Exam   Behavior  Attend  Recit  Grade
      Stud 1   40/50       30/40   45/50   80/100    5/14   90/100   94

  Both views are organized by term. Educator can switch between them freely.

--------------------------------------------------------------------------------
  16.5  Grade Locking
--------------------------------------------------------------------------------

  Admin enables lock window    Admin sets a deadline (e.g. 24 hours).
  Educator locks manually      Permanent — no unlocking without platform override.
  On lock                      All unpublished scores published. Final grade
                               revealed to students.
  Auto-lock on deadline        System auto-locks if educator missed deadline.
  After lock                   Grades frozen. Read-only for everyone.
  Grade lock override          Admin can unlock grades directly in extreme cases
                               without any external approval — Admin has full authority.

  WARNING: If Essay items are ungraded when locking, system warns but allows.
  Educator takes full responsibility.