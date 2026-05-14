========================================
PRISMA DATABASE DOCUMENTATION
========================================

## SYSTEM OVERVIEW

This database is designed for a multi-organization academic system.

Key Concepts:

- Multi-tenant (org_id separates data per organization)
- Role-based accounts
- Academic structure (Program → Course/Strand → Level → Section)
- Flexible grading and enrollment system
- Reusable templates (grading, semesters)

---

## GLOBAL RULES

1. MULTI-TENANCY

- Almost all tables include org_id
- Data MUST NOT mix between organizations
- Always filter queries by org_id

2. SOFT DELETE

- Tables with deleted_at use soft delete
- Do NOT permanently remove records unless necessary

3. TIMESTAMPS

- created_at → record creation
- updated_at → auto-updated on change
- deleted_at → soft delete marker

4. ENUM USAGE

- Enums enforce strict states
- Avoid using raw strings for statuses

5. RELATION CONSISTENCY

- Foreign keys must always match org_id context
- Avoid cross-org relationships

---

## ENUMS

Role

- Defines system-level roles
- platform_owner → highest authority
- admin → organization manager
- educator → teacher
- student → learner

AccountStatus

- Lifecycle of accounts
- active, suspended, pending, etc.

EnrollmentStatus

- Controls enrollment state
- active, pending, removed

SubmissionStatus

- Tracks student submissions

AttendanceStatus

- present, absent, late, excused

---

## CORE TABLES

## Organization

Purpose:

- Represents a tenant (school or institution)

Rules:

- email_extension must be unique
- admin_account_id links main admin

Reusability:

- GLOBAL (top-level entity)

---

## Account

Purpose:

- Login and authentication entity

Rules:

- email must be unique globally
- (org_id + email) must also be unique
- role determines permissions

Reusability:

- GLOBAL (used across system)

---

## Profile

Purpose:

- Stores user personal info

Rules:

- 1:1 with Account
- metadata allows flexible extensions

Reusability:

- GLOBAL reusable profile layer

---

## STRUCTURE (ACADEMIC HIERARCHY)

## Program

Purpose:

- Top-level academic grouping (e.g., BSCS, SHS)

Rules:

- Linked to SchoolYear
- Has semester assignment

Reusability:

- ORG-SCOPED

---

## Course / Strand / Level

Purpose:

- Course → college track
- Strand → SHS specialization
- Level → year level (e.g., Grade 10)

Rules:

- Belong to Program
- Can share subjects

Reusability:

- ORG-SCOPED reusable structure

---

## Section

Purpose:

- Student grouping (class section)

Rules:

- Must belong to Level
- Optional Course/Strand
- capacity must be respected

---

## SchoolYear

Purpose:

- Academic cycle container

Rules:

- Controls all academic data lifecycle
- status: pending → active → ended

---

## ENROLLMENT SYSTEM

## StudentSchoolYear

Purpose:

- Tracks student per school year

Rules:

- Unique per student + school year
- Entry point for enrollment

---

## StudentProgramEnrollment

Purpose:

- Tracks student inside a program

Rules:

- Unique per (student_school_year + program)
- Optional assignment to level/course/section

---

## SEMESTER SYSTEM

## SemesterTemplate (GLOBAL TEMPLATE)

Purpose:

- Reusable semester structure

Rules:

- Defined per program type
- Contains semesters and terms

Reusability:

- GLOBAL reusable template

---

## ProgramSemesterAssignment

Purpose:

- Assign template to program

Rules:

- One template per program

---

## ProgramSemesterTermDate

Purpose:

- Actual calendar dates per term

Rules:

- Unique per assignment + term

---

## ACADEMIC (SUBJECTS & CLASSES)

## Subject

Purpose:

- Defines a subject

Rules:

- Can belong to multiple structures
- is_locked prevents edits

---

## SubjectSharing

Purpose:

- Allows subject reuse across structures

Rules:

- Prevent duplicate sharing via unique constraints

---

## Class

Purpose:

- Actual class instance

Rules:

- Must belong to subject + school year + semester
- capacity must be enforced

---

## Enrollment

Purpose:

- Student enrollment in a class

Rules:

- status controls participation

---

## GRADING SYSTEM

## GradingScale

Purpose:

- Defines grade ranges

Rules:

- Unique per program + school year
- Can be locked

---

## GradingSchemeTemplate (GLOBAL)

Purpose:

- Reusable grading logic

Rules:

- Admin-defined
- Can match program type

Reusability:

- GLOBAL reusable

---

## GradingScheme (CLASS-LEVEL)

Purpose:

- Actual grading system per class

Rules:

- Must belong to a class
- Can be locked after use

---

## Grade

Purpose:

- Final computed grade

Rules:

- Unique per student + class + term
- Can be locked

---

## GradeLock SYSTEM

Purpose:

- Controls grade finalization

Rules:

- Only one lock per class
- Settings define behavior

---

## ASSESSMENTS

## Assessment

Purpose:

- Exams, quizzes, tasks

Rules:

- Linked to class and term
- is_published controls visibility

---

## Submission

Purpose:

- Student answers

Rules:

- Tracks status and score

---

## LESSONS

## Lesson

Purpose:

- Weekly structured content

Rules:

- Unique per class + week + sub_index

---

## ATTENDANCE

## AttendanceSession

Purpose:

- Attendance event

---

## AttendanceRecord

Purpose:

- Student attendance

---

## MEETINGS

## Meeting

Purpose:

- Live/virtual class session

Rules:

- Can have invites and join requests

---

## SYSTEM TABLES

## Notification

Purpose:

- User notifications

---

## AuditLog

Purpose:

- Tracks system actions

Rules:

- Important for debugging and security

---

## MeetingChatMessage

Purpose:

- Chat inside meetings

---

========================================
REUSABILITY SUMMARY
========================================

GLOBAL REUSABLE:

- Organization
- Account
- Profile
- SemesterTemplate
- GradingSchemeTemplate

ORG-SCOPED REUSABLE:

- Program
- Course / Strand / Level
- Subject
- GradingScale

CLASS-SCOPED:

- Class
- GradingScheme
- Enrollment
- Assessment
- Grade

STUDENT-SCOPED:

- StudentSchoolYear
- StudentProgramEnrollment
- Submission
- AttendanceRecord

========================================
END OF DOCUMENT
========================================
