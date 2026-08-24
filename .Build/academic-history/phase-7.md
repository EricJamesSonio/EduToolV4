# Phase 7 — Frontend

**Mode:** This is an outline only. Do not enter Plan Mode for the actual UI work until Phases 1–6 are merged to `development` and the full backend suite passes.

## Why this phase is deferred in detail

Backend data integrity and architecture come before UI, per Eric's stated priority. Building frontend against a backend API shape that might still shift during Phases 1–6 risks throwaway work.

## When this phase actually starts

Return to Claude (planning) for a proper frontend breakdown once:

- Phases 1–6 are merged to `development`.
- The full suite (`npm run test`, `npm run test:e2e`, `npx tsc --noEmit`, `npm run lint`) passes clean on `development`.
- The API shapes from Phase 4/5 (admin + student academic history endpoints) and Phase 3 (shift-program endpoint) are stable and documented (actual response shapes, not assumed ones).

## Known surfaces (for planning purposes only — not a build spec)

- **Admin Academic History page** — likely a new tab on the existing Student detail page, near `StudentEnrollmentsList.tsx` / `EnrollStudentInClassDialog.tsx`.
- **Student Academic History page** — location depends on Phase 5's extend-transcript-vs-new-module decision; if new, needs a new nav item under `student/` app routes.
- **Shift Program action** — a new dialog/action wired into the existing Student detail enrollment panel, calling the Phase 3 `program-shift` endpoint. Needs a confirmation step given it's a permanent-record-creating action, not a reversible toggle.

## Rules

Same `01-rules-planmode.md` and `02-rules-buildmode.md` apply, including the React-specific build-mode rules (Rules of Hooks, `exhaustive-deps` disabled, no `prop-types`). Frontend planning should identify exact insertion points in existing components before proposing new ones, per the repo's "fix shared primitives, not individual pages" principle already established in this codebase.
