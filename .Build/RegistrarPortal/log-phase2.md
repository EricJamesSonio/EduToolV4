# Phase 2 Status Report — Section Capacity Floor Validation

## What changed
- `backend/src/modules/section/section.service.ts` — `update()` now guards against setting `capacity` below the section's currently enrolled student count. If `dto.capacity` is provided and `< enrolledCount`, it throws `ConflictException` with the message specified in the phase doc. The guard runs before `sectionRepository.update()` and before the audit log call. Applied unchanged to the phase's sketch.

## What I verified
- Full-project `npx tsc --noEmit`: output is 96 lines — identical to the pre-existing baseline established in Phase 1 (the one `section`-matching line is a pre-existing `ConceptBuild` error in assessment-generation.helper.ts, not the section module). Zero new errors.
- `prettier --check` reported style issues in `section.service.ts`; ran `prettier --write`. This reformatted pre-existing non-conforming lines across the whole file (imports, object alignment, audit-log chain formatting) — formatting-only, no behavior change. The cap-floor guard is untouched by the reformat (verified in diff).
- `npm run lint` remains blocked by the missing `typescript-eslint` package (same environment issue as Phase 1, pre-existing).

## Deviations / notes
- None. `ConflictException`, `countStudentsInSection`, and the repository method all already existed exactly as the phase assumed. No role checks added — rule applies to all callers per the phase doc.