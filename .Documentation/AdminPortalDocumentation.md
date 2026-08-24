# Admin Portal Documentation

Admins manage one school/organization. All data is scoped to `org_id` and, where applicable, to the selected **School Year** (`/admin`).

**Auth:** `role = admin`, `AuthGuard + RolesGuard`. Login via `/login` with admin email/password. Active school year is auto-selected but switchable in most pages.

---

## Dashboard (`/admin` , `/admin/dashboard`)

Overview for the selected school year: total students, educators, active classes, pending students, and an enrollment breakdown table (level/section/program with active/pending/total counts).

## Organization (`/admin/organization`)

- **Details** – name/description + logo upload.
- **Email Extension** – required before creating educators/students/registrars (e.g. `school.edu.ph`). Generates addresses like `user@<ext>` and `user@registrar.<ext>`.
- **Data Seeder** – quick-generate programs, levels, courses, sections, strands. See `SchoolProfile-ConfigurationAndDataSeeder.md` for the profile → seeder flow.

## Academic Structure

| Page | Route | Purpose |
|------|-------|---------|
| **School Years** | `/admin/school-years` | Create/activate school years (one active at a time). |
| **Programs** | `/admin/programs` | Programs per school year (e.g. BS CS, STEM). Delete only if no children. |
| **Sections** | `/admin/sections` | Sections under Level, filtered by program → course/strand → level. |
| **Semester Settings** | `/admin/semester-settings` | Semester templates per program type, then assign to programs per SY. |
| **Subjects** | `/admin/subjects` | Major/minor subjects, hierarchy filters + search, lock/unlock (read-only when locked). |
| **Classes** | `/admin/classes` | Assign subject + educator + schedule + section + semester. Filter by semester/educator/SY. Archive to hide. |

## People

- **Students** (`/admin/students`) – create, CSV import, credential export, filter by status/section/program/level. `pending` appears on Dashboard. Detail page at `/students/[id]`.
- **Educators** (`/admin/educators`) – create, search, reset password. Requires email extension.
- **Registrars** (`/admin/registrars`) – create registrar accounts (username + full name → `user@registrar.<ext>`). Suspend/activate, reset password, soft-delete. See Registrar docs.

## Enrollment

- **Manual Enrollment** (`/admin/enrollment` + `/enroll`) – stepper to enroll students into program/course/strand/level and assign section/class.
- **Enrollment Portal** (`/admin/enrollment-portal`) – **registrar-gated** but also visible to admins (read-only for registrars on periods). Dashboard with period selector, stats (total/in-review/enrolled/rejected), and department breakdown. **Periods** (`/periods`) manage `start_date < lock_date ≤ end_date < SY start`, token generation, overflow action. **Applications** (`/applications`, `/applications/[id]`) – search by code/email, filter by status/period, approve (creates student account) / reject (with reason) / unlock (locked → pending).

## Grading

- **Grading Scales** (`/admin/grading-scales`) – global scale templates + assign per program per SY.
- **Grading Schemes** (`/admin/grading-schemes`) – component weights (e.g. 40/30/30) → assign to program or override per class.
- **Grade Lock** (`/admin/grade-lock`) – lock templates with deadlines, assign to classes, override per class. Hierarchy filters + stats.

## Operations

- **Academic Calendar** (`/admin/academic-calendar`) – holiday base calendar + per-program calendars/breaks, scoped to SY.
- **Audit Log** (`/admin/audit-log`) – **Audit Log** tab (admin actions) + **Activity Log** tab (per-class educator actions). Date/action/entity filters, expandable metadata, CSV export.
- **Concerns** (`/admin/concerns`) – student concerns inbox.

## Profile (`/admin/profile`)

Shared `ProfileContent` – edit personal info/password.

> **Guards & Notes:** Requires `emailExtension` before people-creation. Most lists use `useAsyncQuery`/`React Query`. Period/application routes additionally require `@Registrar()` (`is_registrar === true`) on backend (`backend/src/modules/enrollment-portal/registrar/*:39`).
