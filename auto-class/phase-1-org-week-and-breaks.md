# Phase 1: Org active weekdays and breaks

## Goal
The school's schedule config knows which weekdays are open and when breaks are. Manual class scheduling respects both, on the server and in the UI. Useful on its own and required by the generator.

## Read first
Backend: `prisma/schema.prisma` (`OrgScheduleConfig`), `org-schedule-config/` (controller, service, repository, dto, `schedule-window.util.ts`, `__TEST__/org-schedule-config-caching.spec.ts`), `class/class.service.ts` (`assertScheduleConfig`), `seeds/domain/utils/schedule.util.ts`, `seeds/domain/seeders/classes.seeder.ts`.
Frontend: `components/admin/organization/OrgScheduleTab.tsx`, `hooks/shared/useScheduleWindow.ts`, `hooks/admin/useOrgScheduleConfig.ts`, `api/admin/org-schedule-config.api.ts`, `types/admin/org-schedule-config.types.ts`, `components/shared/WeeklyScheduleGrid.tsx`, `components/admin/class/ClassSchedulePicker.tsx`, `utils/classes.utils.ts`, `utils/schedule-slots.utils.ts`.

## Data model (`OrgScheduleConfig`)
- `active_weekdays Int[]`, default `[1,2,3,4,5]` (Mon-Fri).
- `breaks Json`, default `[]`. Each item: `{ label: string, start: "HH:mm", end: "HH:mm" }`. Global for all weekdays (per-day breaks are out of scope).
- Migration: for existing orgs, set `active_weekdays` = default plus any weekday that already has a live class schedule in that org (so existing data is never invalidated). Do this in the migration SQL.

## Backend
1. DTO `UpsertOrgScheduleConfigDto`: add `activeWeekdays` (int array, non-empty, unique, each 0-6) and `breaks` (array of `{label, start, end}`, HH:mm format, `label` 1-40 chars, max 6 breaks). Keep `startTime`, `endTime`, `slotDuration`. Fields may stay required on upsert as a full-config save.
2. Validation in the service:
   - Each break: `start < end`, inside `[startTime, endTime]`, aligned to `slotDuration` (start offset and length multiples of slot).
   - Breaks must not overlap each other.
3. `schedule-window.util.ts`: extend `ScheduleWindow` with optional `activeWeekdays?: number[]` and `breaks?: {start,end}[]`. Extend `getScheduleViolation` to take an optional weekday and reject (a) inactive weekday, (b) slot overlapping a break. Keep it backward compatible when the optional data is absent (used by seeds and tests). Add small pure helpers here, e.g. `isBreakOverlap`, `isActiveWeekday`, `getFreeMinuteRanges` (used later by the engine).
4. `ClassService.assertScheduleConfig`: pass `slot.weekday`. It already calls `getScheduleViolation`, so manual create and update get enforcement automatically. Error message must name the reason (inactive day / break name).
5. `OrgScheduleConfigService.upsert` strict rule (existing 409 pattern), extended:
   - Count live `ClassSchedule` rows (`class.deleted_at = null`, school year not `ended`) that would become invalid: out of bounds, misaligned, on a removed weekday, or overlapping a new/changed break.
   - Reject with 409 and a message with counts per reason. Do not silently change classes.
   - Fix the duplicate `toMinutes` declaration.
6. Repository `upsert` and `upsertDefaults` persist the new fields. `map()` returns `activeWeekdays` and `breaks`. Invalidate the existing cache key on write.
7. Seeds: `buildScheduleWindows`/`allocateScheduleSlot` in `seeds/domain/utils/schedule.util.ts` must skip inactive weekdays and breaks (keep default Mon-Fri so seeded data stays valid).

## Frontend
1. Types and API: add `activeWeekdays: number[]` and `breaks: {label,start,end}[]` to the config type and the upsert payload.
2. `OrgScheduleTab`: add a weekday toggle row (display Mon..Sun, values 0-6, at least one active) and a breaks editor (add/remove rows: label, start, end time inputs). Show the slot preview with breaks visibly marked. Reuse the existing form and the 409 toast pattern.
3. `useScheduleWindow`: also return `activeWeekdays` and `breaks`, plus derived helpers (`isDayActive(weekday)`, `isBreak(minute)`).
4. `WeeklyScheduleGrid` (new optional props, all backward compatible):
   - `activeWeekdays?: number[]`: inactive days render greyed and non-clickable. A day that has existing blocks but is inactive still shows (greyed) so nothing disappears.
   - `blockedRanges?: {startMin, endMin}[]`: break ranges render as hatched/muted rows across active days, non-clickable.
   - Make `isOccupied`/`canStart`/`canEnd` treat blocked ranges and inactive days as occupied so a picked range can't span a break.
5. `ClassSchedulePicker`: replace its own config query with `useScheduleWindow`, pass the new grid props, and include "inactive day" and "overlaps break" in `outOfWindow`/conflict state with a clear message.
6. Other schedule views that call the grid (educator schedule, student schedule, room page, `SchedulePanel`) should get the same window props through `useScheduleWindow` where they already use it.

## Edge cases
- Admin disables Sunday while a live class has a Sunday slot: 409 listing the count. They must move those classes first.
- Config not yet created: `getByOrg` lazily creates defaults with Mon-Fri and no breaks.
- Breaks empty: behavior identical to today.

## Tests
- Pure: `getScheduleViolation` with weekday/break cases; break validation (overlap, alignment, outside window).
- Service: 409 counts for out-of-bounds, removed weekday, break overlap; ignoring archived classes and ended years; cache invalidated after upsert.
- Class service: create/update rejected on inactive day and on break.

## Acceptance
- Admin can set Mon-Sat and a 12:00-13:00 lunch. Trying to book Sunday or lunch in the class dialog is impossible in the UI and rejected by the API.
- Existing classes remain valid after migration.
