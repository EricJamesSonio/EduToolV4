EDUTOOL — EDUCATOR DOMAIN
==========================

SCOPE
-----
Educators manage all content inside their assigned classes. They cannot create
or modify class structure, cannot enroll or remove students, and cannot view
other educators' classes.

Educator account fields: Full Name, Email, system-generated Educator ID.
Educators cannot change their own passwords.

LESSON MANAGEMENT
-----------------
Properties: Title, Description (optional), Week Assignment,
Lesson Detail (minimum 10 words).

Lesson viewer: calendar layout by week.

Concept Extraction:
- Auto-triggered when a Lesson Detail of 10+ words is saved for the first time
- If lesson content is updated after a concept build exists, educator manually
  triggers re-extraction
- Re-extraction replaces the entire previous concept build
- Runs in background — non-blocking
- In-app notification on completion
- Feeds only the Assessment Generator for this class
- Re-extracting does NOT affect assessments already generated from the old build

Presentation Mode:
- Educator can present lesson content directly inside the meeting room
- All participants follow forward/backward navigation in real time

ASSESSMENT MANAGEMENT
----------------------
Question types:
- Multiple Choice: AI generated, auto-graded on submission
- True or False: AI generated, auto-graded on submission
- Identification: AI generated, auto-graded on submission
- Enumeration: AI generated, auto-graded on submission
- Essay: AI generated, manually graded by educator

Assessment dates:
- Release Date: before this, students see title only — questions are hidden
- End Date: submission deadline, assessment auto-closes

Configuration and generation flow:
1. Select lesson. If no concept build exists, the lesson is blocked.
2. Concept build displays sections and available item counts.
3. Set type (Quiz / Activity / Exam / Custom) and total items.
   System validates — cannot exceed concept build total.
4. Build item ranges — each range has an item span, one question type,
   and one or more concept sections.
5. Generation runs in background — non-blocking.
6. In-app notification when complete.
7. Set release date, end date, assign to students.

Editing generated questions:
- Educator can edit any AI-generated question before the release date
- Editable: question text, answer choices, correct answer
- Once release date passes, questions lock permanently — no further edits

Student assignment statuses:
- NULL (default): not assigned, treated as missed, educator can override
- Exempted: excused, excluded from grade calc, counts as perfect score
- Custom Score: educator manually sets a score
- Submitted: submitted within deadline, feeds grade computation
- Draft: opened but not submitted, auto-saved, student can resume before end date

Attempt control:
- Each student may have only one active attempt per assessment at any time
- If the same student opens the assessment from another tab or device,
  the existing attempt is resumed
- Prevents multiple simultaneous attempts and duplicate submissions

Score publishing:
- Scores are hidden by default
- Educator publishes when ready — to all students or selected students
- On grade lock, ALL unpublished scores are automatically published

Assessment deletion:
- Deleting an assessment after students have submitted wipes all scores
- Final grade recomputes without the deleted assessment
- Soft-deleted (not permanently destroyed)

ATTENDANCE MANAGEMENT
---------------------
Tracked per class session, not per calendar day. Sessions on Holiday or
No Class Day are automatically skipped. View is organized by week.

Auto-attendance from assessments:
- If an assessment is assigned to a student on a given session day and the
  student submits, they are automatically marked Present for that session

Manual attendance statuses:
- Present: student attended
- Absent: student did not attend
- Late: student attended but arrived late
- Excused: absence is formally excused

Weekly layout: each week expands to show its sessions. For each session,
educator sees each enrolled student and their attendance status.

Attendance in grade computation:
- If the rubric includes an Attendance category (manual entry type), educator
  inputs the attendance summary score per student manually
- Raw session-by-session records are for reference only

GRADE MANAGEMENT
----------------
Grading is tracked per term within each semester. Each term (Prelim, Midterm,
Pre-Finals, Finals) has its own assessments and produces its own term grade.
At the end of the semester, the overall subject grade is computed from all
term grades.

Rubric system:
- Admin configures the default rubric, pre-filled at class creation
- Educator can adjust or replace it from their personal rubric library
  or build from scratch
- Rubric locks permanently once the first student is enrolled
- All weights must total exactly 100%

Student grade visibility:
- Assessment scores: visible only after educator publishes them
- Final computed grade: hidden until class grades are locked
- On grade lock: ALL scores auto-published + final grade revealed to students

Grade display modes (educator view):
- Default View: each student's scores per individual assessment item, grouped
  by assessment type, organized by term
- Clean View: assessments grouped by category; scores aggregated if a category
  has more than one assessment

Grade locking:
- Admin enables a lock window with a deadline (e.g. 24 hours)
- Educator locks manually — permanent, no unlocking without Admin override
- On lock: all unpublished scores published, final grade revealed to students
- Auto-lock on deadline: system auto-locks if educator missed the deadline
- Grade lock override: Admin can unlock directly in extreme cases

RUBRIC LIBRARY (Educator)
--------------------------
Each educator has a personal rubric library, private to them within their org.
Educators in other orgs cannot see it.
Educators can build rubrics from scratch, save to library, or adjust for
specific classes (before the first enrollment locks it).

MEETING MANAGEMENT
------------------
Built-in video meeting room — no third-party tools required.
Opens automatically at scheduled date and time.

Properties: Title, Description (optional), Start Date/Time,
Invited Students (all or selected subset).

Built-in room features:
- Video and audio
- Chat (text during meeting)
- Raise hand and reactions
- Screen sharing
- Lesson Presentation Mode (educator displays lesson to all in real time)
- Forward/backward lesson navigation (all participants follow)
- Educator controls muting and presenting

Meetings are NOT recorded. Live only. No playback after session ends.

EXPORTS
-------
PDF — Per Student Class Card: student info, class info, grade breakdown per
rubric category per term, term grades, final overall subject grade and remark,
educator name, org name, school year, semester.

CSV — Full Class Export: all students, all category scores per term, term
grades, final grade, remark, passing status.

Educators can trigger exports for their own classes only.

EDUCATOR ACTIVITY LOG
---------------------
Records class-level events for the educator's own classes.
Educators see only their own logs. Admin can also view these logs for oversight.

Logged events:
- New student enrolled in class (by Admin)
- Student removed from class (by educator or Admin)
- Meeting started / ended
- Assessment created, edited, published, deleted
- Scores published / unpublished
- Grade locked (by educator or auto-lock)
- Lesson created or updated
- Concept extraction triggered / completed

NOTIFICATION TRIGGERS (Educator as recipient)
----------------------------------------------
- Concept extraction complete
- Assessment generation complete
- Class reassigned (when Admin assigns a new class to the educator)
- Grade lock window opened (Admin enables lock window)
- Auto-lock applied (class auto-locked because deadline was missed)
- Student added to class by Admin
- Student removed from class by Admin

WHAT EDUCATORS CANNOT DO
-------------------------
- Create or modify class structure
- Add or remove student enrollments
- View other educators' classes
- Change student profiles or statuses
- See any Admin-level analytics