# TICK-ORG-002 — Org active weekdays + breaks (Phase 1)

Status: ready-for-review
Priority: high
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Branch: development (owner-directed; no feature worktree)
Plan: auto-class/phase-1-org-week-and-breaks.md
Commits: 25e5b6b0 (backend), 3c986a9d (frontend)

## Problem

The org schedule config knows only a time window and a slot length. It cannot
express *which weekdays the school is open*, so a class can be booked on a day
the school does not hold classes, and there is no way to carve out lunch.

The automated class generator (auto-class) needs both: it can only place classes
on school days, and must not place them across a break.

## Owner decisions (2026-09-30)

1. **Weekday selector displays Mon -> Sun**, all 7 offered as options.
2. **Default = all 7 days active** `[0,1,2,3,4,5,6]` (0 = Sunday).
   Chosen over Mon-Fri deliberately. Consequences:
   - The default is a superset of every weekday, so the migration cannot
     invalidate existing data and needs no data backfill at all.
   - `seeds/domain/utils/schedule.util.ts` uses `SCHEDULE_WEEKDAYS = [0,1,2,3,4]`
     (Sun-Thu). That mismatch with the plan's proposed Mon-Fri default is now
     moot — Sunday is valid by default, so the seeder needs no change.
   - The feature is inert until an admin narrows the set, which is the correct
     default for "optional to use".
3. Only school days may be picked when creating a schedule.

## Goal

1. `OrgScheduleConfig` gains `activeWeekdays` and `breaks`.
2. Manual class create/update honours both on the server AND in the UI.
3. Only school days are selectable in the class schedule picker.
4. Zero data invalidated by the migration.

## Relevant Areas

- backend/prisma/schema.prisma (OrgScheduleConfig)
- backend/src/modules/org-schedule-config/{service,repository,dto,schedule-window.util}
- backend/src/modules/class/class.service.ts (`assertScheduleConfig`)
- backend/src/seeds/domain/utils/schedule.util.ts
- frontend: OrgScheduleTab, useScheduleWindow, useOrgScheduleConfig,
  org-schedule-config.{api,types}, WeeklyScheduleGrid, ClassSchedulePicker

## Acceptance Criteria

- [x] Admin can toggle school days Mon..Sun and add breaks (label/start/end)
- [x] Picking a non-school day in the class dialog is impossible in the UI
- [x] The API rejects a non-school day / a break-overlapping slot
- [x] Saving a config that would invalidate existing live classes -> 409 with
      counts per reason (out of bounds / inactive day / break overlap)
- [x] Existing classes remain valid after migration (proven, not assumed)
- [x] Archived classes and ended school years are ignored by that check
- [x] Pure + service + class-service tests for the new rules

## Confidence

- Score: 90%
- Migration safety is provable rather than assumed: default `[0..6]` is a
  superset of any weekday present in existing data, so no backfill is needed
  and nothing can be invalidated.
- Measured, not asserted:
  - backend `tsc --noEmit`: 0 errors
  - backend unit: 999 passing (was 964 -> +35 new). Failing set unchanged:
    same 7 suites / 24 tests as the pristine-HEAD baseline.
  - frontend `tsc`: 20 errors before AND after, none in touched files
    (verified by stash/unstash, same command both times).
  - frontend unit: 270/270 green. eslint clean on all touched files.
- Remaining frontend/backend failures are pre-existing and out of scope here.

## Tests

- Pure (`schedule-window.util.spec.ts`): weekday active/inactive, break
  overlap/straddle/adjacency, `getFreeMinuteRanges` incl. overlapping breaks,
  plus regression coverage for the pre-existing window rules
- Service (`org-schedule-config-weekdays-breaks.spec.ts`): persist/sort, cache
  invalidation, 5 break-validation rules, per-reason 409 counts, and an
  assertion that the live-schedule filter is org-scoped + excludes archived
  classes and ended years
- Existing suites re-verified: org-schedule-config caching + class.service

## Blocker

None.

## Activity Log

2026-09-30 — Filed and started. Depends on TICK-INFRA-015 (tsc baseline), which
landed first as 4d6e2dba because every phase needs a green typecheck.

2026-09-30 — Implemented. Backend (25e5b6b0): schema + one migration,
DTO/repository/service, `getScheduleViolation` extended with an optional weekday
plus break/active-day helpers (`isActiveWeekday`, `findBreakOverlap`,
`getFreeMinuteRanges` — the last one is what the generator will use to
enumerate placeable slots). The 409 check now buckets by cause and only
considers live schedules.

2026-09-30 — Frontend (3c986a9d): Mon->Sun selector + breaks editor, grid props
for inactive days and break ranges, and `ClassSchedulePicker` moved onto
`useScheduleWindow` so it stops maintaining its own config query.

## Commits

- 25e5b6b0 — feat(org): active weekdays and breaks in the schedule config
- 3c986a9d — feat(org): school-day selector and breaks editor in the admin schedule tab

## Notes

Breaks must be slot-aligned (start offset and length are multiples of
`slotDuration`), so a 12:00-12:20 lunch is not expressible at 30m slots. This is
a deliberate product constraint inherited from the plan, called out because it
will surprise an admin entering an arbitrary lunch window.

Not done here (belongs to later phases): per-day breaks, and the educator-side
availability that will intersect with these weekdays in Phase 4.

