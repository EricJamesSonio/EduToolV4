# Late-Enrollment Grading Exclusion — Phase 5: Tests

Do not start until Phase 4 is confirmed complete. This phase adds real,
non-mocked coverage for the rule end to end. Do not skip this phase or treat
Phase 2's ad-hoc verification as sufficient — that was manual spot-checking,
this is the permanent regression suite.

## Test placement (follow existing convention exactly)

- Backend unit tests: colocated at
  `backend/src/modules/grade/core/__TEST__/assessment-inclusion.util.spec.ts`
  (or wherever Phase 2 actually placed the extracted pure function — use that
  real path, not this assumed one, if it differs).
- Backend e2e tests: colocated with the existing e2e pattern. Check whether
  `backend/test/` (top-level, real-DB e2e per the project's established
  pattern from the org-seeder work) or a module-local `__TEST__` folder is
  correct for cross-module flows like this one — confirm against
  `backend/test/org-seeder.e2e-spec.ts` conventions before creating a new
  file, since this feature spans enrollment + assessment + grading tables.
- Frontend tests: `frontend/src/components/educator/grades/__tests__/` if
  that folder exists (check first — it isn't listed in the current folder
  structure, so confirm whether to create it fresh following the sibling
  convention in `frontend/src/components/admin/subject/__tests__/`).

## Required test cases

### Unit — inclusion/exclusion decision function

1. Assessment before enrollment, no override → excluded, reason
   `default_excluded`.
2. Assessment before enrollment, override `include: true` → included, reason
   `override_included`.
3. Assessment after enrollment, no override → included, reason `included`.
4. Assessment after enrollment, override `include: false` → excluded, reason
   `override_excluded`.
5. Assessment with null `release_date`, falls back to the confirmed
   substitute field.
6. Override exists for a soft-deleted assessment → treated as excluded
   regardless of `include` value (assessment absent from grading entirely).

### Integration/e2e — real database, real services (no mocks)

Follow the exact pattern established in `org-seeder.e2e-spec.ts`: real
`PrismaClient`, actual services, a unique test org per test run to avoid
collisions, explicit cleanup.

1. **All pre-enrollment**: student enrolls mid-term after every assessment in
   a component has been released. Confirm the component grade reflects "no
   eligible assessments" (per whatever non-division-by-zero behavior Phase 2
   confirmed), not a 0%.
2. **Mixed**: 3 assessments in a component, 1 before enrollment, 2 after.
   Confirm only the 2 post-enrollment assessments are averaged, and weight
   renormalization matches the same formula used elsewhere for optional
   components (assert the exact numeric result, not just "no error").
3. **Override include**: same mixed setup, but educator overrides the
   pre-enrollment assessment to `include: true`. Confirm all 3 are now
   averaged and weights renormalize accordingly.
4. **Override then delete**: set an override, confirm grade changes, delete
   the override via the Phase 3 endpoint, confirm the grade reverts exactly
   to the original default-exclusion result — not an approximation.
5. **Cross-check with exempted/missing**: a pre-enrollment assessment that is
   also marked `is_exempted` on `Submission` — confirm this doesn't
   double-count or conflict with the late-enrollment exclusion (per the
   "keep these separate" constraint from Phase 2).
6. **Ownership check**: educator not assigned to the class attempts to POST
   an override → expect rejection, confirm via actual HTTP call against the
   test server, not a mocked guard.
7. **Seeder isolation regression check**: confirm this feature's migration
   and new table do not interfere with the org-seeder e2e flow — run the
   existing `org-seeder.e2e-spec.ts` suite and confirm it still passes
   unmodified.

## Verification (required before reporting done)

1. Run the full backend test suite (`npm run test` and `npm run test:e2e`)
   and confirm 100% pass, including every pre-existing test — not just the
   new ones.
2. Run `npm run lint` on both `frontend/` and `backend/` and confirm no new
   errors introduced by this feature's files.
3. Report the final list of new files created, in this format: path →
   one-line purpose. Do not include a long narrative log, per the project's
   lean-output convention — a short confirmation is sufficient.

## Guardrails

- Max 3 retries on any failing test, different fix approach each time, then
  stop and report the exact assertion failure and actual vs expected values.
- Do not modify existing passing tests to make new ones pass — if a new test
  reveals that an existing test's assumption was wrong, stop and report the
  conflict instead of editing around it.
- End with: **"Phase 5 complete. Full suite passing. Late-enrollment grading
  exclusion feature is done end to end."**
