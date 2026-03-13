Steps of building.

1. DEV-11  — notifications, audit log, activity log, soft delete pattern
2. DEV-01  — org, school year, semester templates, sections, courses, strands, calendar
3. DEV-02  — account creation (educator + student), statuses, bulk import, passwords
4. DEV-05  — subjects, classes, auto-enrollment engine, session generation
5. DEV-03  — student profile editing, enrollment management, transcript
6. DEV-04  — educator class assignments, reassignment, removal
7. DEV-06  — lessons, concept extraction
8. DEV-07  — assessments, generation, attempt control, grading
9. DEV-08  — attendance
10. DEV-09 — grades, rubric, locking, exports
11. DEV-10 — meetings

FileWhat to BuildDEV-01Org creation, school year lifecycle, semester templates, sections, courses/strands, academic calendarDEV-02User roles, educator + student account creation, statuses, password reset, credential export, bulk importDEV-03Profile editing guards, enrollment re-evaluation on profile change, add/remove subject flows, pending enrollment resolution, transcriptDEV-04Educator search, class assignments, mid-semester reassignment, ownership history log, educator removalDEV-05Subject scheduling + conflict validation, class setup, auto-enrollment engine, session generation algorithm, week label computation, archivingDEV-06Lesson CRUD, concept extraction background job, auto/manual trigger rules, presentation mode WebSocket eventsDEV-07Assessment config wizard, AI generation job, question editing + lock, attempt control (resume logic), auto-save, grading, score publishing, deletionDEV-08Attendance record generation, auto-attendance from submissions, manual entry, weekly view API, calendar event integrationDEV-09Rubric system, grade computation per category, grade locking (manual + auto), platform override, grading scale, PDF class cards, CSV exportDEV-10Meeting lifecycle, join requests, WebRTC feature set, lesson presentation sync, calendar suppressionDEV-11Notification model + all triggers, 90-day retention job, Admin audit log (append-only), Educator activity log, soft delete pattern + rules
Important build order: DEV-11 first (or alongside DEV-01), since every other module writes to notifications and logs. DEV-01 → DEV-02 → DEV-05 → DEV-03/04 → DEV-06 → DEV-07 → DEV-08 → DEV-09 → DEV-10.