# TICK-STUDENT-002 — Student detail school-year selector

Status: in-progress
Priority: high
Created: 2026-10-07
Created by: agent
Assigned to: agent
Started: 2026-10-07
Worktree: ../EduToolV4-worktrees/TICK-STUDENT-002-student-detail-year-selector
Branch: agent/TICK-STUDENT-002-student-detail-year-selector

## Problem

The admin student detail page is hard-wired to the ACTIVE school year with no selector: info-card enrollment block, class enrollments + count, schedule and the Enroll dialog all ignore other years, while Academic History is year-filtered without being labeled.

## Goal

School year selector via the shared `useSelectedSchoolYear` hook (new), URL-synced (`?sy=`), defaults to the active year. Scopes: info-card enrollment block, class enrollments + count, schedule, Enroll dialog. Academic History and Subject Completion stay unscoped and are labeled "All school years". Mutating actions disabled outside the active year with a tooltip.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md, shared/skills/testing/MUST-HAVES.md
- frontend/src/hooks/useSelectedSchoolYear.ts (new shared hook)
- frontend/src/app/admin/students/[id]/page.tsx, components/admin/student/detail/*

## Acceptance Criteria

- [ ] Selector in the page header, URL-synced, active-year default
- [ ] Info-card enrollments, class enrollments + count, schedule, Enroll dialog follow the selected year
- [ ] Academic History + Subject Completion unscoped with "All school years" labels
- [ ] Mutations disabled outside the active year with tooltips
- [ ] lint + tsc + related specs pass

## Confidence

- Score: 88/100 (Requirement clarity 23, Codebase verification 22, Architecture fit 19, Edge cases 12, Blast radius 12). Band 80-94.
- Assumptions: (1) new shared hook at `hooks/useSelectedSchoolYear.ts` (no such hook exists; educator page keeps its local state — migrating it is out of scope); (2) enrollments and eligible classes filter client-side by `school_year_id` on the wire (no backend change — per-student volumes are small); (3) "mutating actions" = Enroll, Remove enrollment, Shift Program, Change Year, Flag for Review, Move/Assign Section (Edit/Status/Reset Password stay enabled — identity, not year data).

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-10-07 — Claimed (counter STUDENT 1->2) as review item 2 of TICK-EDUCATOR-003. Step 0 recon approved by owner.

## Commits

None yet.

## Notes

None yet.
