# Student Portal Documentation

Read-only learning workspace for enrolled students. All routes under `/student`, guarded by `useRoleGuard(["student"])` (`frontend/src/app/student/layout.tsx:12`).

---

## Main Pages

| Page | Route | What it does |
|------|-------|--------------|
| **My Classes** | `/student/classes` | Cards for enrolled classes (subject, section, schedule, educator, semester/SY). Filter by semester. |
| **Meetings** | `/student/meetings` | All meetings across classes. **Live** (15 min before → 3h after start), **Upcoming**, **Ended**. Join if invited, else **Request to Join**. |
| **Transcript** | `/student/transcript` | Accordion per school year → semesters → subjects with term grades, final scores, letter grades. Print-optimized. Grades show only after educator locks. |
| **Concerns / Help / Profile** | `/student/concerns`, `/student/help`, `/student/profile` | Submit concerns, FAQs, account settings. |

## Class Workspace (`/student/classes/[classId]`)

Overview card + upcoming assessments (next 3) + grade summary + quick nav.

### Lessons (`/lessons`, `/lessons/[lessonId]`)
Week-grouped, published only. View content, Previous/Next navigation.

### Assessments (`/assessments`, `/assessments/[assessmentId]`, `/assessments/[assessmentId]/result`)
Statuses: **Open / Submitted / Graded / Not Yet Open / Missed / Draft / Exempted**. Actions: **Take Assessment**, **Resume** (draft), **View Result**. Auto-save, countdown timer, flag for review, question types (MC, T/F, Identification, Enumeration, Essay). Essays show *Pending grading* until educator grades.

### Attendance (`/attendance`)
Summary bar (present/absent/late/excused/unrecorded/total) + week-grouped table. Records appear after educator marks them.

### Grades (`/grades`)
Overall average + term cards with score, letter grade, progress bar (≥90 green, ≥75 blue, <75 red). `Not yet released` until educator locks that term.

### Other
- **Meetings** (`/meetings`, `/meetings/[meetingId]`, `/meetings/[meetingId]/room`) – join/request flow, room with mic/cam/chat/raise-hand.

---

## Key Workflows

**Take Assessment:** Class → Assessments → Take/Resume → answer (tap/type) → use grid/flag → Submit → confirm → View Result (essay pending if any).

**Join Meeting:** Meetings → find card → if **Live** click Join (or Request to Join if not invited) → enter room.

**View Transcript/Grades:** Transcript for full history (print button); or Class → Grades for per-class term breakdown.

> Stack: React Query (`useStudentClasses`, `useStudentAssessments`, etc.), `shadcn/ui` + Tailwind, REST via Axios, defensive unwrapping of API responses.
