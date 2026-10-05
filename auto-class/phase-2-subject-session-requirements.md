# Phase 2: Subject session requirements (how often, how long)

## Goal
Every subject can declare how many sessions per week it needs and how long each session is. The generator needs this. It also gives manual creation a sensible hint.

## Read first
Backend: `prisma/schema.prisma` (`Subject`), `subject/` (service, repository, dto, mapper, types, validator), `org-seeder/data/subjects/*` (`subject-def.ts` and per-department files), `org-seeder/seeders/major-subject-seeder.service.ts`, `minor-subject-seeder.service.ts`, `org-schedule-config` (slot duration).
Frontend: `components/admin/subject/SubjectDialog.tsx`, `SubjectColumns.tsx`, `hooks/useSubject*`, `types/admin/subject.types.ts`, `api/admin/subject.api.ts`, `components/admin/data-seeder/constants/subjects.ts`, `components/admin/school-profile/SubjectStep.tsx`, `SharedSubjectStep.tsx`.

## Data model (`Subject`)
- `sessions_per_week Int?` (1-7).
- `session_minutes Int?` (must be a multiple of the org `slot_duration`).
- Both nullable: existing subjects stay valid. Null means "use the default for the program type" (below) and is flagged in readiness.

## Defaults
- Create a constants file (e.g. `subject/subject-session-defaults.ts`) with default `{sessionsPerWeek, sessionMinutes}` per program type (daycare, kinder, elementary, jhs, shs, college). Suggested starting values: elementary/jhs/shs 5 x 60, college 2 x 90, kinder 5 x 45, daycare 5 x 30. These are configurable constants, not hard rules.
- Export a resolver `resolveSessionRequirement(subject, programType, slotDuration)` returning `{sessionsPerWeek, sessionMinutes, source: 'explicit' | 'default'}`. The generator and readiness use this single function.
- The resolved minutes must be rounded up to a multiple of `slot_duration` when using a default (explicit values must already be a multiple, validated on save).

## Backend
1. DTOs: add optional `sessionsPerWeek` (int 1-7) and `sessionMinutes` (int 5-480) to create and update.
2. Service: validate `sessionMinutes % slotDuration === 0` using `OrgScheduleConfigService.getByOrg`. Reject with a message showing the slot length. Locked subjects (`is_locked`) cannot be edited (existing rule stays).
3. Repository, mapper and response type: read/write and return both fields plus the resolved effective values.
4. Seeder: subject definitions may carry optional session data; otherwise the defaults apply. Do not force values on seeded subjects.
5. Changing `slotDuration` in the org config (Phase 1 flow) must not break subjects. Subjects with an explicit `session_minutes` that is no longer a multiple should be reported (warning in the config-save response or in readiness), not blocked.

## Frontend
1. `SubjectDialog`: two optional number fields ("Sessions per week", "Minutes per session"). Minutes uses a select of valid multiples of the slot length. Show the default it will use when empty (e.g. "Default: 5 x 60 min").
2. `SubjectColumns`/table: show a compact "5 x 60m" column with a muted style when default.
3. Data seeder and School Profile subject steps: no required change. Optionally show the default note.
4. Types/API: add fields.

## Edge cases
- Subject shared to multiple courses/levels: one requirement applies to all sharings.
- `sessions_per_week` greater than the number of active weekdays: allowed (two sessions on one day). The generator handles it, and readiness warns.

## Tests
- Resolver: explicit vs default, rounding.
- Service: rejects non-multiples, accepts null, locked subject behavior.

## Acceptance
- Admin can set "3 x 60 min" on a subject. Empty subjects show the default. No existing screen breaks.
