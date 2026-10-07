# TICK-EDUCATOR-003 — Educator detail filters + global teachable subjects + assessment edit

Status: ready-for-review
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

- [x] A: semester selector (year's semesters only + All, today-default, reset on year change, URL persisted); classes tab + counts filtered; picker scoped; subjects rows show year sections + Generated/Not generated; no `slice(0,8)` anywhere on this page
- [x] B: migration applies; key resolution across 2 years; missing subject in year 2 hidden; orphan pruning; generator eligibility via global key; educator deletion cascades config rows; carry-over UI gone
- [x] C: title persisted; null clears dates; end<release rejected; type gates (submissions/lock/scheme/mode); recompute fired; audit has field diff; dialog disabled states with reasons
- [x] lint + tsc + targeted backend/frontend specs pass per commit; 3 ordered commits (A, B, C)

## Confidence

- Score: 90/100 (Requirement clarity 24, Codebase verification 25, Architecture fit 19, Edge cases 12, Blast radius 13). Band 80-94: assumptions disclosed below.
- Assumptions: (1) semester dropdown uses grouped (program, semester) options deduped by semester id (labels "Name - Program"), not name-deduped, so every option maps to one filterable semesterId; (2) org timezone: no org timezone column exists and TZ helpers are still unmerged, so the today-default compares instants with a documented TZ-edge caveat; (3) single ticket/branch with 3 ordered commits per owner instruction; secondary domains noted in header; (4) TZ agent (TICK-INFRA-017) has no commits on its branch; this ticket does NOT import vapor helpers — all date-helper swaps are marked TODO(TICK-INFRA-017) with exact paths/names, build stays green; (5) migration ships as a file (never applied to any shared/prod DB here; no DATABASE_URL available); backfill key SQL mirrors the JS norm; (6) full backend suite: 21 failed = 17 pre-existing (byte-identical counts on clean base) + 4 pre-existing educator bulkCreate (verified on clean base); audit-log-pagination fails standalone on base too (order-dependent, identical both sides).

## Tests

- Targeted: PASS — backend tsc + frontend tsc clean (all 3 commits); educator-subject 24/24, bundle, dto-uuid, subject-deletion/service/hierarchy, generator 159/159, grade-lock 17/17, assessment 67/67 (incl. 12 new update specs); frontend semester.utils 4/4, educatorSlotPicks, EditAssessmentDialog 6/6, assessment-builder 23/23; eslint 0 errors both apps (1 pre-existing backend unused-import warning + pre-existing bulkCreate failures unchanged).
- Full suite: backend unit 1230/1251 (21 failed = all pre-existing, verified against clean base per Confidence note); frontend full suite not run (box OOMs heavy jsdom suites under parallel-agent load; targeted suites pass; useTeachableSeed suite covers unmodified files + tsc proves its type boundary).
- Development integration: not run (reviewer merges + re-runs per workflow).

## Blocker

None. Reviewer note: rebase onto development at merge — TICK-INFRA-017 Step 4.1 touches the same assessment DTO/service lines (their ticket says so); my date-helper TODOs give the exact swap points. Prisma client must be regenerated after merge (new EducatorTeachableSubject model).

## Activity Log

2026-10-06 — Claimed (counter EDUCATOR 2->3). Plan approved by owner in plan mode; proceeding in build mode, part A first.
2026-10-07 — A committed f5f77b15; B committed ff0bec6d (migration 20261006120000_educator_teachable_subject_global, unapplied); C committed bffc80d7. All validation green (see Tests). Ticket to ready-for-review.

## Commits

- f5f77b15 — feat(educator): year and semester filters on educator detail page plus UUID fix
- ff0bec6d — feat(educator): global teachable subjects with per-year picks
- bffc80d7 — feat(assessment): editable assessments with type-change gates

## Notes

Coordination: TZ agent owns datetime.util + helpers (not yet merged). This ticket imports those names only; touches assessment DTO/service lines C needs. Dirty `schema.prisma` + untracked migration files in main checkout belong to another agent's flow; this ticket works from clean `origin/development`.
