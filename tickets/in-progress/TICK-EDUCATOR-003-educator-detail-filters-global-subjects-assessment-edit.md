# TICK-EDUCATOR-003 — Educator detail filters + global teachable subjects + assessment edit

Status: in-progress
Priority: high
Created: 2026-10-06
Created by: agent
Assigned to: agent
Started: 2026-10-06
Worktree: ../EduToolV4-worktrees/TICK-EDUCATOR-003-educator-filters-global-subjects-assessment-edit
Branch: agent/TICK-EDUCATOR-003-educator-filters-global-subjects-assessment-edit
Secondary domains: ASSESS (part C), CLASS (generator eligibility read path)

## Problem

1. Educator detail page school-year selector only affects the subjects modal; Classes tab ignores it, subjects list unfiltered. Semester filtering missing. UUID bug: unresolved sections render as `id.slice(0,8)`.
2. Teachable subjects are school-year scoped, forcing per-year "copy from previous year". Product wants GLOBAL eligibility with per-year section/slot picks.
3. Assessments cannot be edited (title/type/dates/week/show-breakdown/max-score). Backend `update()` drops `title`, cannot clear dates.

## Goal

A. Year+semester filters on both tabs (URL `?sy=&sem=`), assign picker scoped, A5 server-resolved sections, no truncated ids.
B. New `EducatorTeachableSubject` global-key table; `setBundle` keeps contract; generator resolves via global keys; orphan pruning on subject delete; teachable links cascade (not block) on educator delete; carry-over UI removed.
C. `PATCH` assessment update with title/null-clear/type-change gates/recompute/audit/notify + `EditAssessmentDialog`.

## Relevant Areas

- shared/rules/database-migrations.md, scalability.md, architecture.md, git-workflow.md, confidence-gating.md
- shared/skills/backend/MUST-HAVES.md, frontend/MUST-HAVES.md, testing/MUST-HAVES.md, database/MUST-HAVES.md
- backend/src/modules/educator/*, class/*, class-generator/*, subject/*, assessment/**, grade-lock/*
- frontend/src/app/admin/educators/[id]/*, components/admin/educator/*, hooks/admin/useSemester.ts, api/admin/*

## Acceptance Criteria

- [ ] A: semester selector (year's semesters only + All, today-default, reset on year change, URL persisted); classes tab + counts filtered; picker scoped; subjects rows show year sections + Generated/Not generated; no `slice(0,8)` anywhere on this page
- [ ] B: migration applies; key resolution across 2 years; missing subject in year 2 hidden; orphan pruning; generator eligibility via global key; educator deletion cascades config rows; carry-over UI gone
- [ ] C: title persisted; null clears dates; end<release rejected; type gates (submissions/lock/scheme/mode); recompute fired; audit has field diff; dialog disabled states with reasons
- [ ] lint + tsc + targeted backend/frontend specs pass per commit; 3 ordered commits (A, B, C)

## Confidence

- Score: 90/100 (Requirement clarity 24, Codebase verification 22, Architecture fit 19, Edge cases 12, Blast radius 13). Band 80-94: proceeding with disclosed assumptions.
- Assumptions: (1) semester dropdown dedupes program-scoped semesters by name; default = semester containing today (org zone if resolvable, else date compare), else All; (2) timezone helpers (@IsInstant/parseInstant/localInputToIso/isoToLocalInput/formatInZone) do not exist yet on development — code against those names; (3) single ticket/branch with 3 ordered commits per owner instruction (one-branch-per-ticket rule satisfied; secondary domains noted above); (4) TZ agent (TICK-INFRA-017) has no commits and its worktree is clean, and its touched files do not overlap parts A/C; part B deletion-DTO overlap to be merged carefully at review time.
- Re-score before Part B migration (schema verification) and Part C grading-adjacent rules.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-10-06 — Claimed (counter EDUCATOR 2->3). Plan approved by owner in plan mode; proceeding in build mode, part A first.

## Commits

None yet.

## Notes

Coordination: TZ agent owns datetime.util + helpers (not yet merged). This ticket imports those names only; touches assessment DTO/service lines C needs. Dirty `schema.prisma` + untracked migration files in main checkout belong to another agent's flow; this ticket works from clean `origin/development`.
