# TICK-ASSESS-006 — Editable assessments with type-change gates

Status: in-progress
Priority: high
Created: 2026-10-07
Created by: agent
Assigned to: agent
Started: 2026-10-07
Worktree: ../EduToolV4-worktrees/TICK-ASSESS-006-assessment-edit
Branch: agent/TICK-ASSESS-006-assessment-edit

## Problem

Assessments cannot be edited (title/type/dates/week/show-breakdown/max-score). Backend `update()` drops `title`, cannot clear dates.

## Goal

Split out of TICK-EDUCATOR-003 (review: assessment edit was never in the reviewer's prompts; it must not block educator work or collide with the TZ rebase). `PATCH` assessment update with title/null-clear/type-change gates/recompute/audit/notify + `EditAssessmentDialog`.

## Relevant Areas

- shared/rules/architecture.md, shared/skills/backend/MUST-HAVES.md, shared/skills/frontend/MUST-HAVES.md, shared/skills/testing/MUST-HAVES.md
- backend/src/modules/assessment/**, grade-lock/*, notification/*
- frontend/src/app/educator/classes/[classId]/assessments/*, components/educator/assessment/*, api/educator/assessment.api.ts, hooks/educator/useAssessments.ts

## Acceptance Criteria

- [ ] Title persisted; null clears dates; end<release rejected; type gates (submissions/lock/scheme/mode); recompute fired; audit has field diff; dialog disabled states with reasons
- [ ] lint + tsc + targeted backend/frontend specs pass
- [ ] Date-helper swap points marked TODO(TICK-INFRA-017); rebase onto development at merge (TZ Step 4.1 touches the same DTO/service lines)

## Confidence

- Score: 90/100 (Requirement clarity 24, Codebase verification 25, Architecture fit 19, Edge cases 12, Blast radius 13). Band 80-94.
- Assumptions: (1) cherry-picked unchanged from TICK-EDUCATOR-003's third commit; (2) timezone helpers (@IsInstant/parseInstant/localInputToIso/isoToLocalInput/formatInZone) still unmerged — semantics implemented with current primitives + TODO markers, build green; (3) full backend suite failures are all pre-existing (verified against clean base on the parent ticket).

## Tests

- Targeted: PASS (inherited from parent ticket: backend assessment 67/67 incl. 12 new update specs; frontend EditAssessmentDialog 6/6; tsc + eslint clean both apps)
- Full suite: not run on this branch (inherited result from parent ticket)
- Development integration: not run

## Blocker

None. Awaiting TZ Step 4.1 merge before this merges (rebase + helper swap).

## Activity Log

2026-10-07 — Split from TICK-EDUCATOR-003 per review item 4 (counter ASSESS 5->6). Cherry-picks the assessment-edit commit onto its own branch so educator work proceeds separately.

## Commits

None yet (cherry-pick next).

## Notes

Parent ticket TICK-EDUCATOR-003 keeps commits A (f5f77b15) + B (ff0bec6d) plus review follow-ups; its third commit is removed from that branch after this split.
