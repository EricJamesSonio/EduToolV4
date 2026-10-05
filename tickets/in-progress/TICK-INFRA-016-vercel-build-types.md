# TICK-INFRA-016 — Unblock Vercel publish: fix 20 frontend type errors

Status: in-progress
Priority: high
Created: 2026-10-05
Created by: agent
Assigned to: agent
Started: 2026-10-05
Worktree: ../EduToolV4-worktrees/TICK-INFRA-016-vercel-build-types
Branch: agent/TICK-INFRA-016-vercel-build-types

## Problem

Vercel production build of `main` fails: `npm run build` compiles but
`Failed to type check` on `semester.api.ts:70` (`programId` missing in
`Semester`). The build stops at the first error; 20 errors total across 16
files block publishing. All are drift from earlier tickets (semester
program-scoping, count-based levels, Base-UI migration, ASSESS-005 types)
whose call sites were never migrated. No backend changes needed.

## Goal

Zero `tsc --noEmit` errors (frontend), eslint clean on touched files,
related suites green, full `npm run build` green locally, then push.

## Relevant Areas

- frontend/src/types/admin/semester.types.ts, frontend/src/api/admin/semester.api.ts
- frontend/src/api/admin/level.api.ts + 4 level UI call sites (levels page, LevelWithSectionsList, LevelList types, ProgramLevelsSection)
- frontend/src/components/educator/presentation-builder/FontSelector.tsx, TemplateSelector.tsx
- frontend/src/components/admin/semester/SemesterFormDialog.tsx
- frontend/src/app/educator/classes/[classId]/assessments/new/page.tsx
- frontend/src/components/admin/school-years/CreateSchoolYearDialog.tsx
- frontend/src/app/admin/enrollment/enroll/page.tsx (+ EnrollStudentPanel)
- frontend/src/components/admin/school-profile/SchoolProfileCard.tsx, AutomationCard.tsx, AutomationSettings.tsx
- frontend/src/types/admin/organization.types.ts (autoSeedNewSchoolYears)
- frontend/src/components/admin/data-seeder/SeederCard.tsx
- frontend/src/components/admin/class/ClassPresetButton.tsx

## Acceptance Criteria

- [ ] `Semester` carries required `programId` (backend already requires it)
- [ ] Level add/rename call sites use count-based API (`addNext` added to level.api.ts)
- [ ] Base-UI leftovers migrated (`render=` trigger, nullable Select handlers)
- [ ] Assessment builder `type` stays `AssessmentType`
- [ ] CreateSchoolYearDialog sends previewed `name`
- [ ] Enroll page passes `onSearchChange`
- [ ] `tone="blue"` removed (2 sites); `Organization.autoSeedNewSchoolYears` added; `PROGRAM_KEYS` typed; preset button passes educator id
- [ ] `tsc --noEmit` 0 errors, eslint clean, related suites green, `npm run build` green

## Confidence

- Score: not yet claimed — only after suites + local build pass.

## Tests

- Regression: suites touching edited files (level, semester, enroll, assessment-builder, seeder, school-profile, presentation-builder where present)
- Gates: FE tsc 0, eslint on touched files, full `npm run build`

## Blocker

None.

## Activity Log

2026-10-05 — Claimed (counter INFRA 15 -> 16). All 20 errors mapped read-only before coding.

## Commits

(none yet)

## Notes

Frontend-only fix. Known follow-ups (out of scope): enroll page keeps two search inputs after the one-line prop fix; backend select for autoSeedNewSchoolYears to be verified during implementation.
