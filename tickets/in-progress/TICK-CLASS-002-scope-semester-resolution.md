# TICK-CLASS-002 — Scope semester resolution to the class program (Phase 0b)

Status: ready-for-review
Priority: high
Created: 2026-09-30
Created by: agent
Assigned to: agent
Started: 2026-09-30
Branch: development (owner-directed; no feature worktree)
Commit: 34b1b0d6

## Problem

`ClassService.resolveSemesterId` picked a Semester by NAME within the school
year, with a fallback to "any semester in this school year".

Since migration `20260925113449_add_semester_program_scope`, `Semester.program_id`
is REQUIRED. A school year routinely holds one semester named "1st Semester" per
program. Matching on name therefore returned whichever row the database ordered
first, so a BSCS class could be filed under the JHS program's semester — and the
fallback could cross programs entirely. Which row won was down to DB ordering.

## Goal

Every semester lookup in this path is scoped by `program_id`, tried in order of
precision:

1. the exact `template_semester_id` the program's template defines
2. same program + same name (semesters created before the link was populated)
3. any semester of THIS program

Never another program's. The error names the program so the fix is obvious.

## Relevant Areas

- backend/src/modules/class/class.service.ts (`resolveSemesterId`)
- backend/src/modules/class/__TEST__/class.service.spec.ts

## Acceptance Criteria

- [x] Every `semester.findFirst` in this path includes `program_id`
- [x] Exact template link preferred, then name, then any-for-program
- [x] Error message names the program, not just the school year
- [x] A regression test asserts no lookup can omit `program_id`
- [x] Existing class specs still pass

## Confidence

- Score: 93%
- `class.service` suite 58 passing (was 56, +2 net); backend `tsc --noEmit` 0
  errors; full backend suite unchanged at the same 7 pre-existing failing
  suites / 24 tests.

## Tests

- `resolves semester via the template_semester_id link` — asserts the first
  query filters on `template_semester_id`
- `falls back to a name match WITHIN the same program`
- `SCOPES every semester lookup to the class program` — the regression guard:
  iterates every `semester.findFirst` call and asserts each `where` contains
  `program_id` and `org_id`, and that exactly 3 lookups were made
- `throws BadRequest when no semesters for this PROGRAM` — message names the
  program

## Blocker

None.

## Activity Log

2026-09-30 — Filed and implemented (34b1b0d6).

2026-09-30 — Rewrote three existing class specs that encoded the OLD behaviour
("fallback to any semester when name not found"). That test was asserting the
bug; it was replaced by a same-program fallback plus the scoping guard above,
which is a strictly stronger assertion.

## Commits

- 34b1b0d6 — fix(class): scope semester resolution to the class program

## Notes

This was a prerequisite for the automated class generator, which is explicitly
program- and semester-scoped and would otherwise have inherited the same coin
flip. It was found while reviewing the plan and is called out in the auto-class
review as "Blocker: Semester resolution ignores program_id".

The deeper issue — that conflict detection is scoped by school year rather than
semester — is a separate, larger change. The auto-class plan's decision D2
explicitly defers it to an owner decision and must not be flipped silently.
