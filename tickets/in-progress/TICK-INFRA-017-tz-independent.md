# TICK-INFRA-017 — Timezone-independent time layer + assessment fix

Status: in-progress
Priority: high
Created: 2026-10-06
Created by: agent
Assigned to: agent
Started: 2026-10-06
Worktree: ../EduToolV4-worktrees/TICK-INFRA-017-tz-independent
Branch: agent/TICK-INFRA-017-tz-independent

## Problem

Process TZ changes behavior: Render (UTC) vs Manila dev. Zone-less
`datetime-local` values (`2026-10-06T17:00`) are interpreted in server-local
TZ, shifting assessment release/end, reopenedUntil, grade-lock deadlines by
8h in production. Display formatting without explicit timeZone causes
Vercel SSR hydration mismatch.

## Goal

1. One `datetime.util` module per side with identical API surface:
   `ORG_TIMEZONE = 'Asia/Manila'`, `parseInstant`, `@IsInstant`,
   `@IsCalendarDate`, `localInputToIso`, `isoToLocalInput`, `formatInZone`,
   `todayInZone`, `calendarDateOf`, `calendarDateToUtc`,
   `addDaysToCalendarDate`, `startOfDayInZone`/`endOfDayInZone`,
   `formatCalendarDate`. No new date deps (Intl only).
2. Step 4.1 first: assessment DTOs -> `@IsInstant`, service/helpers ->
   `parseInstant`, builder Step6/ManualStep2/ReopenDialog ->
   `localInputToIso`, edit forms -> `isoToLocalInput`, clearing semantics
   undefined = untouched / null = clear.
3. Regression tests passing under TZ=UTC, Asia/Manila, America/Los_Angeles,
   Pacific/Kiritimati.
4. Later steps (separate commits/tickets if needed): grade-lock, crons,
   kind-B, attendance/meetings/lessons/mail, display, enforcement.

## Relevant Areas

- backend/src/commons/utils/datetime.util.ts (new)
- frontend/src/utils/datetime.util.ts (new)
- backend/src/modules/assessment/** (dto, core, educator helpers)
- frontend assessment builder/edit/reopen components

## Acceptance Criteria

- [ ] Both ORG_TIMEZONE constants exist and equality test passes
- [ ] Zone-less instant POST returns 400; Z and +08:00 both store 09:00:00.000Z
- [ ] Assessment regression tests pass under all four TZs
- [ ] Diff of Step 4.1 shown to user before continuing to 4.2+
- [ ] No Prisma schema change; no floating-time (kind C) files touched

## Confidence

Score: 79/100 (Requirement 25, Codebase verification 22, Architecture 18,
Edge cases 8, Blast radius 6; capped at 79: assessment deadline gating is
authoritative-adjacent and prod row time-of-day distribution is unverified
without DB access).
Gaps: prod distribution of UTC-midnight vs 16:00Z rows unconfirmed (no DB
access, no cutoff date yet); proceeding per user approval of Step 3 + 4.1
with R5 conditional on code evidence (holidays.data local-midnight,
seed local-midnight, plain DateTime columns, no DB clock fns).
Assumption: R5 calendarDateOf +12h tolerance covers legacy rows; Step 6
counting script deferred until cutoff provided.

## Tests

- Targeted: PASS — backend datetime.util.spec 18/18 x4 TZs
  (UTC, Asia/Manila, America/Los_Angeles, Pacific/Kiritimati); frontend
  datetime.util.test 10/10 x4 TZs, byte-identical; assessment+submission
  regression suites 81/81 x4 TZs. tsc --noEmit clean both apps; eslint
  clean on all 13 touched files.
- 4.2 targeted: PASS — backend assessment+grade-lock+submission+utils
  154/154 x4 TZs (incl. new assessment-instant-boundary 8 tests and
  grade-lock-auto-calendar 8 tests); frontend datetime 10/10 x4 TZs;
  tsc clean both apps; eslint 0 errors (1 pre-existing
  unused-disable warning in GradeLockSettingModal, untouched line).
- 4.3+4.4 targeted: PASS — backend 221/221 (own) x4 TZs
  (UTC, Asia/Manila, America/Los_Angeles, Pacific/Kiritimati) across
  scheduler/school-year/semester/semester-template/academic-calendar/
  enrollment-portal/org-seeder/assessment/grade-lock/submission/utils,
  incl. 7 new spec files (46 new tests); frontend datetime 10/10 x4 +
  studentSchedule (semester selection) 19/19 x4; tsc clean both apps;
  eslint 0 errors both apps.
  Known pre-existing failures, identical on development (verified):
  semester.service.spec create x5 (mock stubs countBySchoolYear, service
  requires program/template assignment) and school-year TEST spec x2
  (db.organization mock missing for maybeAutoSeed). Untouched by this
  ticket; separate fix recommended.
- Full suite: not run (deferred to pre-merge per Level 3 scope)
- Development integration: not run

## Blocker

None. Waiting on user for: production CUTOFF DATE (Step 6), DB access for
Step 1 row-distribution query.

## Activity Log

- 2026-10-06: Claimed as TICK-INFRA-017 (counter 16 -> 17). Steps 1+2 audit
  reported read-only; user approved Step 3 + 4.1.
- 2026-10-06: Confidence: 79/100 (see Confidence section). User explicitly
  approved proceeding with Step 3 + 4.1 despite prod-data gap.
- 2026-10-06: Step 3 + 4.1 implemented on
  agent/TICK-INFRA-017-tz-independent. STOPPED after 4.1 per instruction;
  diff + 4-TZ results shown to user, awaiting approval for 4.2+.
- 2026-10-06: User approved 4.1 and scoped 4.2 + hardening (items 1-5).
  Implemented, verified 154/154 x4 TZs backend + 10/10 x4 frontend.
  STOPPED after 4.2 per instruction; extended Step-2 audit posted in
  chat, awaiting approval for 4.3+.

## Commits

- 5786b6cc feat(time): shared datetime layer plus assessment instant
  boundary (13 files: 4 new, 9 edited). No schema change; no kind-C files
  touched.
- f060f9dd feat(time): assessment boundary tests, zone-less caller fix,
  grade-lock instants (10 files: 2 new specs, 8 edited). Includes
  grade-lock-proof.spec expectation update (string -> same-instant Date;
  proven property unchanged, see ticket Notes).
- e1adffce feat(time): crons in school time plus calendar-date kind-B
  (34 files: 7 new specs, 27 edited). STOPPED after 4.4 per instruction;
  diff + 4-TZ results shown to user, awaiting approval for 4.5+.

## Notes

Floating-time files are OFF LIMITS: schedule-time.util.ts,
scheduleTime.utils.ts, org-schedule-config/*, useScheduleWindow.
Helper names pinned: parseInstant, @IsInstant, localInputToIso,
isoToLocalInput, formatInZone.
