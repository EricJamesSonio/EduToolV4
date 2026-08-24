# Phase 2 — Fix Existing Gaps

**Mode:** Start in Plan Mode. Build Mode only after Eric approves.

**Depends on:** Phase 1 merged.

## Goal

Bring existing code in line with the new schema, and close the two gaps identified during planning: the hard-delete on program-enrollment removal, and the unscoped duplicate-enrollment check. This phase is corrective, not additive — no new modules here.

## Files to read before planning

- `backend/src/modules/student-enrollment/student-enrollment.repository.ts`
- `backend/src/modules/student-enrollment/student-enrollment.service.ts`
- `backend/src/modules/student-enrollment/dto/student-enrollment.dto.ts`
- `backend/src/modules/student-enrollment/student-enrollment.controller.ts`
- Every query site listed in Phase 0's report item 3 (re-open that report, don't re-derive from scratch)
- `backend/src/modules/student-enrollment/__TEST__/` (or wherever its spec lives — confirm exact path/existence)

## Planned changes

1. `student-enrollment.repository.ts` → `removeProgramEnrollment(id)`: change from `.delete()` to `.update()` setting `status: 'ended'`, `end_reason: dto.reason ?? 'admin_correction'`, `ended_at: new Date()`, `ended_by: actorId`.
2. `student-enrollment.service.ts` → `removeProgramEnrollment`: accept `actorId` and optional `reason`, pass through to the repository call. Update the audit log `action` string if it currently implies deletion (e.g. rename from something delete-flavored to `program_enrollment_ended` — check current string first, don't assume).
3. `student-enrollment.service.ts` → `enrollInProgram`'s duplicate check: add `p.status === 'active'` to the `.find()` predicate so a student who previously shifted out of a program can be re-enrolled in it.
4. For every site from Phase 0 item 3: confirm the Prisma-generated types still compile against the new `ProgramEnrollmentStatus` enum where relevant (should mostly be a no-op since the value name `active` is unchanged, but `tsc` will catch anywhere it isn't).
5. `student-enrollment.dto.ts`: add optional `reason?: ProgramEnrollmentEndReason` to whichever DTO backs the remove/end endpoint. Use `class-validator`'s `@IsEnum` and `@IsOptional`, matching existing DTO conventions in this file.

## Build Mode verification

- `npx tsc --strict --noEmit` clean across backend.
- Existing test(s) for this module still pass.
- Add a new unit test: student enrolled in Program A → ended (any reason) → re-enrolled in Program A within the same school year, succeeds without hitting the unique constraint or the old false-positive duplicate check. This is the concrete proof that Phases 1+2 together actually fix the gap.
- Confirm every frontend caller found in Phase 0 still works against the (unchanged) response shape — the repository method still returns the row, it just no longer deletes it, so the response contract shouldn't break, but verify rather than assume.

## Stop conditions

None expected — this is a contained, well-understood fix once Phase 0's report exists. If Phase 0 revealed additional callers of `removeProgramEnrollment` that assume delete-semantics (e.g. code that checks "does this still exist" as a proxy for "was it removed"), stop and report those before changing behavior, since they'd now get a false negative.

## Exit criteria

- All gates in `02-rules-buildmode.md` pass with real output.
- New re-enrollment-after-end test passes.
- Eric reviews and approves before Phase 3 begins.
