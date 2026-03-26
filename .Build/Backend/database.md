# EduTool Database Design (Multi-Tenant, Event-Driven Ready)

Version: v2.0 (Verified against System Planning v8.3)

---

# 0. GLOBAL RULES

* Every table MUST include: `org_id` (except platform_owner tables)
* Use UUID or CUID for primary keys
* Soft delete via `deleted_at`
* All queries MUST enforce `org_id`
* No cross-tenant joins allowed

---

# 1. ACCOUNT & AUTH

## TABLE: accounts

FIELDS:

* id (PK)
* org_id (nullable for Platform Owner)
* role (platform_owner | admin | educator | student)
* email (unique per org)
* password
* status (active | suspended | pending | dropped | transferred | graduated)
* created_at
* updated_at
* deleted_at

WHY:
Central identity system for all users

---

## TABLE: profiles

FIELDS:

* id (PK)
* account_id (FK → accounts.id)
* full_name
* metadata (JSON)
* created_at

WHY:
Separates authentication from profile data

---

## TABLE: student_status_history

FIELDS:

* id
* org_id
* student_id
* old_status
* new_status
* changed_at

WHY:
Required for audit tracking of status transitions

---

# 2. ORGANIZATION

## TABLE: organizations

FIELDS:

* id (PK)
* name
* description
* created_at

WHY:
Tenant boundary

---

# 3. STRUCTURE TABLES

## TABLE: programs

* id
* org_id
* name
* type (standard | custom)

---

## TABLE: levels

* id
* org_id
* program_id
* name

---

## TABLE: sections

* id
* org_id
* level_id
* name
* capacity

---

## TABLE: school_years

* id
* org_id
* name
* status (pending | active | ended)

---

## TABLE: semesters

* id
* org_id
* school_year_id
* name
* start_date
* end_date

---

## TABLE: terms

* id
* org_id
* semester_id
* name (Prelim, Midterm, etc.)
* order_index
* start_date
* end_date

WHY:
Supports term-based grading system

---

## TABLE: calendar_events

* id
* org_id
* school_year_id
* type (holiday | no_class | event)
* date

---

# 4. ACADEMIC CORE

## TABLE: subjects

* id
* org_id
* name
* level_id
* educator_id
* grading_system_id
* is_locked

---

## TABLE: classes

* id
* org_id
* subject_id
* educator_id
* section_id (nullable)
* school_year_id
* semester_id
* capacity
* created_at

---

## TABLE: class_schedules

* id
* org_id
* class_id
* weekday
* start_time
* end_time

WHY:
Replaces JSON schedule for flexibility

---

## TABLE: class_assignment_history

* id
* org_id
* class_id
* educator_id
* assigned_at
* removed_at

WHY:
Tracks educator reassignment history

---

## TABLE: enrollments

* id
* org_id
* class_id
* student_id
* status (active | pending | removed)
* created_at

---

# 5. LESSONS

## TABLE: lessons

* id
* org_id
* class_id
* title
* description
* week_number
* sub_index
* created_at

---

## TABLE: lesson_concepts

* id
* org_id
* lesson_id
* content (JSON)
* created_at

---

# 6. ASSESSMENT SYSTEM

## TABLE: assessments

* id
* org_id
* class_id
* lesson_id
* term_id
* type (quiz | activity | exam | custom)
* total_items
* release_date
* is_published
* created_at

---

## TABLE: questions

* id
* org_id
* assessment_id
* type (mcq | tf | identification | enumeration | essay)
* question_text
* correct_answer (nullable)

---

## TABLE: submissions

* id
* org_id
* assessment_id
* student_id
* status (draft | submitted | exempted | custom)
* score
* manual_score (nullable)
* submitted_at

---

## TABLE: submission_answers

* id
* org_id
* submission_id
* question_id
* answer
* is_correct

---

# 7. GRADING SYSTEM

## TABLE: rubrics (GLOBAL)

* id
* org_id
* name

---

## TABLE: rubric_items

* id
* rubric_id
* name
* weight
* type (assessment | manual)

---

## TABLE: class_rubrics

* id
* org_id
* class_id
* is_locked

---

## TABLE: class_rubric_items

* id
* org_id
* class_rubric_id
* name
* weight
* type

WHY:
Each class has its own locked grading system

---

## TABLE: grade_components

* id
* org_id
* student_id
* class_id
* term_id
* rubric_item_id
* score

WHY:
Stores per-category grading breakdown

---

## TABLE: grades

* id
* org_id
* student_id
* class_id
* term_id
* final_score
* final_grade
* is_locked
* locked_at

---

## TABLE: grading_scales

* id
* org_id
* level_id

---

## TABLE: grading_scale_ranges

* id
* grading_scale_id
* min
* max
* grade
* remark

---

# 8. ATTENDANCE

## TABLE: attendance_sessions

* id
* org_id
* class_id
* date
* week_number
* sub_index

---

## TABLE: attendance_records

* id
* org_id
* session_id
* student_id
* status (present | absent | late | excused)

---

# 9. MEETINGS

## TABLE: meetings

* id
* org_id
* class_id
* title
* start_time
* end_time

---

## TABLE: meeting_participants

* id
* org_id
* meeting_id
* student_id
* status (invited | joined | requested)

---

# 10. TRANSCRIPTS

## TABLE: transcripts

* id
* org_id
* student_id
* school_year_id
* class_id
* final_grade
* data (JSON snapshot)

WHY:
Immutable academic record with queryable fields

---

# 11. SYSTEM TABLES

## TABLE: notifications

* id
* org_id
* account_id
* type
* payload (JSON)
* read_at
* archived_at
* created_at

---

## TABLE: audit_logs

* id
* org_id
* actor_id
* action
* entity_type
* entity_id
* metadata (JSON)
* created_at

---

## TABLE: analytics_snapshots

* id
* org_id
* type
* data (JSON)
* created_at

---

# 12. PLATFORM OWNER

## TABLE: platform_admins

* id
* email
* password
* status

---

# OPTIONAL (ADVANCED)

## TABLE: events_log

* id
* event_name
* payload
* created_at

WHY:
Event debugging and replay system

---

# FINAL DESIGN PRINCIPLES

1. STRICT MULTI-TENANCY
   WHERE org_id = current_user.org_id

2. EVENT-DRIVEN SYSTEM
   All side effects handled via events

3. IMMUTABILITY FOR CRITICAL DATA

   * transcripts
   * audit logs

4. NO HARD DELETES
   Only soft deletes with `deleted_at`

5. TIME-BASED MODELING

   * terms
   * sessions
   * grade locks

---

END OF DOCUMENT
