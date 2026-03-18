================================================================================
  5. ORGANIZATION STRUCTURE
================================================================================

--------------------------------------------------------------------------------
  5.1  Organization Overview
--------------------------------------------------------------------------------

  An Organization contains:
    - School Years           History of past, current, and future planned years.
    - Level Defaults         Base template for level structure reused each year.
    - Programs               All academic programs the school runs.
    - Educators List         All educators in the org.
    - Students List          All students enrolled in the org.

--------------------------------------------------------------------------------
  5.2  Level Defaults (Org-Wide Template)
--------------------------------------------------------------------------------

  Admin defines a default level structure for the org. This serves as the base
  template applied when a new school year is created — eliminating the need to
  rebuild the structure from scratch each year.

  If changes are needed for a new year, Admin can:
    (a) Update the level defaults so all future years inherit the change.
    (b) Manually adjust the specific school year's structure without
        touching the defaults.

  Level defaults cover all programs the school operates. See Section 5.3
  for program types and their structure.

  Default Level Structure Example:

  ELEMENTARY
    Day Care
    Kinder
    Grade 1  →  Sections: A, B
    Grade 2  →  Sections: A, B
    Grade 3  →  Sections: A, B
    Grade 4  →  Sections: A, B
    Grade 5  →  Sections: A, B
    Grade 6  →  Sections: A, B

  HIGH SCHOOL
    Grade 7   →  Sections: A, B
    Grade 8   →  Sections: A, B
    Grade 9   →  Sections: A, B
    Grade 10  →  Sections: A, B

  SENIOR HIGH SCHOOL
    Strands:
      GAS   →  Sections: A, B  (Grades 11 & 12)
      ABM   →  Sections: A, B
      STEM  →  Sections: A, B
    Grade 11
    Grade 12

  COLLEGE
    Courses:
      BSCS  →  4 years  →  Sections per year: A, B
      ICT   →  2 years  →  Sections per year: A, B
      BSTM  →  4 years  →  Sections per year: A, B

  PROGRAMS  (Admin-defined, e.g. TESDA Programs)
    TechVoc  →  3 years  →  Sections per year: A, B
    (Admin can add any number of custom programs)

  NOTE: Section names shown above are defaults only — editable by Admin.
        Naming schemes vary per school (letters, trees, numbers, custom names).
        No auto-naming is performed. See Section 5.4 for section rules.

--------------------------------------------------------------------------------
  5.3  Programs
--------------------------------------------------------------------------------

  EduTool supports multiple program types under one organization. Admin can
  configure as many programs as the school runs.

  Built-in Program Types:
    Elementary          Grade levels: Day Care, Kinder, Grade 1–6
    High School         Grade levels: Grade 7–10
    Senior High School  Grade levels: Grade 11–12 under defined Strands
    College             Year levels 1–N under defined Courses

  Custom Programs (Admin-defined):
    Admin can add custom programs such as "TESDA Programs" which may contain
    courses like TechVoc. These follow the same course/year/section structure
    as College programs but under a separately labeled program group.

  Each program independently selects its own Semester Setting per school year.
  See Section 7 for semester configuration.

  Program / Course Properties:
    Title               e.g. BSCS, TechVoc, STEM
    Description         Full name
    Max Year/Grade      How many year/grade levels exist under this program
    Semester Setting    Which semester template this course/strand follows
    Educators           Assigned educators
    Subjects            Organized by year/grade level
    Schedules           Auto-generated from classes

--------------------------------------------------------------------------------
  5.4  Sections
--------------------------------------------------------------------------------

  All level sections support named Sections at each grade/year level.
  Sections are created and managed by Admin.

  Section Properties:
    Name              e.g. Section A, Block A, Narra
    Level Section     Which level section this belongs to
    Grade/Year Level  Which specific grade or year
    Course/Strand     For Senior High and College/programs only
    Capacity          Maximum number of students allowed in this section

  Section Capacity Enforcement:
    When a student is assigned to a section (on account creation or profile
    update), the system checks the section's current headcount against its
    capacity limit.

    If capacity is reached:
      - System prompts Admin with two options:
          (A) Create a new section
          (B) Leave student with no section for now (Pending)

      - If Admin chooses (A): Admin is shown a creation form pre-filled with
        the same Level Section, Grade/Year Level, Course/Strand, and Capacity
        as the full section. Admin provides a custom name — no auto-naming.
        The new section is created and the student is assigned to it.

      - If Admin chooses (B): student is saved with no section assigned.
        Student status is set to Pending until Admin manually assigns a section.

      - Logged in the Admin Audit Log.

  NOTE: Section names are always fully custom — Admin names every section
        manually. No automatic name generation is performed because naming
        schemes vary (letters, trees, numbers, fully custom).

  NOTE: Sections are organizational groupings for students ONLY. A student's
        section does NOT automatically determine what subjects they are enrolled
        in. Subject enrollment is independent. See Section 11.

  NOTE: Classes remain independently configured by Admin. A section is NOT
        automatically a class.