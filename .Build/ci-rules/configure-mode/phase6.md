# Phase 6 — Polish + Tests

## Step 0 — Investigate

Review `frontend/e2e/admin-setup/` structure and `test/org-seeder.e2e-spec.ts`
conventions to match style rather than inventing a new test pattern.

## Step 1 — Tests

- Backend unit tests for the new `school-profile` module services (Phase 2),
  covering: department select/deselect with cascade, structural CRUD
  validation, predefined-data seeding correctness on department selection.
- E2E: switch to Configuration Mode → select a department → edit its
  structure → deselect it → confirm cleanup → reselect → confirm fresh
  reseed from predefined data (not stale remnants).
- E2E: edit a Grading Scale/Scheme/Semester Template through Configuration
  Mode → confirm it's visible and correctly updated on the real Grading
  Scales/Schemes/Semester Settings pages (proves the "same real data, no
  duplication" architecture actually holds).

## Step 2 — Edge cases

- Deselecting a department that other in-progress structural data still
  references (shouldn't be reachable given cascade design, but verify).
- Selecting a department twice in a row (idempotency of the select
  endpoint).
- Very large predefined data sets (college with many courses) — confirm no
  N+1 query issues on the profile tree read endpoint.

## Verification

- Full Jest suite green.
- Full Playwright suite green, including new specs above.
- Manual end-to-end pass through both modes back-to-back on the same org to
  confirm no cross-mode interference.

## Explicitly deferred (not this build)

- How a saved profile accelerates Seeder Mode (pre-fill vs. auto-apply).
- Read-only School Profile overview/display page.
- Academic Calendar and class-level generation.
