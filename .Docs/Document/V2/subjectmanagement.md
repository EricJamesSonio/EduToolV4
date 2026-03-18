================================================================================
  9. SUBJECT MANAGEMENT  (Admin)
================================================================================

  Property          Details
  ----------------  ------------------------------------------------------------
  Title             e.g. Data Structure, Biology
  Year/Grade Level  e.g. 1st Year, Grade 11
  Assigned Educator Who teaches this subject
  Grading System    Which grading system applies to this subject (see Sec. 8.1)

  NOTE: Subjects do NOT contain weekday or time schedule. Scheduling (weekday
        and time) is configured at the Class level, not the Subject level.
        This is because the same subject may be taught to multiple sections at
        different times. Each class instance has its own schedule.

  Multiple Classes per Subject:
    A single subject can have multiple class instances (e.g. Section A at
    8 AM Mon/Wed and Section B at 10 AM Tue/Thu). Each class has its own
    weekday(s) and time. See Section 10 for class configuration.

  Lock/Unlock Cycle:
    Start of year       Unlocked — Admin edits freely.
    Enrollment trigger  Admin manually locks. Subjects become read-only.
    New school year     Automatically unlocks again.

  Schedule Conflict Validation (handled at Class level, not Subject level):
    Type 1  Two classes in same level cannot share time slot on same day
            for the same section.
    Type 2  Educator cannot be assigned to two classes at the same time
            across any year level.

--------------------------------------------------------------------------------
  9.1  Grading System per Subject
--------------------------------------------------------------------------------

  Different subjects within the same school may follow different grading
  systems. For example, general subjects may use a different rubric and
  weight distribution than major subjects.

  Admin assigns a grading system to each subject individually. This allows:
    - General subjects → their own rubric (e.g. Activities 30%, Exams 40%)
    - Major subjects   → their own rubric (e.g. Lab Work 25%, Exams 35%)
    - Any subject      → its own independently configured weight set

  The grading system assigned to a subject is inherited by all classes
  created for that subject, but can be adjusted at the class level by
  the Educator within the rules of the rubric system (see Section 16).