
---

# EduTool Database Schema 

---

## accounts

* id (PK)
* org_id
* role
* email
* password
* status
* created_at
* updated_at
* deleted_at

---

## profiles

* id (PK)
* account_id (FK → accounts.id)
* full_name
* metadata
* created_at

---

## student_status_history

* id (PK)
* org_id
* student_id
* old_status
* new_status
* changed_at

---

## organizations

* id (PK)
* name
* description
* created_at

---

## programs

* id (PK)
* org_id
* name
* type

---

## levels

* id (PK)
* org_id
* program_id
* name

---

## sections

* id (PK)
* org_id
* level_id
* name
* capacity

---

## school_years

* id (PK)
* org_id
* name
* status

---

## semesters

* id (PK)
* org_id
* school_year_id
* name
* start_date
* end_date

---

## terms

* id (PK)
* org_id
* semester_id
* name
* order_index
* start_date
* end_date

---

## calendar_events

* id (PK)
* org_id
* school_year_id
* type
* date

---

## subjects

* id (PK)
* org_id
* name
* level_id
* educator_id
* grading_system_id
* is_locked

---

## classes

* id (PK)
* org_id
* subject_id
* educator_id
* section_id
* school_year_id
* semester_id
* capacity
* created_at

---

## class_schedules

* id (PK)
* org_id
* class_id
* weekday
* start_time
* end_time

---

## class_assignment_history

* id (PK)
* org_id
* class_id
* educator_id
* assigned_at
* removed_at

---

## enrollments

* id (PK)
* org_id
* class_id
* student_id
* status
* created_at

---

## lessons

* id (PK)
* org_id
* class_id
* title
* description
* week_number
* sub_index
* created_at

---

## lesson_concepts

* id (PK)
* org_id
* lesson_id
* content
* created_at

---

## assessments

* id (PK)
* org_id
* class_id
* lesson_id
* term_id
* type
* total_items
* release_date
* is_published
* created_at

---

## questions

* id (PK)
* org_id
* assessment_id
* type
* question_text
* correct_answer

---

## submissions

* id (PK)
* org_id
* assessment_id
* student_id
* status
* score
* manual_score
* submitted_at

---

## submission_answers

* id (PK)
* org_id
* submission_id
* question_id
* answer
* is_correct

---

## rubrics

* id (PK)
* org_id
* name

---

## rubric_items

* id (PK)
* rubric_id
* name
* weight
* type

---

## class_rubrics

* id (PK)
* org_id
* class_id
* is_locked

---

## class_rubric_items

* id (PK)
* org_id
* class_rubric_id
* name
* weight
* type

---

## grade_components

* id (PK)
* org_id
* student_id
* class_id
* term_id
* rubric_item_id
* score

---

## grades

* id (PK)
* org_id
* student_id
* class_id
* term_id
* final_score
* final_grade
* is_locked
* locked_at

---

## grading_scales

* id (PK)
* org_id
* level_id

---

## grading_scale_ranges

* id (PK)
* grading_scale_id
* min
* max
* grade
* remark

---

## attendance_sessions

* id (PK)
* org_id
* class_id
* date
* week_number
* sub_index

---

## attendance_records

* id (PK)
* org_id
* session_id
* student_id
* status

---

## meetings

* id (PK)
* org_id
* class_id
* title
* start_time
* end_time

---

## meeting_participants

* id (PK)
* org_id
* meeting_id
* student_id
* status

---

## transcripts

* id (PK)
* org_id
* student_id
* school_year_id
* class_id
* final_grade
* data

---

## notifications

* id (PK)
* org_id
* account_id
* type
* payload
* read_at
* archived_at
* created_at

---

## audit_logs

* id (PK)
* org_id
* actor_id
* action
* entity_type
* entity_id
* metadata
* created_at

---

## analytics_snapshots

* id (PK)
* org_id
* type
* data
* created_at

---

## platform_admins

* id (PK)
* email
* password
* status

---

## events_log (optional)

* id (PK)
* event_name
* payload
* created_at

---
