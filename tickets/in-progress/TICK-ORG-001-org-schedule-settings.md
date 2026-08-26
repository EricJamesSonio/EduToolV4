# TICK-ORG-001 — Organization schedule time-range settings (global)

Status: in-progress
Priority: high
Created: 2026-08-27
Created by: agent
Assigned to: agent
Started: 2026-08-27
Worktree: ../EduToolV4-worktrees/TICK-ORG-001-org-schedule-settings
Branch: agent/TICK-ORG-001-org-schedule-settings

## Problem

Class schedule creation uses free-form HH:MM with no global bounds. Need a single org-wide time-range + slot duration so assigning classes selects from constrained slots (e.g. 07:00-17:00, 30m => 07:00,07:30...).

## Goal

1. Org-wide config: start_time (default 07:00), end_time (default 17:00), slot_duration in [15,20,25,30,45,60] default 30, stored per org_id unique.
2. Strict update rule: PUT rejected with Conflict if any existing ClassSchedule would be out-of-bounds or misaligned; else succeeds.
3. Class creation/update validates against config (bounds + duration + alignment) via parseSlots.
4. Frontend: Organization page becomes tabbed (Details | Schedule) with schedule form, preview, warn on conflict. Class picker uses config to generate options.

## Relevant Areas

- shared/rules/architecture.md, shared/skills/backend/MUST-HAVES.md
- shared/skills/frontend/MUST-HAVES.md
- shared/rules/security.md (multi-tenant isolation)
- shared/rules/database-migrations.md
- backend/prisma/schema.prisma
- backend/src/modules/org-schedule-config/*
- backend/src/modules/class/class.service.ts
- backend/src/modules/class/class-schedule.util.ts
- backend/src/modules/organization/*
- frontend/src/app/admin/organization/page.tsx
- frontend/src/components/admin/organization/*
- frontend/src/components/admin/class/ClassSchedulePicker.tsx
- frontend/src/api/admin/*
- frontend/src/hooks/queryKeys/*

## Acceptance Criteria

- [ ] Prisma model OrgScheduleConfig + migration, default 07:00-17:00/30, unique org_id
- [ ] GET/PUT /org-schedule-config admin-only, token-scoped org_id, returns config (lazy-create on GET)
- [ ] PUT strict-blocking: returns 409 with affectedCount if any ClassSchedule out-of-bounds/misaligned
- [ ] class.service parseSlots enforces bounds/duration/alignment against config
- [ ] Frontend Organization tabbed, Schedule tab form + preview + conflict toast, ClassSchedulePicker generates slots from config
- [ ] lint/typecheck/test/build pass

## Confidence

Score: 96/100 (Requirement clarity 25, Codebase verification 24, Architecture fit 20, Edge cases 12, Blast radius 15). Edge 12: concurrent PUT vs class creation race is low-risk (single admin contention), flagged for review. No assumption in 80-94 band; proceeding at >=95.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-08-27 - Claimed TICK-ORG-001, creating worktree from development. Confidence 96/100 logged.

## Commits

None yet.

## Notes

Tab inside Organization per user decision C. Weekdays locked (no config). Durations 15,20,25,30,45,60 default 30.

