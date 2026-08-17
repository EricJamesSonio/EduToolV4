# Late-Enrollment Grading Exclusion — Phase 4: Frontend UI

Do not start until Phase 3 is confirmed complete and its endpoints are
reachable. Re-read the frontend files listed in Phase 0 fresh before editing
— they may have changed since that report.

## Goal

Let an educator, from the existing grade table view, see which cells are
excluded due to late enrollment and toggle an override — without adding a
new page or navigation entry. This is a small addition to an existing
surface, not a new feature area.

## Scope (fix the primitive, not the page)

1. `frontend/src/components/educator/grades/StatusCell.tsx` — this is the
   shared cell renderer. Add a visual state for "excluded — late
   enrollment" (e.g. a muted badge/tooltip, matching the existing badge
   styling already used for missed/exempted states in this same file — do
   not introduce a new badge style). On click/hover, show the `reason` from
   the Phase 3 API response.

2. `frontend/src/components/educator/grades/CleanGradeTable.tsx` and
   `DefaultGradeTable.tsx` — wire the per-cell inclusion data through to
   `StatusCell`. Check `types.ts` in this folder first to see whether grade
   row data already carries assessment metadata per cell, and extend that
   type rather than creating a parallel data structure.

3. A small override control (e.g. a popover or inline menu item triggered
   from the excluded cell) that calls the Phase 3 `POST`/`DELETE` override
   endpoints. Reuse the existing dialog/popover primitives already used
   elsewhere in `frontend/src/components/ui/` (`popover.tsx`,
   `dropdown-menu.tsx`) — do not add a new modal library or pattern.

## API layer

Add the corresponding calls to
`frontend/src/api/educator/grade.api.ts`, matching the existing function
naming and error-handling convention already in that file (check how other
functions in this file call the shared `client.ts` and handle errors before
writing new ones).

## Data fetching

Extend `frontend/src/hooks/educator/useGrades.ts` (or add a sibling hook in
the same folder if the existing hook's shape doesn't cleanly accommodate
this) using the same TanStack Query key factory pattern already established
in `frontend/src/hooks/queryKeys.factory.ts` — do not hand-roll a new query
key format.

## Constraints

- Tailwind v4 conventions apply: solid tokens (`bg-card`, `border-border`)
  for structural surfaces, opacity variants only for content tints. Do not
  use `hsl(var(--primary))` — `--primary` is a hex value; use `var(--primary)`
  or `fill-primary`/`bg-primary` directly.

- Mobile-first: any new grid/flex layout must start at the smallest
  breakpoint and scale up.
- Do not touch grade calculation logic on the frontend — this phase is
  display and override-triggering only. The actual inclusion/exclusion math
  lives entirely in Phase 2's backend logic.

## Verification (required before reporting done)

1. Load the grade table for a class with at least one late-enrolled student
   and confirm the excluded cell renders visually distinctly with the
   correct reason on hover.
2. Trigger the override control, confirm the cell updates to reflect the new
   state after the mutation succeeds (optimistic update or refetch — match
   whatever pattern `useGrades.ts` already uses for other mutations in this
   codebase).
3. Confirm no console errors and no TypeScript errors (`npm run lint` in
   `frontend/`).

## Guardrails

- Max 2 retries on any rendering/type error, different approach each retry.
- Do not restyle unrelated parts of `CleanGradeTable.tsx` /
  `DefaultGradeTable.tsx` while in this file — scope discipline: touch only
  what this feature needs.
- End with: **"Phase 4 complete. UI verified against a live late-enrollment
  case. Ready for Phase 5 confirmation."**
