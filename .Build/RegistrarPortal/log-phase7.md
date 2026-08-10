# Phase 7 — School Year Readiness Gate (activation + enrollment periods)

## Ticket
"School year using in periods" — a school year must be structurally ready before it can be
activated or used as the host of an enrollment period; period dates must end strictly before
the school year starts.

## Rules (confirmed with user)
- **Readiness BLOCKS both** `PATCH /school-years/:id/activate` **and** enrollment-period create/update.
- **Class coverage is a non-blocking warning** (a subject with no class still renders the year not-ready-free; it's informational).
- **Period date rule is strict:** `period.end_date < schoolYear.start_date` (equality rejected).
- **No** separate "ended school year can't host a period" rule — readiness (`!` absent) is the only validity gate for hosting.
- **Program-type-scoped checks:** `college` → each course must have levels; `senior_high` → each strand must have levels; `custom`/`elementary`/`high_school` skip course- and strand-level checks.
- No DB migration needed — all rules derived from existing Prisma relations.

## Issue catalog
Blocking:
- `missing_start_date` — school year has no start date.
- `no_programs` — no programs in the year.
- `program_no_levels` — a program has no levels.
- `course_no_level` — a college course has no levels.
- `strand_no_level` — a senior-high strand has no levels.
- `level_no_sections` — a level has no non-deleted sections.
- `level_no_subjects` — a level has no subjects.

Warning (non-blocking):
- `subject_no_class` — a subject has no non-deleted classes.

## What changed (backend)
- **NEW** `backend/src/modules/school-year/school-year-readiness.service.ts`:
  - `detail(orgId, schoolYearId, { includeWarnings })` → `{ ready, blockingCount, warningCount, issues }`
    per-issue `{ code, severity, message, ref? }` capped at 20 per code.
  - `summarizeAll(orgId)` → `Record<schoolYearId, { ready, blockingCount, warningCount }>` using
    grouped `_count`/`groupBy` queries (start missing, no programs, no levels, no sections) — light for the list page.
  - `assertReady(orgId, schoolYearId)` — throws `SCHOOL_YEAR_NOT_READY` (400) listing blocking issues (warnings never block).
- `backend/src/modules/school-year/school-year.service.ts` — `activate()` now calls
  `readinessService.assertReady(orgId, id)` before the no-start-date check.
- `backend/src/modules/school-year/school-year.controller.ts` — added
  `GET /school-years/readiness` and `GET /school-years/:id/readiness` (both under
  `@UseGuards(AuthGuard, RolesGuard)`, any role can view).
- `backend/src/modules/school-year/school-year.module.ts` — provider + export `SchoolYearReadinessService`.
- `backend/src/modules/enrollment-portal/registrar/enrollment-registrar.service.ts`:
  - `createPeriod` → `assertBeforeSchoolYearStart(dto.end_date, schoolYear.start_date)` + `readinessService.assertReady(...)`.
  - `updatePeriod` → same date rule using `period.schoolYear.start_date`; readiness gate not re-run (year already validated at creation).
  - NEW private `assertBeforeSchoolYearStart(end, schoolYearStart)` — rejects `end >= start` with
    `"Enrollment period must end strictly before the school year starts."`
- `backend/src/modules/enrollment-portal/registrar/enrollment-registrar.repository.ts`:
  `findSchoolYear` select gained `name, start_date, status`; `findPeriodById` now includes
  `{ schoolYear: { select: { id, start_date } } }`.
- `backend/src/modules/enrollment-portal/enrollment-portal.module.ts` — imports `SchoolYearModule`
  (no cycle: school-year module never imports enrollment-portal).

## What changed (frontend)
- `frontend/src/types/admin/school-year.types.ts` — added `ReadinessSeverity`, `ReadinessIssue`,
  `SchoolYearReadiness`, `ReadinessSummary`.
- `frontend/src/api/admin/school-year.api.ts` — `getReadinessSummaries()` and `getReadiness(id)`.
- `frontend/src/hooks/queryKeys.factory.ts` — `schoolYears.readiness()` and `schoolYears.readinessDetail(id)`.
- `frontend/src/app/admin/school-years/page.tsx` — fetches summary (via `useAsyncQuery`) and passes
  per-year `readiness` into each `SchoolYearCard`.
- `frontend/src/components/admin/school-years/SchoolYearCard.tsx` — amber `CircleAlert` (`!`) badge next to
  name + disabled "Set Active" when `readiness && !readiness.ready`.
- `frontend/src/app/admin/school-years/[id]/page.tsx` — readiness panel: green "ready to use" vs
  amber "not ready (N blocking)" with per-issue list (blocking = amber dot, warning = sky dot); reads `getReadiness(id)`.
- `frontend/src/components/admin/enrollment-portal/EnrollmentPeriodModal.tsx`:
  - `useAsyncQuery` readiness detail for the selected school year (enabled only when `syId` set).
  - Inline amber warning when the selected year is not ready.
  - New inline `schoolYearError` (strict end < schoolYear start) shown under Closing date.
  - `formValid` also requires `readiness?.ready`.
  - `handleSubmit` now `try/catch`es `mutateAsync` and surfaces the backend `message` via new
    `formError` state rendered in the footer (replaces the previous silent rejection).

## Verification
- Backend `npx tsc --noEmit -p tsconfig.json` — **zero errors in all changed files** (only pre-existing
  test-file + `database.provider.ts` errors remain).
- `npm run build` (backend) — **Successfully compiled: 394 files** with SWC.
- Frontend `npx tsc --noEmit` — **zero errors in changed files** (the 42 pre-existing `CreateClassDialog.test.tsx`
  + `SubjectDialog.test.tsx` errors are the unchanged baseline).
- Frontend `npx eslint` on changed files — no new errors; only the pre-existing `queryKeys.factory.ts`
  `no-explicit-any` block plus the existing modal `explicit-module-boundary-types` warning.
- `npx next build` — **Compiled successfully** (all routes).

## Manual QA checklist
Backend reset/seed then walk with an admin login:

Activation gating:
1. [ ] Create a pending school year → leave start date empty or no programs/levels/sections → "Set Active"
      is disabled on the card; the `!` badge shows.
2. [ ] Attempt `PATCH /school-years/:id/activate` via API → 400 `SCHOOL_YEAR_NOT_READY` with the blocking issue list.
3. [ ] Add programs→levels→sections (and subjects) until blocking issues resolve → `!` disappears,
      "Set Active" re-enables → activation succeeds.

Detail page readiness:
4. [ ] Open a not-ready year → amber panel lists blocking + (warning) subject_no_class issues.
5. [ ] Open a ready year → green "ready to use" panel.

College vs senior_high vs custom:
6. [ ] College program missing a level on any course → `course_no_level` blocking.
7. [ ] Senior high strand missing a level → `strand_no_level` blocking.
8. [ ] Custom/elementary/high_school programs with no courses/strands host no such blocking issue.

Enrollment period date + readiness:
9. [ ] Creating a period for a not-ready year → API 400 (SCHOOL_YEAR_NOT_READY); modal shows amber warning
      and disables Create.
10. [ ] Creating a period whose end date >= school year start → client `schoolYearError` + API 400
      "must end strictly before the school year starts".
11. [ ] A period ending before the school year start on a ready year → created successfully.
12. [ ] Updating a period's closing date past school-year start → rejected with the same message.

Class-coverage is a warning:
13. [ ] A ready year where a subject has no class still activates (blocking count = 0) and the warning is shown on detail.

## Follow-up — Live readiness updates (no page reload)
Readiness is derived data, so it now refreshes automatically the moment any readiness-affecting
mutation succeeds, without a manual reload. Reads reflect the new state immediately.

How it works: `queryKeys.admin.schoolYears.readiness()` is the parent prefix of every
`readinessDetail(id)`, so invalidating the summary key cascades to the list, the detail panel, and
the period modal (React Query prefix-matching, `exact: false`). It was added to the `invalidateKeys`
of every mutation that can change readiness:

- **Sections** (`useSections.ts`): create / update / delete.
- **Subjects** (`useSubject.ts`): create / update (class coverage warning).
- **Levels** (`useLevels.ts`): update default levels, update single level.
- **Programs** (`useProgram.ts`): create / update / delete. The create mutation was refactored so its
  invalidation uses `useQueryClient().invalidateQueries` directly (the prior `onSuccess`-returned
  `invalidateKeys` object was dead code — `useMutationWithInvalidation` ignores it).
- **Courses** (`useCourses.ts`): create / update / delete.
- **Strands** (`useStrand.ts`): create / update / delete.
- **Classes** (`useClasses.ts`): create / update / archive (drives the `subject_no_class` warning).
- **SchoolYearCard** (`SchoolYearCard.tsx`): activation / end now also invalidate readiness.

Verified: `npx tsc --noEmit` (still only the 42 pre-existing test-file errors), eslint on the changed
hooks (no new issues — remaining are the pre-existing `error: any` handlers / unused-arg warnings /
module-boundary warnings), `npx next build` compiled successfully.

### Manual QA — live updates
1. [ ] On the school-years list, open a pending year; with no programs the `!` badge shows.
2. [ ] Create a program from that year's detail → navigate back to the list → `!` already cleared/updated without reload.
3. [ ] Add a level on an empty program → detail readiness panel flips to reflect `no_levels` resolved immediately.
4. [ ] Create a section + subject under a level → `level_no_sections`/`level_no_subjects` clear live; "Set Active" re-enables on the list without reload.
5. [ ] Create a class for a subject → the `subject_no_class` warning disappears live.
6. [ ] Activate a ready year → list badges/status update immediately.
7. [ ] Delete a level/section/subject → the corresponding readiness issue reappears live.

## Follow-up — "Set Active" shows why when not ready
When a pending school year is **not ready**, the "Set Active" card button is now rendered grayed-out
(disabled-looking) but remains **clickable**. Clicking opens a `SchoolYearReadinessDialog` that lists
the exact blocking issues (and warnings) that must be resolved — the same detail shown on the detail page.

Changes:
- NEW `frontend/src/components/admin/school-years/SchoolYearReadinessDialog.tsx` — a dialog reusing the
  `readinessDetail(id)` query (enabled only while open) that renders **Blocking issues** (amber bullets)
  and **Warnings** (sky bullets) verbatim from the backend, with a loading spinner and Close button.
- `SchoolYearCard.tsx` — added `readinessOpen` state; when `notReady`, the button uses a muted
  `cursor-not-allowed` style and `onClick` opens the dialog instead of the activate confirm. The real
  `disabled` prop is now only `isMutating`, so the not-ready click still registers. When ready,
  behavior is unchanged (opens the activation confirm).
- The dialog reads the same query key family as the list/detail, so it reflects the live-updated data
  from the earlier follow-up.

Verified: `npx tsc --noEmit` (only the pre-existing 42 test-file errors), eslint on the two changed
files (only the app-wide `explicit-module-boundary-types` warning), `npx next build` compiled
successfully.

### Manual QA — not-ready "Set Active"
1. [ ] Open the school-years list with a pending year missing programs → button renders grayed with `!` badge.
2. [ ] Click the grayed "Set Active" → a modal opens titled "School Year Not Ready".
3. [ ] The modal lists the blocking issue(s) (e.g. `School year "X" has no programs.`), styled amber.
4. [ ] Add a program + level → button still grayed (missing sections/subjects) → reopen modal shows the remaining blocking issues live.
5. [ ] Fully ready the year → button re-enables to normal color → clicking opens the activation confirm (not the readiness dialog).
6. [ ] A ready year whose subject lacks a class → modal shows the `subject_no_class` entry under Warnings (sky), and activation still proceeds normally.

## Follow-up — No past start date + shared date constraints
The start date can no longer be set to a past date in **both** school-year creation UIs (backend
validation already enforced this; this is a UX/discouragement improvement). The date-constraint logic
was extracted so both places share a **single source of truth**.

Changes:
- NEW `frontend/src/lib/school-year-dates.ts` — shared date helpers:
  - `parseLocalDate`, `todayLocal`, `toDateInput`.
  - `startDatePickerDisabled(date)` — calendar `DatePicker` predicate blocking dates before today.
  - `startDateMin()` — native `<input type="date">` `min` (today), so past days aren't selectable.
  - `endDatePickerDisabled(date, startDate?)` — blocks past dates and dates before the chosen start.
  - `endDateMin(startDate?)` — native input `min` = start date (or today when none chosen).
- `CreateSchoolYearDialog.tsx` — Start Date uses `startDatePickerDisabled`; End Date uses
  `endDatePickerDisabled(date, startDate)`. Removed the local `parseLocalDateForCompare`.
- `data-seeder/SchoolYearStep.tsx` — Start Input now has `min={startDateMin()}`; End Input has
  `min={endDateMin(startDate)}` (past dates and dates before start are unselectable).

Verified: `npx tsc --noEmit` (only the pre-existing 42 test-file errors), eslint on the new util and
both callers (only the app-wide `explicit-module-boundary-types` warning on the existing component),
`npx next build` compiled successfully.

### Manual QA — no past start date
1. [ ] Create dialog: open Start Date calendar → all days before today are disabled; today + future selectable.
2. [ ] Create dialog: pick a start → End Date calendar disables days before that start.
3. [ ] Data Seeder: Start `<input type="date">` opens at today's month; past days are unselectable (`min`).
4. [ ] Data Seeder: pick a start → End `<input>`'s `min` tracks the start (can't select earlier).