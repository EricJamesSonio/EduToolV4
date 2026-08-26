# Current Project State

Last updated: 2026-08-27

<!--
One section per major domain/module. Keep status labels consistent:
implemented / partially implemented / not implemented / needs investigation
-->

## Frontend / Landing & Admin UI

Status: implemented

Implemented:

- TICK-INFRA-002 — Frontend mojibake normalization (— U+2014, – U+2013, … U+2026, → U+2192, − U+2212, ─ U+2500) across SolutionSection, ResourcesSection, ProgramLevelsSection, SchoolProfileCard, SeederCard — 5 files, 30 fixes, 0 `â` hits, lint/typecheck/build passed (merge 00dfabe0).
- TICK-ORG-001 — Organization schedule settings: OrgScheduleConfig (07:00-17:00/30, 15|20|25|30|45|60), GET/PUT /org-schedule-config strict 409, class.service bounds validation, Organization tabs + picker (merge 4d0d8f51, commit 3b1996c0).
- TICK-PLATFORM-001 — Missing React Query invalidations for resets/profile — ready-for-review (4ce84a30).

In progress:

- TICK-ACADEMIC-001 — Register student/academic-history on React Query factory
- TICK-ADMIN-001 — Admin querykeys cleanup
- TICK-GRADE-001 — Educator grades realtime

Not implemented:

- Billing/payments (not evidenced in repo per onboarder)

## <Domain A>

Status: not implemented

Implemented:

-

In progress:

-

Not implemented:

-

## <Domain B>

Status: not implemented
