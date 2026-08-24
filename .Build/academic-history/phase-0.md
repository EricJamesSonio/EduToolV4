# Phase 0 — Investigation & Confirmation

**Mode:** Plan Mode only. No code changes in this phase. Follow `01-rules-planmode.md` in full.

## Goal

Verify every assumption in `00-overview.md` and the later phase files against the current codebase before anything is built, and resolve the one open architecture decision that blocks Phase 3.

## Files to read (in full)

- `backend/prisma/schema.prisma`
- `backend/src/modules/student-enrollment/*` (every file)
- `backend/src/modules/enrollment/*` (every file)
- `backend/src/modules/class/class.repository.ts`, `class.service.ts`
- `backend/src/modules/org-enrollment-setting/*`
- `backend/src/modules/school-year/school-year-readiness.service.ts`
- `backend/src/modules/audit-log/audit-log.service.ts` (confirm exact method signatures)
- `backend/src/modules/transcript/student/transcript-student.service.ts`
- `backend/src/modules/student-enrollment/student-enrollment.controller.ts`
- Frontend caller(s) of the program-enrollment removal endpoint — search for `removeProgramEnrollment` usage across `frontend/src/`

## Report back (human-readable, per plan-mode rules)

1. Confirm `StudentProgramEnrollment.status` is still `EnrollmentStatus` (shared enum) and the unique constraint is still the full `@@unique([student_school_year_id, program_id])`. State confidence.
2. Confirm `removeProgramEnrollment` in the repository is still a hard `.delete()`. List every caller, backend and frontend.
3. List every query site (backend) that filters `Enrollment.status: {not: 'removed'}` or similar — dashboards, capacity counts, roster views, eligibility checks. This list is required input for the open decision below.
4. Check `school-year-readiness.service.ts` for anything that would need a new readiness check once `default_shift_outcome` exists as an org setting. State confidence; likely "none needed" but confirm rather than assume.
5. Confirm whether `enrollInProgram`'s duplicate-enrollment check (`programEnrollments?.find(p => p.program_id === dto.program_id)`) is unscoped by status today (this was flagged as a live gap in prior planning) — re-verify it's still unscoped in current code.

## The open decision — resolve here, don't defer

**When Phase 3's program-shift operation bulk-sets `outcome` on the old program's active class `Enrollment` rows, should `Enrollment.status` also flip to `removed`, or stay `active` with `outcome` as the only signal that the class is no longer live?**

Using the query-site list from item 3 above:

- For each site, state what happens under "flip to removed" vs. "leave active."
- Give a recommendation with a confidence percentage.
- If confidence < 90%, this is exactly the kind of question that must go to Eric before proceeding — present it as a direct question with your recommended answer attached.

Do not proceed to Phase 1 planning until this is either resolved at ≥90% confidence with reasoning shown, or Eric has answered it directly.

## Stop condition

If `schema.prisma` has diverged from what `00-overview.md` describes in any structural way on the tables this feature touches (`StudentProgramEnrollment`, `Enrollment`, `OrgEnrollmentSetting`, `StudentSchoolYear`) — new fields, renamed relations, changed enums — stop and report the diff instead of silently adapting the later phase files yourself. Eric needs to see what changed before the plan is amended.

## Exit criteria for this phase

- All 5 report items answered with evidence (file/line references, not paraphrase).
- Open decision resolved (Eric answer or ≥90%-confidence recommendation accepted by Eric).
- Human-readable Plan Mode summary presented, per `01-rules-planmode.md` rule 5.
- Eric says go before Phase 1 investigation starts.
