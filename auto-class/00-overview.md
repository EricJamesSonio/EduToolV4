# Automated Class Generator: Overview (read this before any phase)

## Goal
Let an admin generate class schedules automatically with no conflicts: pick the school year, program(s) and semester, and the system creates one class per (section, subject) with weekly time slots, an educator and optionally a room. It shows a preview first and commits only after the admin approves.

## Why this needs prerequisite phases
The code today has no data the generator needs:

| Missing today | Added in |
|---|---|
| Which weekdays the school is open (`OrgScheduleConfig` has only start/end/slot length) | Phase 1 |
| School breaks (lunch etc.) | Phase 1 |
| How many sessions per week and how long each session is, per subject | Phase 2 |
| Which subjects an educator can teach (an educator is only linked to a subject when a class is created) | Phase 3 |
| Which weekdays an educator is available, and load limits | Phase 4 |
| Conflict rules reusable outside `ClassService` (they are private and query per call) | Phase 5 |

## Phases (build in order)
| # | File | Depends on |
|---|---|---|
| 1 | `phase-1-org-week-and-breaks.md` | none |
| 2 | `phase-2-subject-session-requirements.md` | none |
| 3 | `phase-3-educator-teachable-subjects.md` | none |
| 4 | `phase-4-educator-availability.md` | Phase 1 |
| 5 | `phase-5-shared-conflict-engine.md` | 1, 3, 4 |
| 6 | `phase-6-generator-backend.md` | 1-5 |
| 7 | `phase-7-generator-ui.md` | 6 |
| 8 | `phase-8-testing-and-tuning.md` | 6 |

Phases 1, 2 and 3 are independent. Each phase must be shippable and useful on its own, with the existing manual flow still working.

## Conventions confirmed from the codebase
- Weekday numbering: 0 = Sunday ... 6 = Saturday (JS `getDay`). The UI displays Mon..Sun (`DAY_ORDER = [1,2,3,4,5,6,0]`).
- Times are stored as `DateTime` on `ClassSchedule.start_time`/`end_time`, but only the wall-clock time matters. `parseTimeToDate("HH:mm")` stamps today's date onto it. **Always compare with minutes-of-day** (`toMinuteSlot`, `minuteSlotsOverlap` in `class-schedule.util.ts`). Never compare full timestamps.
- Every table is `org_id`-scoped. Every query must filter by `org_id`.
- Soft delete uses `deleted_at`. Live queries filter `deleted_at: null`.
- One class per (section, subject, semester) is enforced by `assertNoDuplicateSubjectInSection`. So a generated demand item is ONE class with N schedule slots.
- A class's capacity equals its section's capacity.
- Conflicts today are scoped by `school_year_id`, not semester (see Decision D2).
- `Semester` now belongs to one program (`program_id`) and to a template item (`template_semester_id`). Semester for a program is resolved by `ClassService.resolveSemesterId` (first template semester of the program's assigned template).
- Caching: `AppCacheService` with `cache.key('org', orgId, ...)` and `APP_CACHE_TTL`. Invalidate on write.
- Frontend data layer: `useAsyncQuery` / `useMutationWithInvalidation` from `hooks/hook-factory.utils`, query keys in `hooks/queryKeys/admin.keys.ts`, API files in `api/admin/`, types in `types/admin/`, shadcn UI in `components/ui`, forms with react-hook-form.
- Backend tests live in a `__TEST__` folder next to the module (jest). Follow the batching-spec style already used.
- Audit log: `AuditLogService.logAdminAction({orgId, actorId, action, entityType, entityId, metadata})`, fire-and-forget with `.catch(() => {})`.

## Known issues found while reading (fix in the phase noted)
1. `org-schedule-config.service.ts` imports `toMinutes` from `schedule-window.util` and also declares its own `toMinutes`. That is a duplicate identifier. Fix in Phase 1.
2. Its "would be out of bounds" check scans every `classSchedule` in the org, including archived classes and ended school years. Restrict to live classes (Phase 1).
3. `seeds/domain/seeders/classes.seeder.ts` creates a `Semester` without `program_id` and `template_semester_id`, which the current schema requires. It is out of date. Fix in Phase 8, since it is needed for stress testing.
4. `Subject.educator_id` exists with no relation and no usage. Do NOT use it. Confirm and remove it later (not now).
5. `StudentClassController` contains `GET :id/ownership-history` with `@Roles('admin','educator')`, which looks misplaced. Ignore it unless it blocks you, and report it.
6. `ClassSchedulePicker` fetches the org schedule config itself instead of `useScheduleWindow`. Unify in Phase 1.
7. Conflict checks are private methods in `ClassService`. Phase 5 extracts them.

## Decisions (assumptions I made, change any that are wrong)
- **D1, "time frame of classes to generate":** = the **semester** (as the date/term scope) plus an **optional daily time window** narrower than the org window (e.g. only generate 08:00-15:00). Schedules are weekly patterns, so the semester only picks which semester each class belongs to.
- **D2, conflict scope:** keep the current school-year scope for manual creation. The Phase 5 engine takes the scope as a parameter so it can switch to "semesters that overlap in dates" later without rewriting. The switch is an owner decision, not something the AI should flip on its own.
- **D3, teachable subjects across years:** subjects are recreated per school year (via `Program.school_year_id`). Teachable links are keyed by `subject_id`, with a "carry over from previous year" action matching by name and structure.
- **D4, college and irregular sections:** v1 supports section-based programs where subjects bind to a level (K-12 style). Programs where subjects rely on `year_level`/`term_label` are reported as "unsupported/ambiguous" in readiness, not guessed.
- **D5, rooms:** rooms are free-text with no capacity or type. Room assignment in the generator is optional and best effort.
- **D6, availability:** educator availability and teachable subjects are a **warning** for manual class creation and a **hard rule** for the generator.

## Standing rules for the AI doing the work
1. Read every file listed under "Read first" completely before changing anything.
2. Do not change behavior of manual class creation except where a phase says so. Any new manual-flow rule must be a warning unless stated otherwise.
3. No N+1 queries. Load everything for a scope in a few batched queries.
4. Add backend unit tests for every new service and pure function. Update existing specs you break.
5. Migrations: one Prisma migration per phase, named clearly, with safe defaults for existing rows.
6. Do not add features outside the phase. Note follow-ups instead.
7. Finish each phase by listing the changed files and how to verify it manually.
