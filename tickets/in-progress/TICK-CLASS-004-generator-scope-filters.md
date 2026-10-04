# TICK-CLASS-004 — Generator scope filters: department/course/strand/level + educator select + coverage

Status: ready-for-review
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

- [x] All-departments toggle + per-department/course/strand/level/section select with counts; BSCS-only scope shows only BSCS levels/sections
- [x] Unselected educator is excluded from preview/commit (pairs become unplaced with reason)
- [x] Frontend shows uncovered-subjects banner + per-educator coverage note for current scope
- [x] Backend readiness validates educator selection (scope_no_coverage / educator_excluded style issues) and re-validates at commit; org-ownership asserted server-side
- [x] Tenant scoping from token only; unknown DTO fields rejected
- [x] Targeted tests green; no new tsc/lint errors vs baseline

## Confidence

- Score: 88/100 (Requirement clarity 23, Codebase verification 22, Architecture fit 18, Edge cases 12, Blast radius 13).
- Gaps: exact section/subject course_id population for older seeded years not fully traced; proceeding with assumption: filter by level.course_id/strand_id joined with section.course_id/strand_id, either match keeps the row (consistent with sectionApi/levelApi query params). Flagging for review.
- Post-implementation verification (2026-10-04, on rebased branch):
  - backend `tsc --noEmit`: 0 errors; eslint clean on class-generator.
  - backend class-generator suites: 45/45 green (39 pre-existing + 6 new: 5 scope-filter service tests, 1 DTO allowlist test; 2 failed mid-work on the unfiltered-snapshot aliasing bug, fixed, rerun green).
  - frontend `tsc --noEmit`: 20 errors, all pre-existing or carried-WIP (none in touched files; verified per-file).
  - frontend eslint clean on all 7 touched files; generatorScope 7/7 + readiness-targets 9/9 green (16 total).
  - Assumption change from plan: scope matching uses DIRECT course_id/strand_id on subjects/sections (mirrors backend query); UI tree groups by level linkage for display only. Explicit sectionIds are intersected server-side.

## Tests

- Targeted: class-generator.service.spec (+5 scope tests), class-generator-dto-uuid.spec (+1 allowlist test), generatorScope.test.ts (new, 7 tests)
- Full suite: Level 3 gates — relevant unit (BE 45/45, FE 16/16), typecheck (BE 0, FE 0-new), lint (clean both), no build (left to CI per repo norm)
- Development integration: rebased onto origin/development (a6932616) clean, 18/18 no conflicts; gates re-run post-rebase, all green

## Blocker

Resolved 2026-10-04 (see Activity Log). Was: base files existed only as another agent's uncommitted WIP; owner directed in-place branch + rebase flow.

## Activity Log

2026-10-04 — Claimed (counter CLASS 3 -> 4). Worktree + branch per AGENTS.md.
2026-10-04 — Base verification failed: origin/development lacks the generator; main-checkout WIP belongs to another agent. Ticket set to blocked, worktree kept but untouched (no code changes made).
2026-10-04 — Owner overrode: TICK-GRADE-006 merge never included generator work; directed in-place branch `agent/TICK-CLASS-004-class-generator`, commit WIP sensibly, rebase onto origin/development, push branch only. Base verified: `merge-base --is-ancestor 2ae49877 origin/development` = 0. Isolated worktree removed. Ticket back to in-progress.
2026-10-04 — Implemented scope filters (BE: DTO/service/controller/specs; FE: GeneratorScopeFilter, page wiring, generatorScope util+tests, types/api/hook). Committed base WIP in 3 carry commits + 2 ticket commits. Rebased onto origin/development (a6932616) 18/18 clean, gates re-run green. Branch pushed. Ticket to ready-for-review.

## Commits

- 5cb2cd44 — chore(generator): carry base WIP (backend pair-claims, educator subjects, session reqs, seeders)
- bebb9e62 — feat(generator): carry base WIP (frontend generate page, panels, roster UI, cards, schedule UI)
- 0b7f3ba2 — chore(carry): unrelated-domain WIP (audit-log, grade-lock, students, room, modal, loader)
- eba9f387 — feat(class-generator): scope filters (course/strand/educator allowlist, coverage readiness) + EnrichedFields export fix
- 794ca139 — feat(classes): scoped generate UI (tree, educator select, coverage banner)
- Branch: agent/TICK-CLASS-004-class-generator (rebased onto origin/development a6932616, pushed)

## Commits

(none yet)

## Notes

Default scope = all departments selected (owner answer). Unselected educator = not used in generation (owner answer). Coverage = frontend + backend readiness (owner answer).
