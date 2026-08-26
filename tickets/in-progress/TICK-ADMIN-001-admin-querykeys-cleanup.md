# TICK-ADMIN-001 — Fix admin ad-hoc React Query keys (gradingScales, schoolYears, templates)

Status: ready-for-review
Priority: high
Created: 2026-08-26
Created by: agent
Assigned to: agent
Started: 2026-08-26
Worktree: ../EduToolV4-worktrees/TICK-ADMIN-001-admin-querykeys-cleanup
Branch: agent/TICK-ADMIN-001-admin-querykeys-cleanup

## Problem

Admin components use raw arrays for query keys instead of queryKeys.admin factory — breaks centralization, invalidation misses, styling not realtime. Audit A5-10, A24, A11, A13: GradingScaleList/CreateDialog/AssignmentSection/\grading-scales/page\ use \[\"admin\",\"gradingScales\"]\ raw vs \queryKeys.admin.gradingScales.all\; TemplateAssignmentPanel uses raw \[\"admin\",\"gradingSchemeTemplates\",...]\ vs factory; SchoolYearCard/EditDialog use kebab \[\"admin\",\"school-years\"]\ vs \queryKeys.admin.schoolYears.all\; useSemesterTemplate extends with 'assignments'/'programs' suffix; students/import uses 'credentials-list' suffix.

## Goal

1. Replace all raw admin gradingScales/schoolYears/template keys with factory calls so mutations invalidate correctly and UI updates without reload.
2. Ensure gradingScales assignments use queryKeys.admin.gradingScales.assignments(schoolYearId).
3. Fix school-years kebab to camelCase factory.
4. Verify no raw strings remain via grep.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md, skills/frontend/FACTS.md
- frontend/src/hooks/queryKeys/admin.keys.ts
- frontend/src/components/admin/grading-scale/GradingScaleList.tsx
- frontend/src/components/admin/grading-scale/CreateGradingScaleDialog.tsx
- frontend/src/components/admin/grading-scale/GradingScaleAssignmentSection.tsx
- frontend/src/app/admin/grading-scales/page.tsx
- frontend/src/components/admin/grading-scheme-template/TemplateAssignmentPanel.tsx
- frontend/src/components/admin/school-years/SchoolYearCard.tsx
- frontend/src/components/admin/school-years/EditSchoolYearDialog.tsx
- frontend/src/hooks/admin/useSemesterTemplate.ts
- frontend/src/app/admin/students/import/page.tsx

## Acceptance Criteria

- [x] No raw \[\"admin\",\"gradingScales\"]\ literals — uses queryKeys.admin.gradingScales.all/list
- [x] AssignmentSection uses queryKeys.admin.gradingScales.assignments(schoolYearId)
- [x] No raw \[\"admin\",\"school-years\"]\ — uses queryKeys.admin.schoolYears.all
- [x] TemplateAssignmentPanel uses queryKeys.admin.gradingSchemeTemplates.programAssignments/classAssignments
- [x] tsc --noEmit --skipLibCheck and eslint pass on touched files

## Confidence

Score: 95/100
- Requirement clarity: 96 (audit enumerated exact files/lines)
- Codebase verification: 95 (read admin.keys factory, all listed components)
- Architecture fit: 96 (factory already has correct keys)
- Edge cases: 92 (assignment schoolYearId null handling)
- Blast radius: 95 (admin UI only)
No cap — no auth/tenant/grading invariants unverified.

## Tests

- Targeted: tsc --noEmit --skipLibCheck pass (via junction), eslint pass on 10 files
- Full suite: not run (phase 2)
- Development integration: not run (await merge)

## Blocker

None.

## Activity Log

2026-08-26 — Claimed, creating worktree from development.
2026-08-26 — Migrated 10 files to factory keys, verified tsc/eslint, committed 898dd20.
2026-08-26 — Ready for review.

## Commits

- 898dd20 feat(admin): replace ad-hoc React Query keys with factory keys

## Notes

Phase 2 of React Query factory phased fix.
