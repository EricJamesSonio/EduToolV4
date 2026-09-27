# TICK-ASSESS-001 — Grading scheme type gap (assignment/participation/behavior filtered)

Status: in-progress
Priority: high
Created: 2026-09-28
Created by: agent
Assigned to: agent
Started: 2026-09-28
Worktree: ../EduToolV4-worktrees/TICK-ASSESS-001-grading-type-gap
Branch: agent/TICK-ASSESS-001-grading-type-gap

## Problem

Frontend `new/page.tsx:55-58` hardcoded `ASSESSMENT_TYPE_VALUES` omits `assignment`, `participation`, `behavior`, so `schemeTypes` filter drops them even when the class scheme contains them. Same 3 missing from `frontend/src/types/educator/assessment.types.ts:3-6` and `backend/src/modules/grading-scheme/entity/grading-scheme.entity.ts:1-13`. Backend DTO (`grading-scheme.dto.ts:17-32`) and `assessment.dto.ts:39-54` already allow all 14. `assessment-inclusion.util.ts` is date-only, not involved.

## Goal

1. ONE backend canonical type list imported by `assessment.dto.ts`, `grading-scheme.dto.ts`, `grading-scheme.entity.ts`.
2. Frontend derives from complete `constants.ts` — delete separate allow-list in `new/page.tsx:55-58`.
3. `AssessmentBadges.tsx:14-26` covers the 3 missing types.
4. Do NOT touch `manual` behavior — log in FOLLOW_UPS.md.
5. Tests: assignment/participation/behavior save, badge, grade grouping.

## Relevant Areas

- shared/skills/database/MUST-HAVES.md §Grading invariants
- shared/skills/backend/MUST-HAVES.md, shared/skills/frontend/MUST-HAVES.md
- shared/skills/testing/MUST-HAVES.md
- backend/src/modules/grading-scheme/*, backend/src/modules/assessment/*
- frontend/src/components/educator/assessment-builder/constants.ts, frontend/src/types/educator/assessment.types.ts, frontend/src/app/educator/classes/[classId]/assessments/new/page.tsx

## Acceptance Criteria

- [ ] Canonical backend list exists, DTOs/entity import it (no parallel redeclaration)
- [ ] Frontend allow-list deleted; schemeTypes derives from shared constants
- [ ] Badges render assignment/participation/behavior correctly
- [ ] Targeted tests pass; lint/typecheck pass in worktree
- [ ] `manual` logged in FOLLOW_UPS.md, untouched in code

## Confidence

- Score: 92/100 (Requirement 25, Codebase verification 22, Architecture 20, Edge cases 10, Blast radius 15).
- Gaps: grade-grouping behavior for the 3 types verified only via code read (generic string-key grouping), not yet via executed test. Assumption: generic grouping handles them with no change; targeted test will confirm.
- Grading touched but change is allow-list/display only, no scoring formula change.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

- 2026-09-28: Claimed, counter ASSESS=1. Confidence 92/100 as above.

## Commits

None yet.

## Notes

- Phase A of 3-phase plan (smallest first). Phases B/C get separate tickets/branches.
