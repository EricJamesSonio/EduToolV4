# Educator Portal Documentation

Manages teaching for assigned classes only. All routes under `/educator`, guarded by `useRoleGuard(["educator"])` (`frontend/src/app/educator/layout.tsx:15`).

---

## Main Pages

| Page | Route | What it does |
|------|-------|--------------|
| **My Classes** | `/educator/classes` | Cards for assigned classes (subject, program/strand/level/section, schedule, semester, SY, capacity). Entry point for class work. |
| **Activity Log** | `/educator/activity-log` | Filterable log (class, event type, date range, 25/page) of your class actions. |
| **Grading Scheme Library** | `/educator/grading-scheme-library` | Reusable grading scheme templates (weights must sum to 100%). Create/edit/apply to classes. |
| **Schedule** | `/educator/schedule` | Weekly timetable derived from class schedules. |
| **Help / Profile** | `/educator/help`, `/educator/profile` | FAQs and account settings. |

## Class Workspace (`/educator/classes/[classId]`)

Overview shows subject, program/strand/level/section, schedule, capacity, enrolled count + quick links.

### Lessons (`/lessons`)
Weeks grouped by semester/term. Create lesson → system runs **Concept Build** (auto-extracts concepts for the assessment wizard). Re-extract after edits.

### Assessments (`/assessments`)
List with type filter (Quiz/Activity/Exam/Custom), status (Upcoming/Open/Closed), release/end dates, submission & pending-essay counts. **7-step AI wizard** (`/assessments/new`) picks a lesson with completed Concept Build → configures types/ranges → generates → review → publish. Delete removes scores. Detail at `/assessments/[assessmentId]`, submissions at `/submissions`, essay review at `/review`.

### Attendance (`/attendance`)
Sessions auto-generated from class schedule. Grouped by semester/term/week. Open session → mark Present/Absent/Late/Excused, **Mark All Present**, save.

### Grades (`/grades`)
Term tabs. Two modes: **Default** (every assessment column) and **Clean** (category summaries). Edit manual categories (Attendance/Recitation/Participation/Behavior) – auto-save on Enter/Tab. Color: ≥90 green, ≥75 blue, ≥60 amber, <60 red. **Compute** recalculates, **Lock Grades** publishes per term (read-only; admin override possible). Single-term publish page at `/grades/[termId]`, all published at `/published-grades`.

### Other Tabs
- **Grading Scheme** (`/grading-scheme`) – weights per category (100% total). Locks after first enrollment.
- **Grading Scale** (`/grading-scale`) – letter mappings for the class.
- **Meetings** (`/meetings`) – create/list meetings (`/meetings/new`, `/meetings/[meetingId]`, `/meetings/[meetingId]/room`). Invite all or selected students, manage join requests. Live 15 min before start.
- **Presentations / Groupy** – slide decks and grouping tools.

---

## Key Workflows

**Create Assessment:** Class → Assessments → New → pick lesson (green badge) → set type/term/items → set ranges → AI generate → review/edit → set dates → publish.

**Take Attendance:** Class → Attendance → pick week → open session → mark statuses → Save.

**Compute & Lock Grades:** Class → Grades → pick term → edit manual cells → Compute → Lock Grades → confirm.

> Stack: React Query hooks (`useEducatorClasses`, `useAssessments`, etc.), `shadcn/ui` + Tailwind, REST via `frontend/src/api/*`, `sonner` toasts.
