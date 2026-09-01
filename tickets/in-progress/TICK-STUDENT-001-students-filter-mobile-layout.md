# TICK-STUDENT-001 — Admin Students page filter controls stack vertically on small screens

Status: in-progress
Priority: medium
Created: 2026-09-01
Created by: agent
Assigned to: agent
Started: 2026-09-01
Worktree: ../EduToolV4-worktrees/TICK-STUDENT-001-students-filter-mobile-layout
Branch: agent/TICK-STUDENT-001-students-filter-mobile-layout

## Problem

On the admin **Students** page (`/admin/students`), all filter controls use fixed
Tailwind widths (`w-64` search, `w-48`, `w-44`, `w-40`, `w-36` selects inside
`flex flex-wrap` rows). On desktop the row has enough room so the controls sit
side by side; on narrow/mobile viewports each fixed-width control no longer fits
on the row and `flex-wrap` drops each onto its own line — the filters stack
vertically one-per-row, which looks broken and wastes vertical space. The rest
of the page is already responsive.

Affected surfaces:

- `frontend/src/components/admin/student/StudentHierarchyFilter.tsx` — School
  Year / Department / Course / Strand / Level / Section cascade (Row 1).
- `frontend/src/components/admin/student/StudentFilterBar.tsx` — search +
  status row (Row 2).
- `frontend/src/app/admin/students/page.tsx` — Review status + Prereq warning
  row (Row 3).

## Goal

On small screens, filter controls should line up **side by side** (2–3 per row,
wrapping gracefully) instead of stacking one-per-line, while keeping the exact
same desktop layout as today.

1. Each filter control becomes a flexible-width flex item below `sm`
   (`flex-[1_1_<min>] min-w-*`), so multiple controls share each row.
2. At `sm:` and above, controls snap back to their existing fixed widths —
   desktop pixel-identical to current behavior.
3. No logic/data/state changes — CSS classes only.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md (component conventions)
- frontend/src/components/admin/student/StudentHierarchyFilter.tsx
- frontend/src/components/admin/student/StudentFilterBar.tsx
- frontend/src/app/admin/students/page.tsx

## Acceptance Criteria

- [ ] Mobile (<sm): hierarchy selects wrap 2–3 per row; search + status share a
      row; review + warning selects share a row.
- [ ] Desktop (≥sm): every control keeps its current fixed width (no visual
      regression).
- [ ] tsc --noEmit --skipLibCheck and eslint pass on the touched files; frontend
      build passes.

## Confidence

Score: not yet assessed

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-09-01 — Claimed, creating worktree from development.

## Commits

<Filled in as work lands.>

## Notes

None yet.