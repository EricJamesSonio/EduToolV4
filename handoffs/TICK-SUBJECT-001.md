# TICK-SUBJECT-001 — Subject hierarchy: collapsible header + gate subjects behind course/strand (handoff)

Status: ready-for-review
Branch: `agent/TICK-SUBJECT-001-hierarchy-collapse-scope-gate`
Worktree: `../EduToolV4-worktrees/TICK-SUBJECT-001-hierarchy-collapse-scope-gate`
Base: `development` @ `8d71f001`
Commit: `e298220f` (7 files, +512/-47)

## What changed

Two changes to `/admin/subjects/hierarchy`.

**1. The filter block now collapses.** The title, four dropdowns, hint line and
legend/stats bar were permanently expanded inside a `shrink-0` container
(`SubjectHierarchyGraph.tsx:429`), so the chrome permanently consumed graph
height. A `Hide filters` / `Show filters` toggle collapses it to a single line
that keeps the title plus `N subjects · M prerequisite links · K years`, so the
scope context survives without the height cost. The preference persists in
`localStorage` (`subject-hierarchy-header-collapsed`), following the existing
`useSubjectPreset` / `useClassPreset` pattern, and a storage failure (private
mode) degrades to the default rather than breaking the page.

**2. Subjects no longer render before a course/strand is chosen — the bug.**
The hook gated on `!!scope.programId || !!scope.schoolYearId`, and
`subject.service.ts:370-384` only narrows further once `courseId`/`strandId` is
present. So School Year + College/University showed every subject in that
department across all courses before a course was picked, and a bare school year
showed every department at once.

- `hierarchyScope.ts` (new) — pure `isHierarchyScopeReady()`: loads after a
  course for a college program **that has courses**, after a strand for an SHS
  program **that has strands**, and after the department alone when it has
  neither. Plus `hierarchyScopePrompt()` for the hint copy and
  `findScopeProgram()`.
- `useSubjectHierarchy.ts` — department is now the minimum scope, and `data` is
  suppressed when not ready.
- `useHierarchyPrograms.ts` (new) — shared hook so the page reads a
  department's courses/strands from the same cache entry the filter already
  uses; no second request.
- `SubjectHierarchyFilter.tsx` — swapped its inline `useQuery` for that hook
  (same key/freshness, no behavior change).

| Selected | After department | After course/strand |
|---|---|---|
| No course & no strand | loads | n/a |
| College with courses | waits ("pick a course") | loads |
| SHS with strands | waits ("pick a strand") | loads |
| Nothing picked | waits | — |

## Two findings worth the reviewer's attention

- **`placeholderData` made the obvious fix a no-op.** The hook sets
  `placeholderData: (prev) => prev` (line 39), and React Query applies it even
  to a **disabled** query. Gating `enabled` alone therefore still painted the
  previous department's subjects — the bug would have looked unfixed. The hook
  now returns `data = ready ? query.data : undefined`; that is what actually
  stops the stale graph.
- **The readiness rule deliberately mirrors the filter's dropdown conditions**
  (`type === "college"` → Course, `type === "shs"` → Strand,
  `SubjectHierarchyFilter.tsx:162,187`) rather than just "has courses". A rule
  based only on course presence would demand a `courseId` for, say, a `custom`
  program that has courses but renders no Course dropdown — an unreachable
  state, i.e. a permanently empty screen. Covered by a test.

## Validation

| Check | Result |
|---|---|
| `frontend` jest | **22 suites / 231 tests green** (20 new: 14 scope-rule, 6 collapse) |
| `frontend` tsc | **20 before / 20 after, error sets byte-identical** (`Compare-Object`), 0 new |
| `frontend` eslint | 0 output |
| Targeted | `src/components/admin/subject/hierarchy` 27/27; `src/app/admin/subjects/hierarchy` 6/6 |
| Development integration | not run (branch not merged; reviewer re-runs the suite after merge) |

Baseline was **measured, not assumed**: reverted to pristine `8d71f001`, ran
`tsc --noEmit`, then compared normalized error lists. No error mentions
`hierarchy` or `useHierarchyPrograms`.

## Tests added

- `hierarchyScope.test.ts` (new) — every branch, incl. "bare school year loads
  nothing", "department with no course/strand is ready", and the no-dead-end
  guarantee for a non-college/non-shs program that has courses.
- `page.test.tsx` (new) — default expanded, collapse/expand round trip,
  `aria-controls` resolves while collapsed, persistence across mounts, private
  mode, and the summary staying visible when collapsed.

## Not in scope (deliberate)

- `students/[id]/hierarchy` and `SubjectHierarchyModal` are unchanged: their
  scope comes from a student's enrollment, which may legitimately have no
  course, so the strict college/SHS gate does not apply.
- The backend is left permissive on purpose — the student page legitimately
  queries program-only, so `/subjects/hierarchy` must keep answering.

## Suggested follow-up

1. The `hidden` attribute keeps the filter subtree mounted while collapsed, so
   `SubjectHierarchyFilter` stays mounted and its (cached) queries stay alive.
   Cheap to unmount instead if that ever matters — only worth doing alongside
   the a11y tradeoff, since `aria-controls` then points at a missing node.
2. `SubjectHierarchyModal` has the same always-expanded legend block; the same
   toggle could be reused there.