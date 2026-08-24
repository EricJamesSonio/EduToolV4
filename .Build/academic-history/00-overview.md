# Academic History — Feature Plan Overview

**Read this file first, then `01-rules-planmode.md`, then start Phase 0.**

## Source of truth

The target/spec for this feature is **`overview.md`** (Eric's "EduTool Enrollment & Academic History — Updated Planning" doc), which will be provided alongside this plan. That document defines _what_ the feature must do (Application → Approval → Academic Enrollment → Section/Class Assignment → Outcomes → Permanent History → Program Shifting). This folder defines _how_ to build it against the current codebase, in phases.

If anything in these phase files conflicts with `overview.md`, **`overview.md` wins** — stop and flag the conflict to Eric rather than silently picking one.

## What already exists (do not rebuild)

Confirmed via prior investigation of the live codebase (re-verify in Phase 0 — code moves fast):

- Application → Approval → Academic Enrollment lifecycle is fully built: `EnrollmentApplication`, `EnrollmentApprovalService`, `StudentSchoolYear`, `StudentProgramEnrollment`.
- Section assignment (auto/expand/create) is built into `EnrollmentApprovalService.approve()`.
- Class assignment (no-review path) is built via `ClassService.enrollStudent` → `EnrollmentService.enroll()`.
- Transcript exists (`transcript-student.service.ts`) but is a live query over grades, not a permanent/outcome-aware history record.

## What is genuinely missing (this plan builds it)

1. Outcome vocabulary on class-level `Enrollment` (currently only `active/pending/removed`, no PASSED/FAILED/DROPPED/etc.)
2. A way to end a `StudentProgramEnrollment` without losing the row (currently `removeProgramEnrollment` hard-deletes)
3. Program shifting as a first-class operation (not present at all)
4. A composed Academic History view (admin full detail + student sanitized view)
5. Educator teaching history across school years
6. Manual-review class assignment (doc §6B/7) — **explicitly out of scope for this plan**, later lane

## Locked architecture decisions (from prior planning with Eric — do not re-litigate)

- Split `StudentProgramEnrollment.status` into its own `ProgramEnrollmentStatus` enum (`active`/`ended`), separate from the shared `EnrollmentStatus` used elsewhere.
- Replace the full unique constraint `@@unique([student_school_year_id, program_id])` with a **partial unique index** (`WHERE status = 'active'`) via raw SQL — allows multiple historical rows per program per school year, only one active at a time. Confirmed: multiple history rows per shift is intentional (that's how shifting works).
- `removeProgramEnrollment` becomes a soft status update (`status: ended, end_reason: admin_correction`), never a hard delete. Confirmed: history must never disappear, fix this as part of this work, not deferred.
- New `ProgramShiftEvent` table records each shift (from/to program enrollment, default outcome used, actor).
- New `ClassEnrollmentOutcome` enum on `Enrollment` (nullable) — separate from `Enrollment.status`, which stays as the operative active/pending/removed flag.
- `OrgEnrollmentSetting.default_shift_outcome` — configurable default (per doc's "settings are workflow defaults, not permanent rules" principle), defaults to `dropped`.

## Still open — must be resolved during Phase 0, not assumed

**When a program shift bulk-sets `outcome` on the old program's active class `Enrollment` rows, does `Enrollment.status` also flip to `removed`?** Existing roster/capacity queries filter on `status`. This needs a confidence-graded recommendation from the agent in Phase 0, with Eric's explicit go-ahead before Phase 3 starts.

## Phase index

| Phase | File                                  | Depends on                                   |
| ----- | ------------------------------------- | -------------------------------------------- |
| 0     | `phase-0-investigation.md`            | —                                            |
| 1     | `phase-1-schema-migration.md`         | 0                                            |
| 2     | `phase-2-fix-existing-gaps.md`        | 1                                            |
| 3     | `phase-3-program-shift.md`            | 2, Phase 0 decision resolved                 |
| 4     | `phase-4-academic-history-admin.md`   | 3 (can start against 1–2 alone if 3 delayed) |
| 5     | `phase-5-academic-history-student.md` | 4, extend-vs-new-module decision resolved    |
| 6     | `phase-6-educator-history.md`         | 0 only (parallelizable)                      |
| 7     | `phase-7-frontend.md`                 | 1–6 merged to `development`                  |

Every phase file is self-contained: read it fresh at the start of that phase, don't rely on memory of earlier phases.
