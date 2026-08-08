# Phase 6 Status Report — Students Scope, Manual Enrollment, Periods Lock-Down + QA Pass

## What changed
- `frontend/src/app/admin/enrollment-portal/periods/page.tsx` — when `useRole().isRegistrar` is true:
  - "New Period" action button in the `PageHeader` is hidden.
  - Per-row **Edit** and **Delete** icon buttons are hidden.
  - The list itself (name, token, school year, open/lock/close dates, "Copy application link") stays fully visible, and the row click-through to the period dashboard still works.
  - `EnrollmentPeriodModal` needed no change — the only entry points to it are the buttons above, so a disabled/hidden trigger is sufficient to make periods read-only for registrars.

## What was investigated and required NO change (reported per the "report findings" instruction)
1. **`EditStudentDialog.tsx`** — Inspected. The dialog is already restricted by design to **contact info only**: editable `fullName` + `email`, an avatar upload, and a note pointing users to enrollment flows for program/level/section changes. There are no academic-assignment or enrollment-record fields rendered in this dialog, so there is nothing more to restrict for registrars — the "contact info and status only" rule is already satisfied by the existing single component. A registrar can already change contact fields; status is managed via the separate `UpdateStatusDialog` (also unforked, role-agnostic). No `isRegistrar`-conditional rendering is needed — an explicit no-op reported rather than inventing a change.
2. **Manual enrollment (`/admin/enrollment/enroll`, incl. `_components/`)** — No `role === 'admin'`-style or registrar-incompatible gate exists in the page or any `_components` file (grep for `role|isRegistrar|useRole` found only the `useSchoolYears`/`useLevels`/etc. which are data hooks, and the link back to `/admin/enrollment`). A registrar reaches the page via the Phase-4 sidebar nav and passes the existing admin-route `useRoleGuard` because their `role` stays `'admin'`. Full enroll/unenroll/view access confirmed with no blocker to change.

## Verification
- `npx tsc --noEmit` — zero errors in changed files; only the pre-existing 42 test-file errors remain (baseline unchanged).
- `npx eslint` on periods page — 0 errors, 1 pre-existing `explicit-module-boundary-types` warning (page components don't annotate returns).
- `npx next build` — **Compiled successfully** (Next.js 16, all routes).

## Manual QA checklist (registrar test account)
Walk these with a real registrar login (`is_registrar: true`, `role: admin`):

1. **Sidebar contents**
   - [ ] Shows only: Enrollment Portal (dashboard), Periods, Applications, Manual Enrollment (/admin/enrollment/enroll), Students, Sections.
   - [ ] Everything else (Classes, Grading, Subjects, Lessons, Meetings, Assessments, Programs, School Years, Analytics, Organization, Educators, Registrars, Dashboard, Grade Lock, Audit Log, etc.) is absent.
2. **Periods (view-only for registrar)**
   - [ ] Open `/admin/enrollment-portal/periods` — see the period list with dates/status/share link.
   - [ ] No "New Period" button shown.
   - [ ] No pencil/trash icons on any row.
   - [ ] Clicking a row still opens the period dashboard (read-only view).
   - [ ] (Admin control login) same page shows New Period + edit/delete controls.
3. **Applications (full)**
   - [ ] Approve an application → account is created downstream.
   - [ ] Reject with a reason → applicant gets an email with the reason.
   - [ ] "Unlock all" / re-lock works and toggles period state.
4. **Manual enrollment (full)**
   - [ ] Enroll a student into a school year → program → section → class; remove an enrollment; view works.
5. **Students (limited edit)**
   - [ ] Open student detail; the Edit dialog exposes only contact fields (name, email) + status; no academic/enrollment controls inside it.
   - [ ] Changing a section/program is only available through the enrollment/section flows, not the profile dialog (matching Phase 5 behavior).
6. **Sections (full incl. move)**
   - [ ] Create a new section for a school year → saves.
   - [ ] Edit capacity; lowering below the enrolled count shows the backend Phase-2 message inline (verbatim) and rejects.
   - [ ] From a section's roster, "Move" a student → picker filtered to matching level/course/strand shows capacity per option → saving calls the Phase-3 endpoint.
   - [ ] Move a student into a full or level-mismatched section → inline error shown (with matching count).

## Deviations / notes
- No `isRegistrar` conditional was added to `EditStudentDialog` because the investigation found the dialog already implements the intended restriction; forcing a flag-driven field-set would be a no-op or would require adding fake fields. Flagged per the "report findings, only change if there's an actual blocker" instruction.
- Phase-1's backend API-level `TODO` remains intentionally untouched; enforcement is UI-scoped for v1.