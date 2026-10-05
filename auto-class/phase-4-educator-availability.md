# Phase 4: Educator availability and load limits

## Goal
Each educator can be limited to certain weekdays. If nothing is set, they are available on every active school day. Optional load limits stop one educator from being overloaded. The generator treats these as hard rules and gives scarce educators priority.

## Depends on
Phase 1 (active weekdays).

## Read first
`educator/` module (all files), Phase 1 outputs (`org-schedule-config` service and `useScheduleWindow`), `class/class.service.ts`, `app/admin/educators/[id]/page.tsx`, `components/admin/educator/*`, `components/shared/WeeklyScheduleGrid.tsx`.

## Data model
New table `EducatorScheduleProfile` (one row per educator, created lazily):
- `id`, `org_id`, `educator_id` (unique), `use_custom_availability Boolean @default(false)`, `available_weekdays Int[] @default([])`, `max_minutes_per_day Int?`, `max_minutes_per_week Int?`, `created_at`, `updated_at`.
- Semantics: `use_custom_availability = false` means available on all org-active weekdays (the default, and what you get with no row). `true` means only `available_weekdays`, always **intersected with the org's active weekdays**. The boolean exists so "no days configured" is distinguishable from "not set up".
- Availability is by weekday only in v1. Per-day time ranges are out of scope.

## Backend
Endpoints (admin only, org-scoped):
- `GET /educators/:id/schedule-profile`: returns the profile with `effectiveWeekdays` (the intersection with the org's active days) computed server-side.
- `PUT /educators/:id/schedule-profile`: body `{ useCustomAvailability, availableWeekdays, maxMinutesPerDay?, maxMinutesPerWeek? }`. Validate weekdays 0-6, unique, non-empty when custom is true (all-unavailable is not allowed. Suspend the educator instead). Validate that limits are positive and `perDay <= perWeek` when both are set.
- Bulk loader for the engine: `getProfilesByEducator(orgId, educatorIds)` returning `Map<educatorId, {effectiveWeekdays, maxPerDay, maxPerWeek}>` in one query, falling back to the org's active weekdays for educators without a row.
- Helper `getScarcityRank`, the count of effective weekdays (fewer = scarcer), used by the generator.
- When saving, compute how many live classes of this educator already have slots outside the new availability and return `{outsideAvailabilityClassCount}` as a **warning** (not a block).
- Manual class create/update/reassign: if a slot falls on a day the educator is unavailable, return a non-blocking warning field in the response (do not throw). Follow the existing response shape and add a `warnings: string[]` only where harmless.
- When the org's active weekdays change (Phase 1), no educator rows need updating because the intersection is computed at read time.

## Frontend
1. Educator detail page: "Availability" card with a toggle "Available on all school days (default)". When off, show weekday chips restricted to the org's active days (greyed if the org is closed that day) and optional max hours per day/week inputs. A "Reset to default" button.
2. Show the educator's weekly grid (the existing schedule grid) with unavailable days greyed using the Phase 1 grid props.
3. `CreateClassDialog`: when the chosen educator is unavailable on a picked day, show a warning under the picker (non-blocking).
4. Educator table: optional small badge "3 days" when custom availability is set.

## Edge cases
- Custom weekdays that the org later deactivates are ignored via the intersection. If the result is empty the educator has no placeable days. Readiness flags it.
- Educator with existing classes on a now-unavailable day: warning only, never auto-move.

## Tests
- Intersection logic, default behavior with no row, validation rules, batch loader (single query), outside-availability count.

## Acceptance
- Admin marks an educator Tue/Thu only. The profile shows effective days. Manual scheduling on Monday shows a warning. The generator (Phase 6) will only use Tue/Thu for them.
