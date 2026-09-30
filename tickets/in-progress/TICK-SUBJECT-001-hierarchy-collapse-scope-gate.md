# TICK-SUBJECT-001 — Subject hierarchy: collapsible header + gate subjects behind course/strand

Status: in-progress
Priority: medium
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Worktree: ../EduToolV4-worktrees/TICK-SUBJECT-001-hierarchy-collapse-scope-gate
Branch: agent/TICK-SUBJECT-001-hierarchy-collapse-scope-gate

## Problem

Two issues on `/admin/subjects/hierarchy`:

1. **The top block is always expanded.** The title, the four filter dropdowns,
   the hint line and the legend/stats bar are rendered into the graph's `header`
   prop, inside a `shrink-0` container (`SubjectHierarchyGraph.tsx:429`). There
   is no way to collapse it, so on short viewports the filter chrome permanently
   eats vertical space that the subject graph needs.

2. **Subjects render before a course/strand is chosen (bug).**
   `useSubjectHierarchy.ts:31` gates only on
   `!!scope.programId || !!scope.schoolYearId`, so picking School Year +
   Department fetches immediately. `subject.service.ts:370-384` only narrows
   further when `courseId`/`strandId` is present, so the graph renders every
   subject in the program — across all courses/strands — before the admin has
   chosen one. A bare school year is worse still: it loads every department's
   subjects at once.

## Goal

1. The header block can be collapsed/expanded, so the admin can focus on the
   subjects. Collapsed keeps the title and a one-line subject/link/year summary
   visible so context is not lost. The choice persists across visits.
2. Subjects (and the Level dropdown, which is fed by the same response) load
   only once the scope is meaningful:
   - department with **no** course and **no** strand → load right after the
     department is picked;
   - **college** department with courses → load after a course is picked;
   - **SHS** department with strands → load after a strand is picked;
   - nothing picked → nothing loads.
3. Until the scope is ready, the page states which selection is still needed
   instead of showing an empty or stale graph.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md (component + styling)
- shared/skills/testing/MUST-HAVES.md
- frontend/src/app/admin/subjects/hierarchy/page.tsx
- frontend/src/components/admin/subject/hierarchy/SubjectHierarchyFilter.tsx
- frontend/src/components/admin/subject/hierarchy/SubjectHierarchyGraph.tsx
- frontend/src/hooks/admin/useSubjectHierarchy.ts

## Acceptance Criteria

- [ ] Header collapses/expands from a toggle button (`aria-expanded`,
      `aria-controls`)
- [ ] Collapsed state persists across page loads
- [ ] Collapsed header still shows title + `N subjects · M prerequisite links ·
      K years`
- [ ] Department with no course/strand → hierarchy loads after department only
- [ ] College department with courses → no subjects until a course is picked
- [ ] SHS department with strands → no subjects until a strand is picked
- [ ] Bare school year loads nothing (no cross-department dump)
- [ ] Switching from a ready scope back to an incomplete one clears the graph
      (no stale subjects leaking through `placeholderData`)
- [ ] Hint text names the outstanding step (course vs strand)
- [ ] No second network request for the department list (shared cache key)
- [ ] Unit tests for the readiness rule; render test for the collapse toggle
- [ ] lint + typecheck show 0 new errors vs baseline; tests green

## Confidence

- Score: 90/100 (Requirement 20, Codebase verification 20, Architecture 20,
  Edge cases 15, Blast radius 15).
- Assumption (disclosed): the collapsed/expanded preference is persisted to
  `localStorage`, following the existing `useSubjectPreset` / `useClassPreset`
  pattern. Trivial to drop if unwanted.
- Key correctness constraint found during investigation: the readiness rule must
  mirror the filter's own dropdown conditions exactly
  (`type === 'college'` → Course, `type === 'shs'` → Strand,
  `SubjectHierarchyFilter.tsx:162,187`), otherwise a non-college/non-shs
  program that happens to have courses would demand a `courseId` the UI never
  offers — a permanently empty screen.

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

- 2026-09-30 — Ticket claimed. Root cause of the bug traced to the `ready`
  gate in `useSubjectHierarchy.ts:31` plus the backend only narrowing on
  `courseId`/`strandId`. Verified `GET /programs?schoolYearId=` already returns
  live `courses`/`strands` (`program.repository.ts:4-15`, `PROGRAM_LIST_INCLUDE`),
  so readiness needs no new endpoint.
- 2026-09-30 — Found the trap that makes an `enabled`-only fix a no-op: the hook
  sets `placeholderData: (prev) => prev` (line 39), which React Query applies
  even to a disabled query. Rendering must be gated on readiness as well as the
  fetch.

## Commits

- (pending)

## Notes

Deliberately **not** changed: `students/[id]/hierarchy` and
`SubjectHierarchyModal`. Their scope comes from a student's enrollment, which may
legitimately have no course, so the strict college/SHS gate does not belong
there.

Backend left permissive on purpose: the student page legitimately queries
program-only, so `/subjects/hierarchy` must keep answering those calls.