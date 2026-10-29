# Admin lifecycle flow — verification against backend

Source draft: `.Build/flow/admin.md`
Verified against: `backend/src` working tree on 2026-10-29.
Scope: backend behavior and role gates. Frontend was not exhaustively audited.

## Verdict

The draft is directionally correct, but four statements do not match the current backend:

1. A pending school year **can** be used for enrollment once it is readiness-clean. `active` is not required.
2. Readiness does **not** check “all sections have all schedules”; it checks that each section has at least one class. It also requires a program calendar and a semester template with term dates.
3. Year-end does **not** set outcomes, compute final grades, or promote students. It only marks the year ended, removes class enrollments, and unenrolls the `StudentSchoolYear`.
4. “Current year only” is true for the student availability endpoint, but the admin eligible-classes endpoint can include classes from ended years because it does not filter `StudentSchoolYear.status`.

There are also code defects that affect this flow: a broken platform-login token, a cross-tenant calendar-delete bug, and missing educator ownership checks on attendance.

---

## Stage-by-stage verification

### 1. School owner requests an account

**Verified.**

- Public applicant routes are under `auth`:
  - `POST /auth/admin-request/otp`
  - `POST /auth/admin-request/verify`
  - `POST /auth/admin-request/submit`
  - Evidence: `backend/src/modules/auth/auth.controller.ts` (`sendAdminRequestOtp`, `verifyAdminRequestOtp`, `submitAdminRequest`).
- The applicant session is carried by `AdminRequestSessionGuard`, and the request is stored as a `RegistrationRequest` with status `pending`.
- Platform review routes are `GET /platform/registration-requests`, `POST /platform/registration-requests/:id/approve`, `PATCH .../reject`, `PATCH .../request-revision`.
- Approval creates the admin `Account` + `Profile` only. It does **not** create an `Organization`.
  - Evidence: `backend/src/modules/platform-registration/platform-registration.service.ts:48` (`approve`), `:73` (comment), `:76` (`account.create`).

**Caveat — platform login token is unusable with the normal auth guard.**

`PlatformService.login()` signs `{ role: 'platform_owner' }` with no `sub`:

- `backend/src/modules/platform/platform.service.ts:43`

`JwtStrategy.validate()` looks up `findAccountById(payload.sub)`:

- `backend/src/modules/auth/strategies/jwt.strategy.ts:24`

So a token from `POST /platform/login` cannot authenticate any route protected by `AuthGuard`, including the platform registration-review routes. In practice the seeded platform owner account (`platform@edutool.dev`) must log in through `POST /auth/login`, or the token payload must be fixed to include `sub`.

---

### 2. Admin sets up organization and school profile

**Verified.**

- One organization per admin: `OrganizationService.create()` checks `existsForAdmin()` and links the org to the admin.
  - Evidence: `backend/src/modules/organization/organization.service.ts:33-47`.
- Organization update supports name, description, address, `emailExtension`, and `autoSeedNewSchoolYears`.
  - Evidence: `backend/src/modules/organization/organization.service.ts:102-108`.
- Schedule configuration is admin-managed under `org-schedule-config`.
- School profile supports departments, programs, courses, strands, levels, sections, and subjects.
  - Evidence: `backend/src/modules/school-profile/school-profile.service.ts` (`saveProfile`, `selectDepartment`, `getAllByType`).

**Minor mismatch:** the draft says the admin sets the organization “image” at setup. `OrganizationService.getOwn()` reads `logoUrl`, but the organization update DTO does not expose a logo field; `logo_url` is only written by seeds. Treat logo upload as a separate/unsupported path until confirmed.

---

### 3. Create school year and seed

**Verified.**

- `POST /school-years` is admin-only. It creates the year as `pending`.
- Validation: start/end dates required for the derived name, no past dates, no overlap with any other year, short-duration confirmation.
  - Evidence: `backend/src/modules/school-year/school-year.service.ts` (`create`, `validateNotInPast`, `assertNoOverlap`).
- “Can seed or not” is not a per-request flag on `CreateSchoolYearDto`. It is controlled by:
  - the organization setting `auto_seed_new_school_years`, and
  - a separate admin `POST /organization/seed` call (Data Seeder).
- Auto-seed seeds programs, courses, strands, levels, sections, subjects, grading scales, and grading schemes. It intentionally skips semester templates and program calendars.
  - Evidence: `backend/src/modules/school-year/school-year.service.ts:191-192` (`seedSemesterTemplates: false`, `seedProgramCalendars: false`).
- Manual seeding can include program calendars and semester templates through `POST /organization/seed` and its flags.
  - Evidence: `backend/src/modules/organization/organization.service.ts` (`seed`), `backend/src/modules/org-seeder/seed-context.ts` (`OrgSeedOptions`).

**Readiness checklist actually enforced**

`SchoolYearReadinessService.detail()` checks:

- start date exists (`missing_start_date`, line 100)
- at least one program (`no_programs`, line 125)
- every level has sections (`level_no_sections`, line 218)
- every level has subjects (`level_no_subjects`, near line 230)
- every subject in the year has a class (`subject_no_class`, line 275)
- every section has at least one class (`section_no_class`, line 302)
- every program has a program calendar (`program_no_calendar`, line 320)
- every program has a grading scale (`program_no_grading_scale`, line 338)
- every program has a semester template assignment (`program_no_semester_assignment`, line 391)
- every term in that template has term dates (`program_semester_dates_incomplete`, line 398)
- every class has a grading scheme (`class_no_grading_scheme`, line 421)

It does **not** check section/class schedule completeness. Class creation itself requires at least one schedule slot (`CreateClassDto.schedules` is `@ArrayNotEmpty()`), so schedules are structurally present when a class exists, but readiness does not verify coverage or conflicts. Educator assignment is also not a readiness issue because `Class.educator_id` is non-nullable (comment at line 438).

---

### 4. Activation and enrollment

**Verified activation rules**

`PATCH /school-years/:id/activate` is admin-only and requires:

- readiness clean (`assertReady`)
- a start date
- start date is today or earlier (`Cannot activate a school year before its start date.`, line 417)
- no other active year
- Evidence: `backend/src/modules/school-year/school-year.service.ts:381-430`.

**Mismatch — pending years can be used for enrollment**

The draft says a pending year “cannot be use in enroillment.” The backend only asserts readiness, not `status === 'active'`:

- `StudentEnrollmentService.enrollStudent()` calls `readinessService.assertReady()` and then creates the `StudentSchoolYear` row.
  - Evidence: `backend/src/modules/student-enrollment/student-enrollment.service.ts:51-58`.
- Bulk enrollment and program enrollment do the same (`:113`, `:238`, `:301`).
- `EnrollmentService.enroll()` (class enrollment) has no school-year status check at all.

So the actual rule is: **a readiness-clean pending year can be enrolled; activation is a separate gate.** Student self-service class requests are stricter: `ClassAssignmentRequestService.getAvailability()` requires `schoolYear.status === 'active'` (`backend/src/modules/class-assignment-request/class-assignment-request.service.ts:148`), so students cannot request classes until activation.

A student also cannot be enrolled in a new year while another year is active:

- `StudentEnrollmentService.enrollStudent()` rejects with “already actively enrolled in … Unenroll them first.”
  - Evidence: `backend/src/modules/student-enrollment/student-enrollment.service.ts:77`.

This matches the draft’s “after the school year ends, create a new year and enroll again,” because ending the year unenrolls the old `StudentSchoolYear`.

---

### 5. Regular vs irregular students

**Verified with a nuance.**

- `PATCH /school-years/.../programs/:programEnrollmentId/regular` toggles `is_regular`.
- Marking regular:
  - requires an active program enrollment, a level, and course/strand where applicable
  - computes lower-level subjects and prerequisite subjects
  - creates `SubjectCompletionOverride` rows with status `completed` for those subjects
  - Evidence: `backend/src/modules/student-enrollment/regular-student.service.ts` (`setRegular`, `resolveCreditedSubjectIds`).
- Student availability:
  - regular students only get classes in their current section/level (`isCurrent`)
  - irregular students can also get lower-level classes (`isLower`)
  - Evidence: `backend/src/modules/class-assignment-request/class-assignment-request.service.ts:171`, `:247-258`.

So “regular = lower subjects are already credited; available classes are current-year” is accurate. “Irregular” does not mean “no lower subjects”; it means lower-level classes become requestable.

**Mismatch — admin eligible-classes can include ended years**

`ClassService.getEligibleClassesForStudent()` loads every `StudentSchoolYear` row for the student without filtering status, then maps placements by year and scans all org classes:

- `backend/src/modules/class/class.service.ts:617` (no status filter)
- `:620` (only active program enrollments)
- `:628` (placement map includes ended years)
- `:660` (candidate classes are all org classes, then filtered by `placementByYear.get(cls.school_year_id)`)

If an ended year still has an active `StudentProgramEnrollment` (see year-end below), its classes can appear in this admin list. The student-facing `getAvailability()` is correctly scoped to the active school year.

---

### 6. In-year operations

**Verified modules and role gates**

- Attendance: `classes/:classId/attendance` with admin/educator writes.
- Assessments: `classes/:classId/assessments` educator-only; student read/result routes under `student/classes/:classId/assessments`.
- Submissions: student start/save/submit; educator/admin status/grade.
- Grades: educator/admin grade routes; student grade route; lock/unlock/override via `grade-lock`.
- Lessons: educator-owned class checks (`lesson.service.ts:46`, `:100`, etc.).
- Meetings: educator-owned class checks and student enrollment checks (`meeting.service.ts:41`, `:97`, `:312`, etc.).
- Groupy: educator/student routes.

**Gaps**

- Assessment creation does not check that the school year is active or that the start date has arrived. It only checks class ownership.
  - Evidence: `backend/src/modules/assessment/educator/assessment-educator.service.ts:113-119`.
- Attendance writes do not check school-year status or session date; they only check that the class exists in the org.
  - Evidence: `backend/src/modules/attendance/attendance.service.ts:448-455` (`assertClassExists` is org-scoped only).
- Attendance educator endpoints do **not** enforce class ownership. Any educator in the org can read/write attendance for any class. Lesson, meeting, assessment, and grade services all enforce `educator_id === actor`, so attendance is the outlier.
  - Evidence: `backend/src/modules/attendance/attendance.controller.ts:30-98`, `backend/src/modules/attendance/attendance.service.ts:448-455`.

---

### 7. Year-end and history

**Verified year-end mechanics**

`PATCH /school-years/:id/end` is admin-only:

- rejects `pending` with “Activate it first” (`school-year.service.ts:454`)
- rejects already-ended with 409
- sets status `ended`
- calls `unenrollAllStudents()` (`:458`)

`unenrollAllStudents()`:

- sets active class `Enrollment.status` to `removed`
- sets active `StudentSchoolYear.status` to `unenrolled` and stamps `unenrolled_at`
- Evidence: `backend/src/modules/school-year/school-year.repository.ts:359-380`.

The scheduled expiry path respects `OrgEnrollmentSetting.auto_unenroll_on_year_end`; the admin `end()` path unenrolls unconditionally (`school-year.repository.ts:346-347`).

**Mismatch — no outcome/final-grade/promotion step**

Year-end does **not**:

- set `Enrollment.outcome` / `outcome_set_at`
- compute or freeze final grades
- create a new year
- promote students
- end `StudentProgramEnrollment` rows

`StudentProgramEnrollment` rows therefore remain `active` after the year ends. That is why the admin eligible-classes path can still see the old year (above).

Academic history exists, but it is only as complete as the data written:

- timeline emits `class_enrolled` for every class enrollment
- it emits `outcome_set` only when `outcome_set_at` is present
- it emits assignment-request events from `student_requested_subject_ids` / `admin_finalized_subject_ids`
- Evidence: `backend/src/modules/academic-history/academic-history.service.ts:77-99`, `:122`, `:139`.

Transcripts are also live, not permanent:

- terms come from the class → subject → program semester template
- a grade appears only when `is_locked` is true
- Evidence: `backend/src/modules/transcript/student/transcript-student.service.ts:88`, `:120-121`.

So the draft’s “history timeline … subject completions” is only partly true today: enrollments and manual/regular completion overrides persist, but outcomes and final grades are not finalized automatically at year-end.

---

## Code defects found during verification

### High — cross-tenant academic-calendar delete

`AcademicCalendarController.remove()` reads `@CurrentUser('orgId')`, but the JWT strategy populates `org_id`:

- `backend/src/modules/academic-calendar/academic-calendar.controller.ts:79`
- `backend/src/modules/auth/strategies/jwt.strategy.ts:45`

`orgId` is therefore `undefined`. `findById(id, undefined)` builds `where: { id, org_id: undefined }`; Prisma omits the undefined field, so the lookup can find a calendar event from **any** organization by id, and `delete(id)` then hard-deletes it:

- `backend/src/modules/academic-calendar/academic-calendar.repository.ts:41-43`, `:86`
- `backend/src/modules/academic-calendar/academic-calendar.service.ts:125-132`

The same wrong key also appears in:

- `backend/src/modules/assessment/student/assessment-student.controller.ts:18,28,43`
- `backend/src/modules/attendance/student/attendance-student.controller.ts:20`

Those student routes still scope by `studentId` + `classId`, so they are less exploitable, but the org predicate is silently dropped.

### Medium — platform login token cannot authenticate

Described in Stage 1. Fix by adding the seeded platform-owner `sub` (and `org_id` if needed) to the signed payload, or by removing `/platform/login` and using `/auth/login`.

### Medium — attendance lacks educator ownership checks

Described in Stage 6. Add an `assertEducatorOwnsClass` equivalent to `AttendanceService` for educator callers, or explicitly document that attendance is org-wide for educators.

### Medium — ended-year placements leak into admin class eligibility

Described in Stage 5. Filter `StudentSchoolYear` to `status: 'active'` (and/or the selected school year) in `getEligibleClassesForStudent`.

---

## Suggested correction to the draft flow

Replace the pending-year sentence with:

> A school year starts as `pending`. Readiness is the gate for enrollment: once the readiness checklist is clean, students can be enrolled even while the year is pending. Activation is a separate admin action, allowed only on/after the start date, and is required before students can use self-service class requests. Only one year can be active at a time.

Replace the readiness sentence with:

> Readiness requires a start date, programs, levels with sections and subjects, every subject to have a class, every section to have at least one class, a program calendar, a grading scale, a semester template with term dates, and a grading scheme on every class. Class schedules are required when the class is created; readiness does not separately verify schedule coverage.

Replace the year-end sentence with:

> Ending a year marks it `ended`, removes active class enrollments, and unenrolls each `StudentSchoolYear`. It does **not** automatically set class outcomes, finalize grades, end program enrollments, or promote students. Those steps must be added (or performed manually) before the next year’s enrollment, and until they are, history/transcript views will be incomplete.

---

## Verification gaps

- No runtime/e2e execution was performed; findings are from source reading.
- Frontend admin screens were not audited for which backend path they call.
- Database nullability and migration state were not re-checked; the analysis assumes the Prisma schema matches the current working tree.
