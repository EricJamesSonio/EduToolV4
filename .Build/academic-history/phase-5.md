# Phase 5 — Academic History (Student-facing View)

**Mode:** Start in Plan Mode. Build Mode only after Eric approves.

**Depends on:** Phase 4 merged.

## Decision to confirm with Eric before planning this phase

Should the student-facing view **extend `transcript-student.service.ts` in place**, or be a **new sibling controller** that calls the same `academic-history.service.ts` core from Phase 4 with a sanitizing mapper?

Recommendation carried from prior planning: new sibling controller, to avoid conflating "grades I can see" (transcript's current, narrower job) with "my full enrollment/outcome/shift history" (this feature's broader scope). This was explicitly flagged as Eric's call, not something to decide unilaterally — **ask this question at the start of Plan Mode for this phase even if you believe the answer is obvious**, since it was never actually confirmed in prior sessions.

## Files to read before planning

- `backend/src/modules/academic-history/academic-history.service.ts` (from Phase 4 — the core composition logic this phase sanitizes and re-exposes)
- `backend/src/modules/transcript/student/transcript-student.controller.ts` and `.module.ts` (to compare the extend-vs-new-sibling shapes concretely before asking the question above — bring a real comparison, not just the abstract question)
- Self-only guard pattern used on existing student-facing controllers (e.g. how `assessment-student.controller.ts` or `grade-student.controller.ts` scopes queries to the authenticated student's own id — check `@CurrentUser()` decorator usage)

## New files (assuming the "new sibling" decision — adjust if Eric picks otherwise)

- `backend/src/modules/academic-history/student/academic-history-student.controller.ts`
- Sanitizing DTO/mapper: strips `ended_by`, `outcome_set_by`, shift-event actor id, and any raw entity UUID where a human-readable name already exists in the payload (program name instead of program id, subject name instead of subject id, etc.)

## Build Mode verification

- Test: a student calling this endpoint for another student's data (by manipulating an id param, if the route accepts one at all — if it's strictly self-scoped via the auth token, test that no id param can override that) gets 403/404. This is a real data-exposure risk if the self-only guard is missed — do not treat this test as optional.
- Test/manual spot-check: confirm no UUIDs leak into the student-facing response body — check every field in the sanitized DTO by hand, don't just trust the mapper was written correctly.
- All gates from `02-rules-buildmode.md`.

## Exit criteria

- Extend-vs-new-module decision confirmed by Eric before any file is created.
- Self-only enforcement test passes.
- No-UUID-leak check confirmed.
- Eric reviews and approves before Phase 6/7 begins (Phase 6 can run in parallel regardless).
