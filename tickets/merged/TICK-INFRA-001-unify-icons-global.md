# TICK-INFRA-001 — Global unify icon colors (admin/educator/student/landing)

Status: ready-for-review
Priority: high
Created: 2026-08-25
Created by: agent
Assigned to: agent
Started: 2026-08-25
Worktree: ../EduToolV4-worktrees/TICK-INFRA-001-unify-icons-global
Branch: agent/TICK-INFRA-001-unify-icons-global

## Problem

Program icons were unified to bright solid PROGRAM_TYPE_COLORS (bg-[#BFDBFE] text-[#0B1E3A]) but School-Years, Educator, Student, and Landing (Features/Resources/Solution/Pricing) still use old low-contrast icon-edu / bg-primary/10 / pickCardColor hash and ad-hoc textColors arrays. Hover on semester/grading templates still fires when expanded. No single source — editing one palette doesn't propagate.

## Goal

1. Hover only when not expanded for TemplateCard, GradingScaleList, GradingSchemeTemplateList
2. School-Years icons globalized to PROGRAM_TYPE_COLORS solid (identical to Programs)
3. Landing icons + Solution/Pricing point fonts globalized to same solid palette, reusable, no adjacent duplicate colors

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md
- frontend/src/components/admin/program
- frontend/src/components/admin/school-years
- frontend/src/components/landing
- frontend/src/styles/utilities.css
- frontend/src/types/admin/program.types.ts
- frontend/src/lib/palette.ts

## Acceptance Criteria

- [x] Template cards hover suppressed when expanded
- [x] SchoolYearCard/ProgramsTab/ProgramDetailView icons use PROGRAM_TYPE_COLORS solid
- [x] FeaturesSection no adjacent same color (yellow/purple not side-by-side)
- [x] SolutionSection/PricingSection fonts reuse global palette, not duplicate arrays
- [x] npm run lint && npm run build pass

## Confidence

Score: 85/100
- Requirement clarity: 90
- Codebase verification: 85 (verified via explore, 20+ educator files still old, now fixed)
- Architecture fit: 90
Assumption: fallback for generic (no program.type) uses icon-structure solid (#BFDBFE).

## Tests

- Targeted: lint --silent passed (0 errors)
- Full suite: build passed (Next.js 16.2.1, 58 routes, Compiled successfully in 44s, TypeScript 50s)
- Development integration: not yet (await merge)

## Blocker

None.

## Activity Log

2026-08-25 — Claimed, created worktree from development.
2026-08-25 — Implemented hover fix + global icon unification (educator 24 files, student 5, admin 6, landing 4, utilities solid), built clean, committed 56831397.
2026-08-25 — Ready for review.

## Commits

- 56831397 feat(frontend): unify global icon colors and fix template hover

## Notes

None yet.
