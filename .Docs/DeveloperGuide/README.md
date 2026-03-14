
---

# Steps of Building

1. **DEV-11** — Notifications, audit log, activity log, soft delete pattern
2. **DEV-01** — Organization, school year lifecycle, semester templates, sections, courses, strands, academic calendar
3. **DEV-02** — Account creation (educator + student), statuses, bulk import, passwords
4. **DEV-05** — Subjects, classes, auto-enrollment engine, session generation
5. **DEV-03** — Student profile editing, enrollment management, transcript
6. **DEV-04** — Educator class assignments, reassignment, removal
7. **DEV-06** — Lessons, concept extraction
8. **DEV-07** — Assessments, generation, attempt control, grading
9. **DEV-08** — Attendance
10. **DEV-09** — Grades, rubric, locking, exports
11. **DEV-10** — Meetings

---

# Development Modules

### DEV-01 — Organization & Academic Structure

* Organization creation
* School year lifecycle
* Semester templates
* Sections
* Courses / strands
* Academic calendar

### DEV-02 — User Accounts

* User roles
* Educator and student account creation
* Account statuses
* Password reset
* Credential export
* Bulk import

### DEV-03 — Student Management

* Profile editing guards
* Enrollment re-evaluation when profile changes
* Add / remove subject flows
* Pending enrollment resolution
* Transcript generation

### DEV-04 — Educator Assignment

* Educator search
* Class assignments
* Mid-semester reassignment
* Ownership history log
* Educator removal

### DEV-05 — Subjects & Class Scheduling

* Subject scheduling
* Conflict validation
* Class setup
* Auto-enrollment engine
* Session generation algorithm
* Week label computation
* Archiving

### DEV-06 — Lessons

* Lesson CRUD
* Concept extraction background job
* Auto / manual trigger rules
* Presentation mode WebSocket events

### DEV-07 — Assessments

* Assessment configuration wizard
* AI generation job
* Question editing and locking
* Attempt control (resume logic)
* Auto-save
* Grading
* Score publishing
* Assessment deletion

### DEV-08 — Attendance

* Attendance record generation
* Auto-attendance from submissions
* Manual attendance entry
* Weekly view API
* Calendar event integration

### DEV-09 — Grading System

* Rubric system
* Grade computation per category
* Grade locking (manual + automatic)
* Platform override
* Grading scale
* PDF class cards
* CSV export

### DEV-10 — Meetings

* Meeting lifecycle
* Join requests
* WebRTC feature set
* Lesson presentation synchronization
* Calendar suppression

### DEV-11 — Notifications & Logs

* Notification model and triggers
* 90-day retention job
* Admin audit log (append-only)
* Educator activity log
* Soft delete pattern and rules

---

# Important Build Order

1. **DEV-11** *(build first or alongside DEV-01)*

   * Every module writes to notifications and logs.

2. Recommended development flow:

```
DEV-11 → DEV-01 → DEV-02 → DEV-05 → DEV-03 → DEV-04 → DEV-06 → DEV-07 → DEV-08 → DEV-09 → DEV-10
```

---