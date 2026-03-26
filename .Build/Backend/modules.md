# EduTool Backend Module & API Design (NestJS)

Version: v1.0 (Derived from System Planning v8.3)

---

# 0. GLOBAL RULES

* Every request MUST be scoped by `org_id`
* No cross-organization access is allowed
* Events must be used for cross-module communication
* No module should directly call another module's repository

---

# 1. AUTH MODULE

## Endpoints

POST /auth/login
→ Authenticates Platform Owner, Admin, Educator, Student

POST /auth/logout

GET /auth/me

## Standalone

* login
* logout
* me

## Emits Events

* auth.logged_in

---

# 2. ACCOUNT MODULE

## Endpoints

POST /accounts (Admin creates accounts)
GET /accounts
GET /accounts/:id
PATCH /accounts/:id
PATCH /accounts/:id/status
POST /accounts/reset-password
POST /accounts/reset-password/bulk

## Standalone

* get accounts
* update account info

## Emits Events

* account.created
* account.updated
* account.password_reset
* account.status_changed

## Depends On

* organization (org_id validation)

---

# 3. ORGANIZATION MODULE

## Endpoints

POST /organization
GET /organization
PATCH /organization

## Standalone ONLY

(No external dependencies or events required)

---

# 4. STRUCTURE MODULES

## 4.1 PROGRAM

POST /programs
GET /programs
PATCH /programs/:id

Standalone

---

## 4.2 LEVEL

POST /levels
GET /levels

Standalone

---

## 4.3 SECTION

POST /sections
GET /sections
PATCH /sections/:id

## Emits Events

* section.capacity_exceeded

---

## 4.4 SCHOOL YEAR

POST /school-years
GET /school-years
PATCH /school-years/:id/activate
PATCH /school-years/:id/end

## Emits Events

* schoolyear.activated
* schoolyear.ended

---

## 4.5 SEMESTER

POST /semesters
GET /semesters

Standalone

---

## 4.6 ACADEMIC CALENDAR

POST /calendar/events
GET /calendar/events
PATCH /calendar/events/:id

## Emits Events

* calendar.event_created
* calendar.event_updated

---

# 5. SUBJECT MODULE

## Endpoints

POST /subjects
GET /subjects
PATCH /subjects/:id
PATCH /subjects/:id/lock

## Emits Events

* subject.locked

---

# 6. CLASS MODULE

## Endpoints

POST /classes
GET /classes
PATCH /classes/:id
PATCH /classes/:id/reassign

## Emits Events

* class.created
* class.updated
* class.reassigned

## Depends On

* subject
* educator
* school-year
* semester

---

# 7. ENROLLMENT MODULE

## Endpoints

POST /enrollments
DELETE /enrollments/:id
GET /enrollments

## Emits Events

* student.enrolled
* student.removed

## Depends On

* student
* class
* section (validation)
* capacity rules

---

# 8. LESSON MODULE

## Endpoints

POST /lessons
GET /lessons
PATCH /lessons/:id
POST /lessons/:id/extract-concepts

## Emits Events

* lesson.created
* lesson.updated
* lesson.concepts_extracted

## Depends On

* class

---

# 9. ASSESSMENT MODULE

## Endpoints

POST /assessments/generate
GET /assessments
PATCH /assessments/:id
POST /assessments/:id/publish
POST /assessments/:id/unpublish

## Emits Events

* assessment.generated
* assessment.published

## Depends On

* lesson (concept build)
* class

---

# 10. SUBMISSION MODULE

## Endpoints

POST /submissions/start
PATCH /submissions/save-draft
POST /submissions/submit

## Emits Events

* submission.submitted

## Depends On

* assessment
* student

---

# 11. GRADING MODULE

## Endpoints

POST /grading/score
POST /grading/publish
POST /grading/unpublish
POST /grading/lock

## Emits Events

* score.published
* grade.locked

## Depends On

* submission
* assessment
* rubric

---

# 12. RUBRIC MODULE

## Endpoints

POST /rubrics
GET /rubrics
PATCH /rubrics/:id

Standalone

---

# 13. GRADING SCALE MODULE

## Endpoints

POST /grading-scale
GET /grading-scale
PATCH /grading-scale

Standalone (locks after first grade lock)

---

# 14. ATTENDANCE MODULE

## Endpoints

POST /attendance
PATCH /attendance/:id
GET /attendance

## Emits Events

* attendance.marked

## Depends On

* class
* calendar (skip logic)

---

# 15. MEETING MODULE

## Endpoints

POST /meetings
GET /meetings
POST /meetings/:id/start
POST /meetings/:id/end
POST /meetings/:id/join-request

## Emits Events

* meeting.created
* meeting.started
* meeting.ended

## Depends On

* class
* student
* educator

---

# 16. TRANSCRIPT MODULE

## Endpoints

GET /transcripts/:studentId

## Depends On

* grading
* school-year

No events

---

# 17. NOTIFICATION MODULE

## No Public Endpoints (optional read endpoint)

GET /notifications

## Listens To Events

* assessment.generated
* assessment.published
* submission.submitted
* grade.locked
* meeting.created
* student.enrolled

---

# 18. AUDIT LOG MODULE

## Endpoints

GET /audit-logs

## Listens To Events

* account.updated
* enrollment changes
* grading changes
* admin actions

---

# 19. ANALYTICS MODULE

## Endpoints

GET /analytics/dashboard

## Listens To Events

* grade.locked
* enrollment events

---

# 20. EXPORT MODULE

## Endpoints

GET /export/class/:id/csv
GET /export/student/:id/pdf

## Depends On

* grading
* transcript

---

# 21. PLATFORM OWNER MODULE

## Endpoints

POST /platform/admins
GET /platform/admins
PATCH /platform/admins/:id/reset-password
PATCH /platform/admins/:id/block

## Standalone

(No org data access)

---

# FINAL NOTE

Use Event-Driven Architecture:

* NEVER directly call another module's service for side-effects
* ALWAYS emit event → let other modules react

Example:

Enrollment → emits student.enrolled
→ Notification listens
→ Audit Log listens
→ Analytics listens

---
