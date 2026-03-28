EDUTOOL — STUDENT DOMAIN
=========================

SCOPE
-----
Students can take assessments, attend meetings, view published scores, view
locked final grades, and access their full transcript history.
Students cannot modify any academic data or view other students' data.

Accounts are created by Admin. Students cannot register themselves and cannot
change their own passwords.

Student profile fields: Full Name, Email, Student ID (Admin-assigned),
Level Section, Grade/Year Level, Section, Strand (Senior High),
Course (College or custom program).

ACCOUNT STATUSES
----------------
- Active: normal enrolled student, full access
- Pending: no section assigned yet (capacity conflict or incomplete profile)
- Dropped: account is read-only, enrollments removed, transcript preserved
- Transferred: same behavior as Dropped
- Suspended: cannot log in, account and enrollments remain intact
- Graduated: read-only, full transcript accessible

ASSESSMENTS
-----------
Students can view an assessment's title before the release date.
Questions are hidden until the release date.
After the release date: student can open and answer questions.
After the end date: submission is no longer accepted.

Attempt control:
- Each student has only one active attempt per assessment at any time
- If the student opens the assessment from another tab or device,
  the existing attempt is resumed (no duplicate attempts possible)
- In-progress answers are auto-saved (Draft status)
- Student can resume a Draft before the end date

Student assignment statuses visible to student:
- Assigned: assessment is available
- Draft: student opened but hasn't submitted yet
- Submitted: submitted on time
- Missed (NULL with no override): not submitted, treated as missed
- Exempted: excused by educator, excluded from grade calc
- Custom Score: educator manually set a score

SCORES AND GRADES
-----------------
- Assessment scores: visible only after educator publishes them
- Final computed grade: hidden until class grades are locked
- On grade lock: ALL scores (including previously unpublished ones) are
  automatically revealed, and the final grade becomes visible

TRANSCRIPT
----------
Students have access to their full transcript history across all years,
semesters, and terms. This is read-only and always accessible regardless
of current account status (except Suspended cannot log in at all).

MEETINGS
--------
Students receive an in-app notification when they are invited to a meeting.
In the meeting room, students can:
- Use video and audio
- Use chat (text during meeting)
- Raise hand / use reactions
- View the educator's screen when sharing
- Follow lesson presentation in real time (forward/backward navigation
  follows the educator's pace)

Students cannot control muting of others or control the lesson navigation.
Meetings are not recorded. No playback after session ends.

NOTIFICATIONS (Student as recipient)
-------------------------------------
- Assessment released: when the release date is reached for an assigned assessment
- Assessment deadline approaching: before the end date of an assigned assessment
- Score published: educator publishes a score
- Grades locked — scores visible: when class grades are locked
- Meeting created: when invited to a new meeting
- Enrolled in subject/class: when Admin adds the student to a class

WHAT STUDENTS CANNOT DO
------------------------
- View questions before the release date
- Submit after the end date
- Have more than one active attempt at the same time
- Change their own password
- Change any academic data
- View other students' grades, scores, or profiles
- View unpublished scores before educator publishes them
- View their final grade before grade lock
- Access any Admin or Educator functionality