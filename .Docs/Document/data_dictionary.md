# EduTool — Data Dictionary
> Complete reference of every table, every field, its type, constraints, and what it means.
> Organized by domain group. Use this as the single source of truth when building the Prisma schema.

---

## How to Read This Document

```
Field Name      Type          Constraints           Description
────────────    ────────────  ────────────────────  ──────────────────────────────
id              UUID          PK                    Primary key, auto-generated
org_id          UUID          FK → Organization     Which org this record belongs to
name            String        required, max 100     Display name
status          Enum          see values below      Current state of the record
deleted_at      DateTime      nullable              Soft delete — null = active
```

**Constraint codes used:**
- `PK` — Primary key
- `FK → X` — Foreign key pointing to table X
- `UQ` — Unique within scope noted
- `nullable` — field can be null/absent
- `default X` — default value if not provided
- `immutable` — never updated after creation
- `soft delete` — set to now() instead of hard delete

---

---

# GROUP 1 — PLATFORM & AUTH

---

## User
> One row per person with system access. All roles share this table.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization, nullable | Null for Platform Owner only |
| role | Enum | required | `PLATFORM_OWNER` `ADMIN` `EDUCATOR` `STUDENT` |
| full_name | String | required, max 100 | Display name |
| email | String | UQ across platform, required | Login email |
| password_hash | String | required | bcrypt hash, rounds = 12 |
| generated_password | String | nullable | Plaintext password stored temporarily for credential export. Cleared after first login. Never exposed in API except credential export endpoint. |
| is_active | Boolean | default true | False = account disabled (e.g. removed educator). Disabled accounts cannot log in. |
| created_at | DateTime | immutable | When account was created |
| last_login_at | DateTime | nullable | Timestamp of most recent successful login |

---

## Organization
> One per school. Top-level container for all data.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| name | String | required, max 150 | School name, e.g. "College of Mary" |
| handle | String | UQ across platform, immutable | Short identifier, e.g. "collegeofmary". Set once on org creation, never changed. |
| admin_id | UUID | FK → User, UQ | The Admin account that owns this org. One org per Admin. |
| created_at | DateTime | immutable | When org was created |

---

---

# GROUP 2 — SCHOOL STRUCTURE

---

## SchoolYear
> One row per academic year per org.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| label | String | required | Display label, e.g. "2024-2025" |
| start_date | Date | required | First day of the school year |
| end_date | Date | required | Last day of the school year |
| is_active | Boolean | default false | Only one can be true per org at a time |
| created_at | DateTime | immutable | When record was created |

---

## SemesterTemplate
> A reusable semester schedule. Courses and strands pick one template per school year.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org owns this template |
| name | String | required | e.g. "June-March 3-Semester" |
| created_at | DateTime | immutable | When created |

---

## SemesterPeriod
> Individual semester within a template. Max 3 per template.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| template_id | UUID | FK → SemesterTemplate | Parent template |
| label | String | required | e.g. "1st Semester", "2nd Semester" |
| order | Integer | required, 1–3 | Display and sort order within the template |
| start_date | Date | required | Semester start. Must not overlap with other periods in same template. |
| end_date | Date | required | Semester end. Must be after start_date. |

---

## Course
> A college academic program. e.g. BSCS, BSBA.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| title | String | required, max 50 | Short code, e.g. "BSCS" |
| description | String | nullable | Full name, e.g. "Bachelor of Science in Computer Science" |
| max_year_level | Integer | required, min 1 | How many year levels this course has. Determines valid grade_year values for students and classes. |
| semester_template_id | UUID | FK → SemesterTemplate | Which semester schedule this course follows |
| created_at | DateTime | immutable | When created |

---

## Strand
> A Senior High School academic track. e.g. STEM, ABM.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| title | String | required, max 50 | Short code, e.g. "STEM" |
| description | String | nullable | Full name, e.g. "Science, Technology, Engineering, Mathematics" |
| semester_template_id | UUID | FK → SemesterTemplate | Which semester schedule this strand follows |
| created_at | DateTime | immutable | When created |

---

## Section
> A named grouping of students within a level, grade, and optionally a course/strand.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| name | String | required, max 100 | Fully custom name. e.g. "Section A", "Narra", "Block A". Admin defines — no auto-naming. |
| level_section | Enum | required | `ELEMENTARY` `HIGH_SCHOOL` `SENIOR_HIGH` `COLLEGE` |
| grade_year | String | required | e.g. "Grade 3", "Year 2", "Grade 11" |
| strand_id | UUID | FK → Strand, nullable | Required if level_section = SENIOR_HIGH |
| course_id | UUID | FK → Course, nullable | Required if level_section = COLLEGE |
| capacity | Integer | nullable | Max students in this section. Null = unlimited. |
| created_at | DateTime | immutable | When created |
| deleted_at | DateTime | nullable, soft delete | Set when section is removed |

---

## AcademicCalendarEvent
> Org-wide declared non-class days or special periods for a school year.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| school_year_id | UUID | FK → SchoolYear | Which school year this event belongs to |
| title | String | required | e.g. "Christmas Break", "Midterm Exams" |
| event_type | Enum | required | `HOLIDAY` `NO_CLASS_DAY` `EXAM_WEEK` `SPECIAL_EVENT` — only HOLIDAY and NO_CLASS_DAY skip sessions |
| start_date | Date | required | First day of the event |
| end_date | Date | required | Last day. Same as start_date for single-day events. |
| created_at | DateTime | immutable | When created |
| updated_at | DateTime | | Last update timestamp |

---

---

# GROUP 3 — ACCOUNTS

---

## Educator
> Profile record for a user with the EDUCATOR role.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key. Also used as the Educator ID shown in UI. |
| user_id | UUID | FK → User, UQ | One-to-one with User |
| org_id | UUID | FK → Organization | Which org |
| educator_code | String | UQ within org | System-generated. Format: `EDU-XXXX` e.g. "EDU-4821". Used for Admin search. |
| created_at | DateTime | immutable | When created |

---

## Student
> Profile record for a user with the STUDENT role.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| user_id | UUID | FK → User, UQ | One-to-one with User |
| org_id | UUID | FK → Organization | Which org |
| student_id | String | UQ within org | Admin-assigned ID, e.g. "2024-0001" |
| level_section | Enum | required | `ELEMENTARY` `HIGH_SCHOOL` `SENIOR_HIGH` `COLLEGE` |
| grade_year | String | required | e.g. "Grade 3", "Year 2", "Grade 11" |
| section_id | UUID | FK → Section, nullable | Assigned section. Null if none assigned or pending. |
| strand_id | UUID | FK → Strand, nullable | Required for SENIOR_HIGH |
| course_id | UUID | FK → Course, nullable | Required for COLLEGE |
| status | Enum | required, default ACTIVE | `ACTIVE` `PENDING` `DROPPED` `TRANSFERRED` `SUSPENDED` `GRADUATED` |
| status_changed_at | DateTime | nullable | When status last changed |
| created_at | DateTime | immutable | When account was created |

**Status meanings:**
| Status | Can Log In | Auto-Enrolled | Enrollments |
|---|---|---|---|
| ACTIVE | Yes | Yes | Normal |
| PENDING | No | No | Unresolved — section or class capacity conflict |
| DROPPED | No | No | All removed (soft-deleted) |
| TRANSFERRED | No | No | All removed (soft-deleted) |
| SUSPENDED | No | No | Retained but inaccessible |
| GRADUATED | No | No | Archived — read-only transcript |

---

---

# GROUP 4 — CLASSES & SUBJECTS

---

## Subject
> A course of study configured by Admin per school year.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| school_year_id | UUID | FK → SchoolYear | Which school year |
| title | String | required | e.g. "Data Structures", "Biology 101" |
| level_section | Enum | required | Which level this subject is for |
| grade_year | String | required | e.g. "Grade 3", "Year 1" |
| strand_id | UUID | FK → Strand, nullable | Senior High only |
| course_id | UUID | FK → Course, nullable | College only |
| educator_id | UUID | FK → Educator | Who teaches this subject |
| weekdays | Enum[] | required, min 1 max 5 | `MON` `TUE` `WED` `THU` `FRI` — days this subject meets |
| time_start | Time | required | Class start time |
| time_end | Time | required | Class end time |
| is_locked | Boolean | default false | True = read-only. Admin locks manually before enrollment. Unlocks at new school year. |
| created_at | DateTime | immutable | When created |

---

## Class
> A live instance of a subject — the actual classroom with students, lessons, and grades.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| school_year_id | UUID | FK → SchoolYear | Which school year |
| title | String | required | Display name e.g. "BSCS 1A — Data Structures" |
| subject_id | UUID | FK → Subject, nullable | The subject this class is an instance of. Nullable — class can exist independently. |
| level_section | Enum | required | Used for student matching |
| grade_year | String | required | Used for student matching |
| strand_id | UUID | FK → Strand, nullable | Senior High only |
| course_id | UUID | FK → Course, nullable | College only |
| section_id | UUID | FK → Section, nullable | If set, auto-enrollment only includes students in this section |
| semester_id | UUID | FK → SemesterPeriod | Which semester this class runs in |
| educator_id | UUID | FK → Educator | Who teaches this class. Changes on reassignment. |
| weekdays | Enum[] | required, min 1 max 5 | `MON` `TUE` `WED` `THU` `FRI` |
| time_start | Time | required | Class start time |
| time_end | Time | required | Class end time |
| capacity | Integer | nullable | Max enrolled students. Null = unlimited. |
| grades_locked | Boolean | default false | True = grades finalized. Set by lockGrades(). |
| is_archived | Boolean | default false | True = class is closed and read-only |
| archived_at | DateTime | nullable | When archived |
| created_at | DateTime | immutable | When created |
| deleted_at | DateTime | nullable, soft delete | Set when archived |

---

## ClassSession
> A single scheduled meeting of a class on a specific calendar date.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class | Which class |
| date | Date | required | The actual calendar date of this session |
| weekday | Enum | required | `MON` `TUE` `WED` `THU` `FRI` |
| week_number | Integer | required | Calendar week number within the semester, e.g. 1, 2, 3 |
| week_sub_index | Integer | nullable | Sub-position within the week for multi-day classes, e.g. 1, 2, 3 |
| week_label | String | required | Computed display label e.g. "Week 1", "Week 1.2". Stored for display — do not use for logic. |
| is_skipped | Boolean | default false | True = falls on a Holiday/No Class Day. No attendance record created. |
| created_at | DateTime | immutable | When generated |

---

## Enrollment
> A student's membership in a class for a semester.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| student_id | UUID | FK → Student | Which student |
| class_id | UUID | FK → Class | Which class |
| enrolled_at | DateTime | immutable | When the enrollment was created |
| added_by | Enum | required | `AUTO` = system matched profile. `ADMIN` = manually added by Admin. |
| manual | Boolean | default false | True = Admin forced enrollment outside normal profile match |
| deleted_at | DateTime | nullable, soft delete | Set when student is removed. Records are preserved. |

---

## PendingEnrollment
> A record of a student who could not be enrolled due to a capacity conflict.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| student_id | UUID | FK → Student | Which student is pending |
| class_id | UUID | FK → Class | Which class they need to be enrolled in |
| reason | Enum | required | `SECTION_CAPACITY` = section was full. `CLASS_CAPACITY` = class was full. |
| created_at | DateTime | immutable | When the conflict was detected |
| resolved_at | DateTime | nullable | When Admin resolved it |
| resolution | Enum | nullable | `ENROLLED` = student was enrolled. `DISMISSED` = Admin skipped. |

---

## ClassOwnershipLog
> Permanent audit trail of every educator reassignment for a class.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class | Which class was reassigned |
| previous_educator_id | UUID | FK → Educator | Who held the class before |
| previous_educator_from | DateTime | immutable | When the previous educator was assigned |
| previous_educator_to | DateTime | immutable | When they were replaced (time of this reassignment) |
| new_educator_id | UUID | FK → Educator | Who the class was reassigned to |
| new_educator_from | DateTime | immutable | When the new educator took over |
| reason | String | nullable, max 500 | Optional Admin note explaining the reassignment |
| created_by_admin_id | UUID | FK → User | Which Admin performed the reassignment |
| created_at | DateTime | immutable | When this log entry was created. Never modified. |

---

---

# GROUP 5 — LESSONS & CONCEPTS

---

## Lesson
> A content unit created by an educator for a specific class session.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class | Which class this lesson belongs to |
| title | String | required | Lesson title |
| description | String | nullable | Optional short summary |
| week_session_id | UUID | FK → ClassSession | Which session week this lesson is assigned to |
| detail | Text | required, min 10 words | The full lesson content. Minimum 10 words enforced on save. |
| detail_word_count | Integer | required | Computed on save. Used to validate 10-word minimum. |
| has_concept_build | Boolean | default false | True = at least one completed ConceptBuild exists |
| concept_build_id | UUID | FK → ConceptBuild, nullable | The current active concept build for this lesson |
| created_at | DateTime | immutable | When created |
| updated_at | DateTime | | Last time content was saved |
| deleted_at | DateTime | nullable, soft delete | Set when lesson is deleted |

---

## ConceptBuild
> The output of AI concept extraction on a lesson. Feeds the assessment generator.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| lesson_id | UUID | FK → Lesson | Which lesson this was extracted from |
| class_id | UUID | FK → Class | Denormalized for easier querying |
| sections | JSON | required when COMPLETE | Array of concept sections and item counts. Format: `[{ "concept": "Stack", "available_items": 5 }, ...]` |
| total_items | Integer | nullable | Sum of all available_items across sections. Set on completion. |
| status | Enum | required | `PENDING` `RUNNING` `COMPLETE` `FAILED` |
| triggered_by | Enum | required | `AUTO` = first save of lesson detail. `MANUAL` = educator re-triggered. |
| created_at | DateTime | immutable | When extraction was queued |
| completed_at | DateTime | nullable | When job finished (success or fail) |

---

---

# GROUP 6 — ASSESSMENTS

---

## Assessment
> A test or quiz configured by an educator, AI-generated from a concept build.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class | Which class |
| lesson_id | UUID | FK → Lesson | Which lesson this is based on |
| concept_build_id | UUID | FK → ConceptBuild | Snapshot of the build used at generation time |
| title | String | required | Display name |
| type | Enum | required | `QUIZ` `ACTIVITY` `EXAM` `CUSTOM` |
| total_items | Integer | required | Total number of questions |
| release_date | DateTime | required | Questions are hidden from students until this time |
| end_date | DateTime | required | Submission deadline. Auto-closes at this time. |
| status | Enum | required | `DRAFT` `GENERATING` `READY` `RELEASED` `CLOSED` |
| created_by | UUID | FK → Educator | Which educator created it |
| created_at | DateTime | immutable | When created |
| deleted_at | DateTime | nullable, soft delete | Set when deleted |

---

## AssessmentRange
> A configuration block defining which question type and concepts cover a span of items.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| assessment_id | UUID | FK → Assessment | Which assessment this range belongs to |
| item_start | Integer | required | First item number in this range, e.g. 1 |
| item_end | Integer | required | Last item number in this range, e.g. 10 |
| question_type | Enum | required | `MULTIPLE_CHOICE` `TRUE_OR_FALSE` `IDENTIFICATION` `ENUMERATION` `ESSAY` |
| concept_sections | JSON | required | Array of concept section names to draw from, e.g. `["Stack", "Queue"]`. Must collectively provide enough items to fill item_start to item_end. |

---

## Question
> A single generated question in an assessment.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| assessment_id | UUID | FK → Assessment | Which assessment |
| range_id | UUID | FK → AssessmentRange | Which range it was generated from |
| item_number | Integer | required | Position in the assessment (1-based) |
| question_type | Enum | required | `MULTIPLE_CHOICE` `TRUE_OR_FALSE` `IDENTIFICATION` `ENUMERATION` `ESSAY` |
| question_text | Text | required | The question content |
| choices | JSON | nullable | For MC: `[{ "label": "A", "text": "...", "is_correct": true/false }]`. For T/F: `[{ "text": "True", "is_correct": bool }, ...]`. Null for other types. |
| correct_answer | Text | nullable | Expected answer for Identification/Enumeration. Null for Essay (no correct answer). |
| is_locked | Boolean | default false | Set to true when release_date passes. Locked questions cannot be edited. |
| created_at | DateTime | immutable | When generated |
| updated_at | DateTime | | Last edit timestamp |

---

## StudentAssessment
> Assignment and submission record linking a student to an assessment.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| assessment_id | UUID | FK → Assessment | Which assessment |
| student_id | UUID | FK → Student | Which student |
| status | Enum | required, default NULL | `NULL` (not assigned/missed) `EXEMPTED` `CUSTOM` (UI label: "Customized") `SUBMITTED` `DRAFT` |
| custom_score | Decimal | nullable | Set by educator when status = CUSTOM. Represents 0–100. |
| score | Decimal | nullable | Auto-computed after submission. Null if essay not yet graded. |
| score_published | Boolean | default false | True = student can see their score. Set to true automatically on grade lock. |
| assigned_by | UUID | FK → Educator | Who assigned this assessment to the student |
| assigned_at | DateTime | immutable | When assigned |
| updated_at | DateTime | | Last status or score change |

---

## AssessmentAttempt
> A student's active or completed attempt session for an assessment.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| student_assessment_id | UUID | FK → StudentAssessment | Parent record |
| student_id | UUID | FK → Student | Denormalized for faster lookup |
| assessment_id | UUID | FK → Assessment | Denormalized for faster lookup |
| status | Enum | required | `ACTIVE` `SUBMITTED` `CLOSED` |
| answers | JSON | required | Auto-saved progress. Format: `{ "1": "answer", "2": "B", ... }` keyed by item_number. |
| opened_at | DateTime | immutable | When student first opened the assessment |
| submitted_at | DateTime | nullable | When student submitted. Null if not yet submitted. |
| closed_at | DateTime | nullable | Set when end_date forces closure on unsubmitted attempts |

---

## EssayGrade
> Manual grade entered by educator for a single essay question in a submission.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| student_assessment_id | UUID | FK → StudentAssessment | Which submission |
| question_id | UUID | FK → Question | Which essay question |
| score | Decimal | required | Score given by educator. Typically 0–1 per item. |
| graded_by_educator_id | UUID | FK → Educator | Who graded it. Immutable — attribution never changes. |
| graded_at | DateTime | immutable | When graded |

---

---

# GROUP 7 — ATTENDANCE

---

## AttendanceRecord
> One record per student per class session. Tracks whether the student was present.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class | Which class. Denormalized for simpler queries. |
| session_id | UUID | FK → ClassSession | Which specific session |
| student_id | UUID | FK → Student | Which student |
| status | Enum | default NULL | `PRESENT` `ABSENT` `LATE` `EXCUSED` `NULL` (not yet marked) |
| source | Enum | default MANUAL | `AUTO` = set by assessment submission. `MANUAL` = set by educator. AUTO never overrides MANUAL. |
| set_by | UUID | FK → Educator, nullable | Who set it manually. Null if AUTO. |
| set_at | DateTime | nullable | When it was set. Null if never marked. |
| created_at | DateTime | immutable | When record was created (at session generation or enrollment) |

---

---

# GROUP 8 — GRADES

---

## RubricTemplate
> A reusable grade weight configuration. Used for org default, educator library, and class-level rubrics.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| owner_type | Enum | required | `ORG_DEFAULT` = Admin's default for the org. `EDUCATOR_LIBRARY` = saved by an educator. `CLASS` = attached to a specific class (cloned from template). |
| org_id | UUID | FK → Organization | Which org |
| educator_id | UUID | FK → Educator, nullable | Null for ORG_DEFAULT. Set for EDUCATOR_LIBRARY templates. |
| name | String | required | e.g. "Standard College Rubric" |
| created_at | DateTime | immutable | When created |

---

## RubricCategory
> A single weighted category within a rubric template.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| rubric_id | UUID | FK → RubricTemplate | Which rubric this belongs to |
| name | String | required | e.g. "Quizzes", "Attendance", "Behavior" |
| weight | Decimal | required | Percentage weight, e.g. 20.00. All categories in a rubric must sum to exactly 100.00. |
| entry_type | Enum | required | `ASSESSMENT_LINKED` = auto-computed from assessments. `MANUAL_ENTRY` = educator enters score manually. |
| assessment_type | Enum | nullable | For ASSESSMENT_LINKED only: which assessment type to pull. `QUIZ` `ACTIVITY` `EXAM` `CUSTOM`. |
| order | Integer | required | Display order in the grade sheet |

---

## ClassRubric
> The rubric instance attached to a specific class. Cloned from a template at class creation.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class, UQ | One rubric per class |
| rubric_id | UUID | FK → RubricTemplate | The template this was cloned from |
| is_locked | Boolean | default false | Locks permanently when first student is enrolled. Cannot be unlocked. |
| locked_at | DateTime | nullable | When it locked |

---

## StudentGrade
> The computed final grade for a student in a class.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class | Which class |
| student_id | UUID | FK → Student | Which student |
| rubric_id | UUID | FK → ClassRubric | Which rubric was used |
| category_scores | JSON | required | Array of per-category scores. Format: `[{ "category_id": "...", "name": "Quizzes", "weight": 20.00, "raw_score": 88.5, "weighted_score": 17.7 }]` |
| final_grade_percentage | Decimal | required | Sum of all weighted_scores. 0.00–100.00. |
| final_grade_value | String | nullable | From grading scale, e.g. "1.25", "A", "Outstanding". Null until computed. |
| final_grade_remark | String | nullable | e.g. "Passed", "Failed", "Incomplete" |
| is_passing | Boolean | nullable | True if final_grade_percentage ≥ passing threshold in grading scale |
| is_locked | Boolean | default false | True = grade is finalized. Immutable after lock. |
| locked_at | DateTime | nullable | When grade was locked |
| locked_by | Enum | nullable | `EDUCATOR` `AUTO_LOCK` `PLATFORM_OVERRIDE` |

---

## ManualGradeEntry
> Educator-entered score for a MANUAL_ENTRY rubric category (e.g. Attendance, Behavior).

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class | Which class |
| student_id | UUID | FK → Student | Which student |
| category_id | UUID | FK → RubricCategory | Which rubric category |
| score | Decimal | required | 0.00–100.00 |
| entered_by | UUID | FK → Educator | Who entered it |
| entered_at | DateTime | immutable | When first entered |
| updated_at | DateTime | | Last update |

---

## GradeLockWindow
> Admin-defined window during which educators must lock their grades.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| school_year_id | UUID | FK → SchoolYear | Which school year |
| semester_id | UUID | FK → SemesterPeriod | Which semester |
| deadline | DateTime | required | Auto-lock fires at this time for all unlocked classes |
| opened_by | UUID | FK → User | Which Admin opened the window |
| opened_at | DateTime | immutable | When the window was opened |

---

## PlatformOverrideLog
> Permanent record of every grade unlock performed by the platform owner.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class | Which class was unlocked |
| requested_by | UUID | FK → User | Which Admin requested it |
| approved_by | UUID | FK → User | Which Platform Owner approved it |
| reason | Text | required | Why the unlock was approved |
| unlocked_at | DateTime | immutable | When it was done |

---

## GradingScale
> Org-level grade scale per level section per school year.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| school_year_id | UUID | FK → SchoolYear | Which year this scale applies to |
| level_section | Enum | required | `ELEMENTARY` `HIGH_SCHOOL` `SENIOR_HIGH` `COLLEGE` |
| is_locked | Boolean | default false | Locks when first grade in this level section is locked for the year. Unlocks at new school year. |

---

## GradingScaleEntry
> A single range row in a grading scale.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| scale_id | UUID | FK → GradingScale | Which scale |
| range_min | Decimal | required | Minimum percentage for this range, e.g. 97.00 |
| range_max | Decimal | required | Maximum percentage for this range, e.g. 100.00 |
| grade_value | String | required | The grade assigned, e.g. "1.00", "A", "Outstanding" |
| remark | String | required | e.g. "Passed", "Failed", "Incomplete" |
| passing_threshold | Decimal | required | Minimum score considered passing for this scale. Applied to all entries in the scale. |

---

---

# GROUP 9 — MEETINGS

---

## Meeting
> A scheduled video session for a class.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| class_id | UUID | FK → Class | Which class |
| created_by | UUID | FK → Educator | Who created it |
| title | String | required | Display name |
| description | String | nullable | Optional details |
| scheduled_at | DateTime | required | When the room opens automatically |
| ended_at | DateTime | nullable | Set when educator manually ends the meeting |
| status | Enum | default SCHEDULED | `SCHEDULED` `LIVE` `ENDED` |
| invite_type | Enum | required | `ALL` = all enrolled students. `SELECTED` = only those in MeetingInvite. |
| created_at | DateTime | immutable | When created |
| deleted_at | DateTime | nullable, soft delete | Set when deleted |

---

## MeetingInvite
> Links a specific student to a meeting as an invitee.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| meeting_id | UUID | FK → Meeting | Which meeting |
| student_id | UUID | FK → Student | Which student is invited |

---

## MeetingJoinRequest
> A non-invited student's request to join a live meeting.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| meeting_id | UUID | FK → Meeting | Which meeting |
| student_id | UUID | FK → Student | Who is requesting |
| status | Enum | default PENDING | `PENDING` `ACCEPTED` `DECLINED` |
| requested_at | DateTime | immutable | When the request was sent |
| resolved_at | DateTime | nullable | When educator accepted or declined |

---

## MeetingChatMessage
> A text message sent during a meeting. Persisted during session for scrollback, not accessible after meeting ends.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| meeting_id | UUID | FK → Meeting | Which meeting |
| sender_id | UUID | FK → User | Who sent it |
| sender_name | String | required | Snapshot of name at send time — preserved even if user is renamed |
| message | Text | required | Message content |
| sent_at | DateTime | immutable | When sent |

---

---

# GROUP 10 — NOTIFICATIONS & LOGS

---

## Notification
> In-app notification for any user. No email or SMS.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org — for scoping |
| recipient_id | UUID | FK → User | Who receives it |
| type | Enum | required | See full type list in DEV-11 Section 2.3 |
| title | String | required | Short header e.g. "Assessment Released" |
| message | Text | required | Full notification text |
| related_entity_type | String | nullable | e.g. "Class", "Assessment", "Meeting" — what the notification is about |
| related_entity_id | UUID | nullable | The ID of the related record for deep-linking |
| created_at | DateTime | immutable | When sent |
| archived_at | DateTime | nullable | Set by the 90-day retention job. Archived notifications are removed from the user's active list. |

---

## AdminAuditLog
> Permanent, append-only log of all high-impact Admin actions. Never deleted.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| timestamp | DateTime | immutable, indexed | When the action occurred |
| actor_id | UUID | FK → User | Which Admin or Platform Owner performed the action |
| action_type | Enum | required | See full type list in DEV-11 Section 3.3 |
| target_type | String | required | e.g. "Student", "Class", "Section" |
| target_id | UUID | required | ID of the affected record |
| details | JSON | required | Action-specific payload. e.g. `{ "old_status": "ACTIVE", "new_status": "SUSPENDED" }` |

---

## EducatorActivityLog
> Class-level event log per educator. Educators see their own. Admin can see all.

| Field | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | Primary key |
| org_id | UUID | FK → Organization | Which org |
| educator_id | UUID | FK → Educator | Which educator's class this event belongs to |
| class_id | UUID | FK → Class | Which class |
| event_type | Enum | required | See full type list in DEV-11 Section 4.3 |
| details | JSON | required | Event-specific context, e.g. `{ "student_id": "...", "student_name": "..." }` |
| created_at | DateTime | immutable, indexed | When event occurred |

---

---

# ENUM REFERENCE

## LevelSection
`ELEMENTARY` `HIGH_SCHOOL` `SENIOR_HIGH` `COLLEGE`

## StudentStatus
`ACTIVE` `PENDING` `DROPPED` `TRANSFERRED` `SUSPENDED` `GRADUATED`

## UserRole
`PLATFORM_OWNER` `ADMIN` `EDUCATOR` `STUDENT`

## CalendarEventType
`HOLIDAY` `NO_CLASS_DAY` `EXAM_WEEK` `SPECIAL_EVENT`

## Weekday
`MON` `TUE` `WED` `THU` `FRI`

## AssessmentType
`QUIZ` `ACTIVITY` `EXAM` `CUSTOM`

## AssessmentStatus
`DRAFT` `GENERATING` `READY` `RELEASED` `CLOSED`

## QuestionType
`MULTIPLE_CHOICE` `TRUE_OR_FALSE` `IDENTIFICATION` `ENUMERATION` `ESSAY`

## StudentAssessmentStatus
`NULL` `EXEMPTED` `CUSTOM` `SUBMITTED` `DRAFT`
> UI label for CUSTOM = "Customized"

## AttemptStatus
`ACTIVE` `SUBMITTED` `CLOSED`

## AttendanceStatus
`PRESENT` `ABSENT` `LATE` `EXCUSED` `NULL`

## AttendanceSource
`AUTO` `MANUAL`

## MeetingStatus
`SCHEDULED` `LIVE` `ENDED`

## MeetingInviteType
`ALL` `SELECTED`

## JoinRequestStatus
`PENDING` `ACCEPTED` `DECLINED`

## ConceptBuildStatus
`PENDING` `RUNNING` `COMPLETE` `FAILED`

## ExtractionTrigger
`AUTO` `MANUAL`

## RubricOwnerType
`ORG_DEFAULT` `EDUCATOR_LIBRARY` `CLASS`

## RubricEntryType
`ASSESSMENT_LINKED` `MANUAL_ENTRY`

## GradeLockSource
`EDUCATOR` `AUTO_LOCK` `PLATFORM_OVERRIDE`

## EnrollmentAddedBy
`AUTO` `ADMIN`

## PendingEnrollmentReason
`SECTION_CAPACITY` `CLASS_CAPACITY`

## PendingEnrollmentResolution
`ENROLLED` `DISMISSED`

---

# TABLE COUNT SUMMARY

| Group | Tables |
|---|---|
| Platform & Auth | User, Organization |
| School Structure | SchoolYear, SemesterTemplate, SemesterPeriod, Course, Strand, Section, AcademicCalendarEvent |
| Accounts | Educator, Student |
| Classes & Subjects | Subject, Class, ClassSession, Enrollment, PendingEnrollment, ClassOwnershipLog |
| Lessons & Concepts | Lesson, ConceptBuild |
| Assessments | Assessment, AssessmentRange, Question, StudentAssessment, AssessmentAttempt, EssayGrade |
| Attendance | AttendanceRecord |
| Grades | RubricTemplate, RubricCategory, ClassRubric, StudentGrade, ManualGradeEntry, GradeLockWindow, PlatformOverrideLog, GradingScale, GradingScaleEntry |
| Meetings | Meeting, MeetingInvite, MeetingJoinRequest, MeetingChatMessage |
| Notifications & Logs | Notification, AdminAuditLog, EducatorActivityLog |
| **Total** | **44 tables** |