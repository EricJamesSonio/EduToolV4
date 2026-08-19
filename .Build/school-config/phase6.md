# Phase 6 — Polish, Entry Points, Tests

## Step 0 — Investigate

Review current `frontend/e2e/admin-setup.spec.ts` structure (10 passing tests, per
existing suite) to match its conventions rather than inventing a new test style.

## Step 1 — Empty-state entry point polish

- On `/admin/school-years/page.tsx` with zero real school years, the entry point (built
  minimally in Phase 1) gets its final UI pass: clear framing ("Set up your school's
  structure once, reuse it every year"), distinguishing "Start configuring" (enters
  config mode) from any later "create a school year without a preset" path that should
  remain available even before a config exists.

## Step 2 — Partial/Complete indicator

- Wherever the "use preset" toggle appears (Phase 5, `CreateSchoolYearDialog.tsx`), show
  a small badge reflecting the config's completeness, reusing the Phase 3 structural
  readiness function run against the blueprint (e.g. "Partial — some departments missing
  levels" vs "Complete"). This is informational only — it does not block using the
  preset, since partial presets are explicitly allowed.

## Step 3 — Tests

- Unit tests: promotion service (partial + full configs), generation service (no
  duplication of global entities, correct FK mapping across all levels), structural
  readiness function (each issue type).
- E2E (Playwright, matching existing suite conventions):
  1. Empty school-years page → start configuring → create department → confirm route
     guard blocks navigating elsewhere → complete all steps → save configuration.
  2. Exit mid-flow → confirm modal → resume → confirm data persisted → confirm restart
     lands on Department step.
  3. Create a new school year with preset toggle on → confirm generated structure
     matches the saved config.
  4. Delete preset and start fresh → confirm blueprint's structural data is cleared but
     blueprint row itself persists.
  5. Tutorial toggle off → confirm note text hidden, gating behavior unchanged.

## Verification

- Full Jest suite green.
- Full Playwright suite green, including new specs above.
- Manual pass through the entire flow once end-to-end as a sanity check beyond
  automated coverage.

## Explicitly deferred (not this build)

- Grading Scheme rule capture (default-by-subject-type).
- School Profile overview page reading from config.
- Multiple named presets per org.
