# TICK-CLASS-004 — Generator scope filters: department/course/strand/level + educator select + coverage

Status: in-progress
Priority: high
Created: 2026-10-04
Created by: agent
Assigned to: agent
Started: 2026-10-04
Worktree: main checkout in place (owner-directed, no isolated worktree)
Branch: agent/TICK-CLASS-004-class-generator

## Problem

Auto-generate (`frontend/src/app/admin/classes/generate/page.tsx`) only filters by flat department (`programIds`) then shows all levels/sections of those departments. No way to scope to All departments explicitly, a single course (e.g. College > BSCS) / strand, or a subset of levels; educator roster is display-only with no select/unselect and no coverage signal against the chosen scope.

## Goal

1. Scope tree: All departments toggle; department > course/strand (when present) > levels > sections, each with select/unselect + counts. Default: all departments selected.
2. Educator select/unselect: unchecked = excluded from preview/commit (not display-only).
3. Coverage signal frontend-instant + backend-validated: which in-scope subjects have zero selected educators; which selected educators cover nothing in scope.

## Relevant Areas

- frontend/src/app/admin/classes/generate/page.tsx
- frontend/src/components/admin/class/GeneratorScopeFilter.tsx (new)
- frontend/src/components/admin/class/ClassGeneratorPanels.tsx
- frontend/src/types/admin/class-generator.types.ts
- frontend/src/api/admin/class-generator.api.ts
- frontend/src/hooks/admin/useClassGenerator.ts
- backend/src/modules/class-generator/dto/class-generator.dto.ts
- backend/src/modules/class-generator/class-generator.service.ts (loadScope, buildReadiness, roster)
- backend/src/modules/class-generator/class-generator.controller.ts (assertScopeOwned)
- backend/src/modules/class-generator/__TEST__/class-generator.service.spec.ts

## Acceptance Criteria

- [ ] All-departments toggle + per-department/course/strand/level/section select with counts; BSCS-only scope shows only BSCS levels/sections
- [ ] Unselected educator is excluded from preview/commit (pairs become unplaced with reason)
- [ ] Frontend shows uncovered-subjects banner + per-educator coverage note for current scope
- [ ] Backend readiness validates educator selection (scope_no_coverage / educator_excluded style issues) and re-validates at commit; org-ownership asserted server-side
- [ ] Tenant scoping from token only; unknown DTO fields rejected
- [ ] Targeted tests green; no new tsc/lint errors vs baseline

## Confidence

- Score: 88/100 (Requirement clarity 23, Codebase verification 22, Architecture fit 18, Edge cases 12, Blast radius 13).
- Gaps: exact section/subject course_id population for older seeded years not fully traced; proceeding with assumption: filter by level.course_id/strand_id joined with section.course_id/strand_id, either match keeps the row (consistent with sectionApi/levelApi query params). Flagging for review.

## Tests

- Targeted: class-generator.service.spec (scope + educator exclusion + readiness), DTO validation, frontend scope/coverage util
- Full suite: per testing Level 3 (frontend+backend contract change): relevant unit + integration, typecheck, lint, build when appropriate

## Blocker

Resolved 2026-10-04 (see Activity Log). Was: base files existed only as another agent's uncommitted WIP; owner directed in-place branch + rebase flow.

## Activity Log

2026-10-04 — Claimed (counter CLASS 3 -> 4). Worktree + branch per AGENTS.md.
2026-10-04 — Base verification failed: origin/development lacks the generator; main-checkout WIP belongs to another agent. Ticket set to blocked, worktree kept but untouched (no code changes made).
2026-10-04 — Owner overrode: TICK-GRADE-006 merge never included generator work; directed in-place branch `agent/TICK-CLASS-004-class-generator`, commit WIP sensibly, rebase onto origin/development, push branch only. Base verified: `merge-base --is-ancestor 2ae49877 origin/development` = 0. Isolated worktree removed. Ticket back to in-progress.

## Commits

(none yet)

## Notes

Default scope = all departments selected (owner answer). Unselected educator = not used in generation (owner answer). Coverage = frontend + backend readiness (owner answer).
