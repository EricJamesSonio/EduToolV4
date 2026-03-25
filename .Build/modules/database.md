================================================================================
  EDUTOOL — DATABASE DESIGN DOCUMENT
  Relational schema, isolation model, inheritance, and security
  Based on System Planning Document v8.3
================================================================================


================================================================================
  PART 1 — DESIGN PHILOSOPHY
================================================================================

  Before listing tables, it helps to understand the four core principles that
  every design decision here follows.

  1. ORG ISOLATION IS THE FOUNDATION
     Every single table that holds school data carries an org_id column.
     No query ever returns data across org boundaries. This is enforced at
     the database level (row-level security) and at the application level
     (every query is scoped). It is not just a WHERE clause that developers
     remember to add — it is a structural guarantee.

  2. SOFT DELETES EVERYWHERE FOR ACADEMIC RECORDS
     Grades, scores, submissions, enrollments, lessons, assessments, and
     meetings are never hard-deleted. They get a deleted_at timestamp and
     disappear from active views, but the data stays in the database forever.
     This protects transcripts, audit trails, and dispute resolution.

  3. INHERITED STRUCTURE, EXPLICIT ENROLLMENT
     Level defaults flow into school years as a template. School years contain
     their own copy of the structure — changes to the default do not alter
     past years. Students belong to a section (organizational grouping) but
     subject enrollment is a separate, explicit action by Admin. Section
     membership never auto-enrolls anyone.

  4. IMMUTABLE ATTRIBUTION
     Any grade or score already saved is attributed to the educator who
     entered it at that time. Reassigning a class mid-semester does not
     change existing attribution records. The audit log is append-only.


================================================================================
  PART 2 — TOP-LEVEL ISOLATION TABLES
================================================================================

  These tables sit at the very top of the hierarchy. Everything else
  references down from here.

--------------------------------------------------------------------------------
  platform_admins
--------------------------------------------------------------------------------

  Purpose:
    Stores the Admin accounts managed by the Platform Owner. This table is
    the only thing the Platform Owner ever touches. It has no org_id because
    it lives above the org layer.

  Columns:
    id                  UUID, primary key
    email               TEXT, unique — login identifier
    password_hash       TEXT — hashed password
    full_name           TEXT
    is_blocked          BOOLEAN, default false — Platform Owner can flip this
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Why no org_id here:
    The platform admin account exists before the org does. The org is created
    by the admin after first login. The link goes the other way — the org
    points back to this record.

  Security note:
    The Platform Owner needs to view the plain-text password for credential
    distribution. The application layer stores a separate plain_password field
    (or a reversibly-encrypted copy) in addition to the bcrypt hash. This is
    intentional by design — Admin accounts are provisioned and distributed
    manually. This column must be access-controlled strictly to Platform Owner
    endpoints only and never exposed to any other role.

--------------------------------------------------------------------------------
  organizations
--------------------------------------------------------------------------------

  Purpose:
    The top-level container for all school data. One org per admin account.

  Columns:
    id                  UUID, primary key
    admin_id            UUID, foreign key → platform_admins.id, unique
    name                TEXT
    description         TEXT
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Why unique on admin_id:
    Enforces the one-org-per-admin rule at the database level, not just
    application logic. If application code ever has a bug, the DB constraint
    catches it.

  All tables below this point carry org_id → organizations.id.
  That column is NEVER NULL on any school data table.


================================================================================
  PART 3 — ACADEMIC STRUCTURE TABLES
================================================================================

  These tables define the skeleton of a school. They are set up by Admin
  and inherited by school years.

--------------------------------------------------------------------------------
  level_defaults
--------------------------------------------------------------------------------

  Purpose:
    The org's master template for level structure. When Admin creates a new
    school year, the system copies this template into that school year's
    structure. Changes to level_defaults do not retroactively affect existing
    school years.

  Columns:
    id                  UUID, primary key
    org_id              UUID, foreign key → organizations.id, NOT NULL
    program_type        ENUM('elementary','high_school','senior_high',
                             'college','custom')
    program_label       TEXT — e.g. "TESDA Programs", "College", "Elementary"
    created_at          TIMESTAMP

  One row per program type per org. The children (courses, strands, grade
  levels, default sections) hang off this record.

--------------------------------------------------------------------------------
  level_default_courses
--------------------------------------------------------------------------------

  Purpose:
    Courses or strands inside a level default (e.g. BSCS, STEM, TechVoc).
    For elementary and high school, this table is not used — those levels
    have no course/strand subdivision.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    level_default_id    UUID, foreign key → level_defaults.id
    title               TEXT — e.g. "BSCS", "STEM", "TechVoc"
    description         TEXT
    max_years           INTEGER — how many year/grade levels this course has
    created_at          TIMESTAMP

--------------------------------------------------------------------------------
  level_default_sections
--------------------------------------------------------------------------------

  Purpose:
    Default section names per grade/year level inside a course or directly
    under a level (for elementary/high school). These are the seed names
    that get copied when a new school year is created. Admin edits them
    freely here without affecting any existing school year.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    level_default_id    UUID, foreign key → level_defaults.id
    course_id           UUID, nullable, foreign key → level_default_courses.id
    grade_year_level    TEXT — e.g. "Grade 3", "Year 2", "Grade 11"
    name                TEXT — e.g. "A", "B", "Narra"
    default_capacity    INTEGER
    created_at          TIMESTAMP

--------------------------------------------------------------------------------
  school_years
--------------------------------------------------------------------------------

  Purpose:
    Represents one academic year within the org. Can be Pending (future),
    Active (current), or Ended (archived). Past school years are read-only.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    title               TEXT — e.g. "School Year 2026-2027"
    status              ENUM('pending','active','ended'), default 'pending'
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Constraint:
    Only one row per org_id can have status = 'active' at any time.
    This is enforced with a partial unique index:
      UNIQUE (org_id) WHERE status = 'active'

--------------------------------------------------------------------------------
  programs
--------------------------------------------------------------------------------

  Purpose:
    The live copy of a program for a specific school year. Created from
    level_defaults when a new school year is set up. Exists independently
    of the default after creation — changes to the default do not affect
    existing programs.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    school_year_id      UUID, foreign key → school_years.id
    program_type        ENUM('elementary','high_school','senior_high',
                             'college','custom')
    program_label       TEXT
    semester_setting_id UUID, nullable, foreign key → semester_settings.id
    created_at          TIMESTAMP

--------------------------------------------------------------------------------
  courses
--------------------------------------------------------------------------------

  Purpose:
    Live courses or strands under a program for a specific school year.
    Copied from level_default_courses but exist independently after creation.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    program_id          UUID, foreign key → programs.id
    school_year_id      UUID, foreign key → school_years.id
    title               TEXT
    description         TEXT
    max_years           INTEGER
    created_at          TIMESTAMP

--------------------------------------------------------------------------------
  sections
--------------------------------------------------------------------------------

  Purpose:
    Named groupings of students within a grade/year level (and optionally
    a course). Sections are purely organizational — they do NOT determine
    subject enrollment. A student's section assignment and their subject
    enrollment are two completely separate things.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    school_year_id      UUID, foreign key → school_years.id
    program_id          UUID, foreign key → programs.id
    course_id           UUID, nullable, foreign key → courses.id
    grade_year_level    TEXT — e.g. "Grade 7", "Year 2"
    name                TEXT — e.g. "Narra", "Block A", "Section 1"
    capacity            INTEGER
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Why capacity lives here and not on students:
    Capacity is a property of the container, not the occupant. When checking
    if a student can be assigned to a section, the system counts current
    active students against this number.


================================================================================
  PART 4 — SEMESTER AND TERM TABLES
================================================================================

  Semesters and terms are configured per program. Different programs in the
  same org can run on completely different semester structures.

--------------------------------------------------------------------------------
  semester_settings
--------------------------------------------------------------------------------

  Purpose:
    Reusable semester templates created by Admin. Each template defines
    up to 3 semesters. Programs select from these templates per school year.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    title               TEXT — e.g. "Standard 2-Semester", "TESDA Year Plan"
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Isolation note:
    org_id ensures these templates are never visible to other orgs.
    There are no global/shared semester templates on the platform.

--------------------------------------------------------------------------------
  semesters
--------------------------------------------------------------------------------

  Purpose:
    Individual semesters within a semester_setting. Up to 3 per setting.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    semester_setting_id UUID, foreign key → semester_settings.id
    label               TEXT — e.g. "1st Semester", "2nd Semester"
    start_date          DATE
    end_date            DATE
    sort_order          INTEGER — 1, 2, 3

  Constraint:
    No two semesters within the same setting may have overlapping date ranges.
    Enforced at the application level with a validation check before save,
    and reinforced by a check constraint or trigger at the DB level.

--------------------------------------------------------------------------------
  terms
--------------------------------------------------------------------------------

  Purpose:
    The subdivisions within a semester (e.g. Prelim, Midterm, Pre-Finals,
    Finals). Fully customizable per semester — schools can have 2, 3, or 4
    terms, with any labels they choose.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    semester_id         UUID, foreign key → semesters.id
    label               TEXT — e.g. "Prelim", "Midterm", "Term 1"
    sort_order          INTEGER — determines display order
    created_at          TIMESTAMP


================================================================================
  PART 5 — ACADEMIC CALENDAR
================================================================================

--------------------------------------------------------------------------------
  calendar_events
--------------------------------------------------------------------------------

  Purpose:
    Org-wide events per school year. Holidays and No Class Days automatically
    skip class sessions. Other types are advisory only.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    school_year_id      UUID, foreign key → school_years.id
    event_type          ENUM('holiday','no_class_day','exam_week',
                             'special_event')
    title               TEXT
    date                DATE
    notes               TEXT, nullable
    created_at          TIMESTAMP
    updated_at          TIMESTAMP


================================================================================
  PART 6 — ACCOUNTS
================================================================================

  There are three account types that exist within an org: educators and
  students (both created by Admin) and the Admin itself (linked via
  organizations.admin_id). All three are org-scoped.

--------------------------------------------------------------------------------
  educators
--------------------------------------------------------------------------------

  Purpose:
    Educator accounts within an org. Created by Admin.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    educator_code       TEXT — system-generated Educator ID, unique within org
    full_name           TEXT
    email               TEXT
    password_hash       TEXT
    created_at          TIMESTAMP
    updated_at          TIMESTAMP
    deleted_at          TIMESTAMP, nullable — soft delete

  Unique constraint:
    (org_id, educator_code) — Educator IDs are unique per org, not globally.
    (org_id, email) — email unique within org.

--------------------------------------------------------------------------------
  students
--------------------------------------------------------------------------------

  Purpose:
    Student accounts within an org. Created by Admin.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    student_code        TEXT — Admin-assigned Student ID, unique within org
    full_name           TEXT
    email               TEXT
    password_hash       TEXT
    status              ENUM('active','pending','dropped','transferred',
                             'suspended','graduated'), default 'pending'
    program_id          UUID, nullable, foreign key → programs.id
    course_id           UUID, nullable, foreign key → courses.id
    grade_year_level    TEXT — e.g. "Grade 7", "Year 2"
    section_id          UUID, nullable, foreign key → sections.id
    school_year_id      UUID, foreign key → school_years.id
    created_at          TIMESTAMP
    updated_at          TIMESTAMP
    deleted_at          TIMESTAMP, nullable

  Unique constraints:
    (org_id, student_code) — Student IDs unique within org.
    (org_id, email)        — email unique within org.

  Why section_id is nullable:
    A student can be in a Pending state with no section assigned if the
    section was at capacity on save. The account exists; the section slot
    is unresolved.

  Status logic note:
    Dropped, Transferred, and Graduated cannot be reversed to Active without
    a deliberate Admin confirmation. This is enforced in application logic with
    an explicit confirmation flow that is logged to the audit log. The DB
    itself does not block the update — the application layer does, making
    it auditable rather than silently prevented.


================================================================================
  PART 7 — SUBJECT AND CLASS TABLES
================================================================================

  Subjects are the academic units. Classes are the scheduled instances of
  a subject — they carry the weekday, time, section target, and capacity.
  This separation is intentional: one subject can have multiple classes
  (e.g. Section A at 8 AM and Section B at 10 AM).

--------------------------------------------------------------------------------
  subjects
--------------------------------------------------------------------------------

  Purpose:
    Defines an academic subject within a school year. Does not carry a
    schedule — scheduling lives on the class.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    school_year_id      UUID, foreign key → school_years.id
    program_id          UUID, foreign key → programs.id
    course_id           UUID, nullable, foreign key → courses.id
    grade_year_level    TEXT
    title               TEXT — e.g. "Data Structures", "Biology"
    educator_id         UUID, foreign key → educators.id
    grading_system_id   UUID, foreign key → grading_systems.id
    is_locked           BOOLEAN, default false — locked once enrollment begins
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Why grading_system_id lives on subject:
    Different subjects use different rubric weight distributions (general vs
    major subjects). Attaching the grading system here means all classes
    derived from this subject start with the right rubric. The class/educator
    can still adjust within the rubric rules.

--------------------------------------------------------------------------------
  grading_systems
--------------------------------------------------------------------------------

  Purpose:
    Reusable rubric weight configurations per org. Admin creates these and
    assigns them to subjects. Educators can also build personal variants.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    title               TEXT — e.g. "General Subject Rubric", "Major Rubric"
    is_org_default      BOOLEAN, default false — one per org can be default
    created_by_role     ENUM('admin','educator')
    created_by_id       UUID — references platform_admins.id or educators.id
                               depending on created_by_role
    created_at          TIMESTAMP

  Isolation:
    org_id scopes these completely. Educator rubric libraries are invisible
    to other orgs and to other educators within the same org.

--------------------------------------------------------------------------------
  grading_system_categories
--------------------------------------------------------------------------------

  Purpose:
    The individual rubric line items within a grading system
    (e.g. Activities 20%, Quizzes 20%, Exams 25%).

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    grading_system_id   UUID, foreign key → grading_systems.id
    label               TEXT — e.g. "Activities", "Exams", "Behavior"
    weight_percent      NUMERIC(5,2) — e.g. 20.00
    entry_type          ENUM('assessment_linked','manual')
    assessment_type     TEXT, nullable — if assessment_linked, which type
                               (e.g. 'quiz', 'activity', 'exam')
    sort_order          INTEGER

  Constraint:
    Sum of weight_percent for all categories in a grading_system must equal
    100.00. Enforced before save in application logic.

--------------------------------------------------------------------------------
  classes
--------------------------------------------------------------------------------

  Purpose:
    A scheduled instance of a subject. Carries the weekday(s), time, section
    target, semester, term, and capacity. One subject can produce many classes.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    school_year_id      UUID, foreign key → school_years.id
    subject_id          UUID, foreign key → subjects.id
    semester_id         UUID, foreign key → semesters.id
    term_id             UUID, foreign key → terms.id
    section_id          UUID, nullable, foreign key → sections.id
    educator_id         UUID, foreign key → educators.id
    title               TEXT
    weekdays            TEXT[] — array of weekday names, e.g. ['Monday','Wednesday']
    time_start          TIME
    capacity_type       ENUM('limited','unlimited')
    capacity_limit      INTEGER, nullable — only set if capacity_type = 'limited'
    is_archived         BOOLEAN, default false
    deleted_at          TIMESTAMP, nullable — soft delete
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Why weekdays is an array:
    A class can meet on 1 to 5 days per week. Storing as an array in
    PostgreSQL (or a JSON array in MySQL) is cleaner than a junction table
    for a small bounded set like days of the week.

  Schedule conflict check:
    Before saving a class, the application checks:
      1. No other class in the same section/level has the same weekday + time.
      2. The assigned educator has no other class at that weekday + time.
    These checks query across all active classes in the same org and
    school year.

--------------------------------------------------------------------------------
  class_educator_history
--------------------------------------------------------------------------------

  Purpose:
    Tracks every educator who has ever been assigned to a class, with the
    period they were active. Never deleted. Used for attribution and auditing.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    class_id            UUID, foreign key → classes.id
    educator_id         UUID, foreign key → educators.id
    assigned_from       TIMESTAMP
    assigned_to         TIMESTAMP, nullable — null means currently active
    reason              TEXT, nullable — Admin's note for the reassignment
    created_at          TIMESTAMP

  Attribution rule:
    When grades are exported or class cards generated, the system looks up
    which educator was active during grade finalization using this table.
    Historical records are never rewritten.

--------------------------------------------------------------------------------
  enrollments
--------------------------------------------------------------------------------

  Purpose:
    The explicit link between a student and a class. This is the enrollment
    record. A student is not in a class until this record exists. Section
    membership alone does NOT create this record — Admin creates it manually.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    class_id            UUID, foreign key → classes.id
    student_id          UUID, foreign key → students.id
    enrolled_by         UUID — references platform_admins.id (always Admin)
    status              ENUM('active','pending_enrollment','dropped')
    enrolled_at         TIMESTAMP
    dropped_at          TIMESTAMP, nullable
    deleted_at          TIMESTAMP, nullable — soft delete

  Unique constraint:
    (org_id, class_id, student_id) WHERE deleted_at IS NULL
    Prevents duplicate active enrollment in the same class.

  Why pending_enrollment exists:
    When a class is at capacity and Admin defers resolution, the enrollment
    record is created with status = 'pending_enrollment'. The student exists
    in the system but cannot access the class. Admin resolves by either
    moving the student to a new parallel class or increasing capacity.


================================================================================
  PART 8 — GRADING SCALE TABLES
================================================================================

--------------------------------------------------------------------------------
  grading_scales
--------------------------------------------------------------------------------

  Purpose:
    The letter/numeric grade scale per program level. Each program level
    (Elementary, College, etc.) can have its own scale. Locks once the first
    grade is locked for that level in a school year.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    school_year_id      UUID, foreign key → school_years.id
    program_id          UUID, foreign key → programs.id
    passing_threshold   NUMERIC(5,2) — minimum percentage to pass
    is_locked           BOOLEAN, default false
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

--------------------------------------------------------------------------------
  grading_scale_ranges
--------------------------------------------------------------------------------

  Purpose:
    Individual rows within a grading scale — each maps a score range to a
    grade value and remark.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    grading_scale_id    UUID, foreign key → grading_scales.id
    score_min           NUMERIC(5,2) — e.g. 97.00
    score_max           NUMERIC(5,2) — e.g. 100.00
    grade_value         TEXT — e.g. "1.00", "A", "Outstanding"
    remark              TEXT — e.g. "Passed", "Failed", "Incomplete"
    sort_order          INTEGER

  Constraint:
    Ranges within a scale must cover 0–100 with no gaps and no overlaps.
    Validated before save in application logic.


================================================================================
  PART 9 — LESSON AND CONCEPT TABLES
================================================================================

--------------------------------------------------------------------------------
  lessons
--------------------------------------------------------------------------------

  Purpose:
    Lessons created by an educator within a class. Organized by week.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    class_id            UUID, foreign key → classes.id
    educator_id         UUID, foreign key → educators.id
    title               TEXT
    description         TEXT, nullable
    week_label          TEXT — e.g. "Week 1", "Week 2.3"
    detail              TEXT — minimum 10 words required
    deleted_at          TIMESTAMP, nullable — soft delete
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

--------------------------------------------------------------------------------
  concept_builds
--------------------------------------------------------------------------------

  Purpose:
    The extracted concepts from a lesson's detail text. Generated by AI in
    the background. Used by the assessment generator. Only the latest build
    per lesson is active — re-extraction replaces the previous one.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    lesson_id           UUID, foreign key → lessons.id
    is_active           BOOLEAN, default true — only one active per lesson
    status              ENUM('pending','processing','completed','failed')
    completed_at        TIMESTAMP, nullable
    created_at          TIMESTAMP

--------------------------------------------------------------------------------
  concept_sections
--------------------------------------------------------------------------------

  Purpose:
    Individual concept sections extracted from the lesson (e.g. "Stack",
    "Queue", "Binary Tree"). Each has an item count — how many assessment
    questions can be generated from it.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    concept_build_id    UUID, foreign key → concept_builds.id
    label               TEXT — e.g. "Stack", "Binary Tree"
    available_items     INTEGER — how many questions can be generated from this


================================================================================
  PART 10 — ASSESSMENT TABLES
================================================================================

--------------------------------------------------------------------------------
  assessments
--------------------------------------------------------------------------------

  Purpose:
    An assessment created by an educator for a class. Holds the configuration
    and dates. Questions are stored separately.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    class_id            UUID, foreign key → classes.id
    lesson_id           UUID, foreign key → lessons.id
    concept_build_id    UUID, foreign key → concept_builds.id
    educator_id         UUID, foreign key → educators.id
    title               TEXT
    assessment_type     ENUM('quiz','activity','exam','custom')
    total_items         INTEGER
    release_date        TIMESTAMP
    end_date            TIMESTAMP
    is_questions_locked BOOLEAN, default false — true after release_date passes
    deleted_at          TIMESTAMP, nullable — soft delete
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

--------------------------------------------------------------------------------
  assessment_questions
--------------------------------------------------------------------------------

  Purpose:
    Individual questions within an assessment. AI-generated. Editable by
    educator before release date. Locked after.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    assessment_id       UUID, foreign key → assessments.id
    question_number     INTEGER
    question_type       ENUM('multiple_choice','true_or_false',
                             'identification','enumeration','essay')
    question_text       TEXT
    correct_answer      TEXT, nullable — null for essay
    choices             JSONB, nullable — for multiple_choice only
                               e.g. [{"key":"A","text":"..."},...]
    concept_section_id  UUID, foreign key → concept_sections.id
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

--------------------------------------------------------------------------------
  assessment_assignments
--------------------------------------------------------------------------------

  Purpose:
    Controls which students are assigned to an assessment and tracks their
    individual status. The default state is NULL (not assigned). Educator
    explicitly assigns students or sets overrides here.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    assessment_id       UUID, foreign key → assessments.id
    student_id          UUID, foreign key → students.id
    status              ENUM('null','assigned','exempted','customized',
                             'submitted','draft')
                               default 'null'
    custom_score        NUMERIC(6,2), nullable — set when status = 'customized'
    score               NUMERIC(6,2), nullable — computed on submission
    max_score           NUMERIC(6,2), nullable
    is_score_published  BOOLEAN, default false
    published_at        TIMESTAMP, nullable
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Why is_score_published lives here and not on assessments:
    Educator can publish scores for selected students only, not necessarily
    all at once. Each student's score visibility is independent.

--------------------------------------------------------------------------------
  assessment_attempts
--------------------------------------------------------------------------------

  Purpose:
    Tracks each student's attempt on an assessment. Enforces the one-active-
    attempt-per-student rule. Stores auto-save progress.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    assessment_id       UUID, foreign key → assessments.id
    student_id          UUID, foreign key → students.id
    assignment_id       UUID, foreign key → assessment_assignments.id
    status              ENUM('active','submitted','closed')
    progress            JSONB — auto-saved answer state
                               e.g. {"q1":"A","q3":"True",...}
    started_at          TIMESTAMP
    submitted_at        TIMESTAMP, nullable
    closed_at           TIMESTAMP, nullable — set on end_date auto-close
    device_fingerprint  TEXT, nullable — for detecting multi-device attempts

  Unique constraint:
    Only one row per (assessment_id, student_id) WHERE status = 'active'
    This is the database-level enforcement of the single-attempt rule.
    If a second attempt is attempted from another device, the application
    queries this table, finds the existing active attempt, and resumes it
    rather than creating a new row.

--------------------------------------------------------------------------------
  attempt_answers
--------------------------------------------------------------------------------

  Purpose:
    The final submitted answers per question. Written only on submission.
    During active attempts, progress is stored in assessment_attempts.progress
    (JSONB). On submit, the answers are written here for permanent record.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    attempt_id          UUID, foreign key → assessment_attempts.id
    question_id         UUID, foreign key → assessment_questions.id
    answer_text         TEXT
    is_correct          BOOLEAN, nullable — null for essay (manual grading)
    created_at          TIMESTAMP


================================================================================
  PART 11 — ATTENDANCE TABLES
================================================================================

--------------------------------------------------------------------------------
  class_sessions
--------------------------------------------------------------------------------

  Purpose:
    Represents each scheduled session of a class (one per weekday per
    calendar week). Generated from the class schedule and calendar.
    Sessions on Holiday or No Class Day are not generated — or if generated
    first, they are marked as skipped.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    class_id            UUID, foreign key → classes.id
    session_date        DATE
    week_label          TEXT — e.g. "Week 1", "Week 2.1"
    is_skipped          BOOLEAN, default false — true on calendar event days
    created_at          TIMESTAMP

--------------------------------------------------------------------------------
  attendance_records
--------------------------------------------------------------------------------

  Purpose:
    One row per student per session. Tracks attendance status for each
    class meeting.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    session_id          UUID, foreign key → class_sessions.id
    student_id          UUID, foreign key → students.id
    class_id            UUID, foreign key → classes.id
    status              ENUM('present','absent','late','excused')
    source              ENUM('auto','manual') — auto from assessment submission,
                                               manual from educator entry
    recorded_by         UUID, nullable — educator_id if manual
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Auto-attendance logic note:
    When a student submits an assessment, the application looks up the
    class_session matching that assessment's class and today's date,
    then upserts an attendance_record with status='present' and source='auto'.
    The educator can override this to any other status manually.


================================================================================
  PART 12 — GRADE TABLES
================================================================================

  Grades are computed from assessment scores per term. The system stores
  both the raw per-category scores and the final computed grade per term.
  At the end of a semester, the overall subject grade is computed from
  all term grades.

--------------------------------------------------------------------------------
  term_grades
--------------------------------------------------------------------------------

  Purpose:
    Stores the computed grade per student per term per class. This is what
    the educator sees in the grade management view. Updated whenever scores
    change (before lock).

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    class_id            UUID, foreign key → classes.id
    student_id          UUID, foreign key → students.id
    term_id             UUID, foreign key → terms.id
    grading_system_id   UUID, foreign key → grading_systems.id
    computed_grade      NUMERIC(6,2) — the final numeric grade for this term
    grade_value         TEXT, nullable — mapped value from grading scale
    remark              TEXT, nullable — e.g. "Passed", "Failed"
    is_locked           BOOLEAN, default false
    locked_at           TIMESTAMP, nullable
    locked_by           UUID, nullable — educator_id who locked (or system)
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Lock cascade:
    When a term_grade is locked, all assessment_assignments for students in
    that class/term have their is_score_published flipped to true if not
    already published.

--------------------------------------------------------------------------------
  term_grade_category_scores
--------------------------------------------------------------------------------

  Purpose:
    Stores the computed score per rubric category per student per term.
    The data behind the grade view (both Default and Clean modes). Computed
    from assessment scores for assessment-linked categories, or from manual
    entry for manual categories.

  Columns:
    id                   UUID, primary key
    org_id               UUID, NOT NULL
    term_grade_id        UUID, foreign key → term_grades.id
    category_id          UUID, foreign key → grading_system_categories.id
    earned_points        NUMERIC(6,2)
    total_points         NUMERIC(6,2)
    manual_score         NUMERIC(6,2), nullable — for manual-entry categories
    created_at           TIMESTAMP
    updated_at           TIMESTAMP

--------------------------------------------------------------------------------
  semester_grades
--------------------------------------------------------------------------------

  Purpose:
    The overall subject grade per student per semester, computed from all
    term_grades within that semester. This is what appears on the transcript.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    class_id            UUID, foreign key → classes.id
    student_id          UUID, foreign key → students.id
    semester_id         UUID, foreign key → semesters.id
    computed_grade      NUMERIC(6,2)
    grade_value         TEXT, nullable
    remark              TEXT, nullable
    is_passing          BOOLEAN
    created_at          TIMESTAMP
    updated_at          TIMESTAMP


================================================================================
  PART 13 — MEETING TABLES
================================================================================

--------------------------------------------------------------------------------
  meetings
--------------------------------------------------------------------------------

  Purpose:
    A scheduled video meeting for a class. Built-in room — no third-party.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    class_id            UUID, foreign key → classes.id
    educator_id         UUID, foreign key → educators.id
    title               TEXT
    description         TEXT, nullable
    scheduled_at        TIMESTAMP
    started_at          TIMESTAMP, nullable
    ended_at            TIMESTAMP, nullable
    deleted_at          TIMESTAMP, nullable — soft delete
    created_at          TIMESTAMP

--------------------------------------------------------------------------------
  meeting_invitations
--------------------------------------------------------------------------------

  Purpose:
    Tracks which students are invited to a meeting and their join status.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    meeting_id          UUID, foreign key → meetings.id
    student_id          UUID, foreign key → students.id
    invite_type         ENUM('invited','requested','admitted','declined')
    created_at          TIMESTAMP
    updated_at          TIMESTAMP

  Non-invited students:
    They can see the meeting exists but have no row here until they send a
    join request — at which point a row is inserted with invite_type =
    'requested'. Educator flips it to 'admitted' or 'declined' from inside
    the room.


================================================================================
  PART 14 — NOTIFICATION TABLE
================================================================================

--------------------------------------------------------------------------------
  notifications
--------------------------------------------------------------------------------

  Purpose:
    In-app notifications per recipient. No email or SMS. Simple append log.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    recipient_role      ENUM('admin','educator','student')
    recipient_id        UUID — references platform_admins, educators, or
                               students depending on recipient_role
    trigger_type        TEXT — e.g. 'assessment_released', 'grade_locked',
                                    'concept_extraction_complete', etc.
    message             TEXT
    related_entity_type TEXT, nullable — e.g. 'class', 'assessment'
    related_entity_id   UUID, nullable
    created_at          TIMESTAMP
    archived_at         TIMESTAMP, nullable — set after 90 days automatically

  No read/unread tracking. Simple ordered list per recipient.
  Rows older than 90 days have archived_at set and are excluded from
  the active notification list query.


================================================================================
  PART 15 — AUDIT LOG TABLES
================================================================================

  Audit logs are append-only. No row is ever updated or deleted here.
  They are the permanent record of every significant action.

--------------------------------------------------------------------------------
  admin_audit_log
--------------------------------------------------------------------------------

  Purpose:
    Logs every high-impact Admin action within the org.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    actor_id            UUID — platform_admins.id
    action_type         TEXT — e.g. 'student_profile_change',
                                    'enrollment_add', 'grade_lock_override',
                                    'password_reset', 'section_capacity_resolved'
    target_entity_type  TEXT — e.g. 'student', 'class', 'enrollment'
    target_entity_id    UUID
    details             JSONB — structured details: old value, new value,
                                reason, affected IDs, etc.
    created_at          TIMESTAMP

  Append-only enforcement:
    No UPDATE or DELETE permissions are granted on this table to any
    application role. The application service that writes logs uses a
    write-only database user for this table.

--------------------------------------------------------------------------------
  educator_activity_log
--------------------------------------------------------------------------------

  Purpose:
    Logs class-level events per educator. Educators see only their own logs.
    Admin can see all logs across the org.

  Columns:
    id                  UUID, primary key
    org_id              UUID, NOT NULL
    class_id            UUID, foreign key → classes.id
    educator_id         UUID, foreign key → educators.id
    event_type          TEXT — e.g. 'assessment_created', 'grade_locked',
                                    'student_removed', 'concept_extraction_complete'
    details             JSONB
    created_at          TIMESTAMP

  Access rule:
    Educator queries filter by educator_id = current_user's educator id.
    Admin queries filter by org_id only — sees all educators' logs.


================================================================================
  PART 16 — ROW-LEVEL SECURITY MODEL
================================================================================

  This section describes how the database enforces the org isolation boundary
  at the database engine level (using PostgreSQL Row Level Security as the
  reference model, adaptable to other engines).

  The goal is: even if application code has a bug that forgets to add a
  WHERE org_id = ? clause, the database itself returns zero rows to the
  wrong org's session.

--------------------------------------------------------------------------------
  Application Database Roles
--------------------------------------------------------------------------------

  Four roles are used by the application:

  edutool_platform
    Used only by Platform Owner endpoints.
    Access: platform_admins table (read/write), organizations table (read).
    No access to any other table.

  edutool_admin
    Used by Admin-level endpoints.
    Access: all tables within their org_id.
    RLS policy: WHERE org_id = current_setting('app.current_org_id')

  edutool_educator
    Used by Educator-level endpoints.
    Access: classes (where educator_id matches), lessons, assessments,
            enrollments, attendance, grades — all filtered by their
            educator_id and org_id.
    RLS policy: additional filter on educator_id for class-scoped tables.

  edutool_student
    Used by Student-level endpoints.
    Access: read-only on their own assessment_assignments, attempt records,
            grades (published only), meetings (invited ones), notifications.
    Cannot read other students' rows. Cannot write to grade tables.

  edutool_log_writer
    Write-only access to admin_audit_log and educator_activity_log.
    Cannot SELECT, UPDATE, or DELETE from these tables.

--------------------------------------------------------------------------------
  RLS Policy Pattern (all org-scoped tables)
--------------------------------------------------------------------------------

  On every org-scoped table:

    CREATE POLICY org_isolation ON <table_name>
      USING (org_id = current_setting('app.current_org_id')::uuid);

  The application sets app.current_org_id at the start of each request
  after authentication resolves the user's org. This setting scopes all
  queries for the duration of that connection/transaction.

  For educator-scoped tables (e.g. classes):

    CREATE POLICY educator_scope ON classes
      USING (
        org_id = current_setting('app.current_org_id')::uuid
        AND (
          educator_id = current_setting('app.current_user_id')::uuid
          OR current_setting('app.current_role') = 'admin'
        )
      );

  For student-scoped tables (e.g. assessment_assignments):

    CREATE POLICY student_scope ON assessment_assignments
      USING (
        org_id = current_setting('app.current_org_id')::uuid
        AND student_id = current_setting('app.current_user_id')::uuid
      );

  For published scores specifically:

    CREATE POLICY published_score_only ON assessment_assignments
      AS RESTRICTIVE
      FOR SELECT
      USING (
        student_id = current_setting('app.current_user_id')::uuid
        AND (
          is_score_published = true
          OR current_setting('app.current_role') IN ('admin','educator')
        )
      );


================================================================================
  PART 17 — KEY INDEXES
================================================================================

  The following indexes are essential for query performance on the most
  common access patterns:

  -- Most common: scoping all queries to an org
  CREATE INDEX idx_students_org               ON students(org_id);
  CREATE INDEX idx_educators_org              ON educators(org_id);
  CREATE INDEX idx_enrollments_org            ON enrollments(org_id);
  CREATE INDEX idx_classes_org                ON classes(org_id);
  CREATE INDEX idx_assessments_org            ON assessments(org_id);
  CREATE INDEX idx_term_grades_org            ON term_grades(org_id);

  -- Student lookup by Admin
  CREATE INDEX idx_students_code              ON students(org_id, student_code);
  CREATE INDEX idx_students_status            ON students(org_id, status);
  CREATE INDEX idx_students_section           ON students(org_id, section_id);

  -- Enrollment checks (duplicate prevention, capacity)
  CREATE UNIQUE INDEX idx_enrollment_unique
    ON enrollments(org_id, class_id, student_id)
    WHERE deleted_at IS NULL;

  -- Single active attempt per student per assessment
  CREATE UNIQUE INDEX idx_one_active_attempt
    ON assessment_attempts(assessment_id, student_id)
    WHERE status = 'active';

  -- Active school year per org (only one)
  CREATE UNIQUE INDEX idx_one_active_year
    ON school_years(org_id)
    WHERE status = 'active';

  -- Admin org (one per admin)
  CREATE UNIQUE INDEX idx_one_org_per_admin
    ON organizations(admin_id);

  -- Grade management: term grades per class
  CREATE INDEX idx_term_grades_class_term
    ON term_grades(org_id, class_id, term_id);

  -- Audit log: filtered by date and action type
  CREATE INDEX idx_audit_log_org_date
    ON admin_audit_log(org_id, created_at DESC);
  CREATE INDEX idx_audit_log_action
    ON admin_audit_log(org_id, action_type);

  -- Notifications: active (not archived) per recipient
  CREATE INDEX idx_notifications_recipient
    ON notifications(org_id, recipient_id, recipient_role)
    WHERE archived_at IS NULL;

  -- Soft-delete filtering (very common pattern)
  CREATE INDEX idx_classes_active
    ON classes(org_id, school_year_id)
    WHERE deleted_at IS NULL;
  CREATE INDEX idx_assessments_active
    ON assessments(org_id, class_id)
    WHERE deleted_at IS NULL;
  CREATE INDEX idx_lessons_active
    ON lessons(org_id, class_id)
    WHERE deleted_at IS NULL;


================================================================================
  PART 18 — TABLE DEPENDENCY ORDER (for migrations)
================================================================================

  Tables must be created in this order to satisfy foreign key constraints.
  Dropping should be done in reverse order.

  Tier 1 — No dependencies
    platform_admins
    organizations

  Tier 2 — Depends only on organizations
    level_defaults
    school_years
    semester_settings
    educators
    (students created after sections, so deferred to Tier 5)

  Tier 3 — Depends on Tier 2
    level_default_courses      → level_defaults
    level_default_sections     → level_defaults, level_default_courses
    programs                   → school_years
    semesters                  → semester_settings
    calendar_events            → school_years

  Tier 4 — Depends on Tier 3
    courses                    → programs
    terms                      → semesters
    grading_systems            → organizations, educators
    grading_system_categories  → grading_systems
    grading_scales             → school_years, programs

  Tier 5 — Depends on Tier 4
    sections                   → programs, courses
    grading_scale_ranges       → grading_scales
    subjects                   → programs, courses, educators, grading_systems
    students                   → programs, courses, sections

  Tier 6 — Depends on Tier 5
    classes                    → subjects, semesters, terms, sections, educators
    enrollments                → classes, students

  Tier 7 — Depends on Tier 6
    class_educator_history     → classes, educators
    class_sessions             → classes
    lessons                    → classes, educators
    meetings                   → classes, educators

  Tier 8 — Depends on Tier 7
    concept_builds             → lessons
    attendance_records         → class_sessions, students
    meeting_invitations        → meetings, students

  Tier 9 — Depends on Tier 8
    concept_sections           → concept_builds
    assessments                → classes, lessons, concept_builds

  Tier 10 — Depends on Tier 9
    assessment_questions       → assessments, concept_sections
    assessment_assignments     → assessments, students
    term_grades                → classes, students, terms, grading_systems
    term_grade_category_scores → term_grades, grading_system_categories
    semester_grades            → classes, students, semesters

  Tier 11 — Depends on Tier 10
    assessment_attempts        → assessments, students, assessment_assignments
    attempt_answers            → assessment_attempts, assessment_questions

  Tier 12 — Logging (append-only, depends on most of the above)
    notifications              → organizations (loosely coupled)
    admin_audit_log            → organizations
    educator_activity_log      → classes, educators


================================================================================
  PART 19 — SUMMARY TABLE COUNT
================================================================================

  Tier / Group                  Tables
  ----------------------------  ------------------------------------------------
  Platform level                platform_admins, organizations
  Academic structure            level_defaults, level_default_courses,
                                level_default_sections, school_years,
                                programs, courses, sections
  Semester & Calendar           semester_settings, semesters, terms,
                                calendar_events
  Accounts                      educators, students
  Grading systems               grading_systems, grading_system_categories,
                                grading_scales, grading_scale_ranges
  Classes & Enrollment          subjects, classes, class_educator_history,
                                enrollments
  Lessons & Concepts            lessons, concept_builds, concept_sections
  Assessments                   assessments, assessment_questions,
                                assessment_assignments, assessment_attempts,
                                attempt_answers
  Attendance                    class_sessions, attendance_records
  Grades                        term_grades, term_grade_category_scores,
                                semester_grades
  Meetings                      meetings, meeting_invitations
  Notifications                 notifications
  Audit & Logs                  admin_audit_log, educator_activity_log

  Total tables: 38


================================================================================
  EduTool  •  Database Design Document  •  v8.3
================================================================================