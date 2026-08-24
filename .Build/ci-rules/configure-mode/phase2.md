# Phase 2 — Backend: Profile CRUD Services

## Step 0 — Investigate

Re-confirm final Phase 1 schema as actually migrated before writing service
code against it.

## Step 1 — Module structure

New `school-profile` module, mirroring existing module conventions
(controller / service / repository / dto / entity), matching the pattern
already used by every other module in `backend/src/modules/`.

## Step 2 — Department selection endpoints

- `GET /school-profile/departments` — list all `SchoolProfileDepartment`
  rows for the org (i.e. the currently-selected departments).
- `POST /school-profile/departments/:type/select` — select a department.
  Per Phase 1's decision: creates the department row and seeds its
  `courses`/`strands`/`levels` from the matching predefined data
  (`courses.data.ts` filtered by department type, `levels.data.ts`
  defaults, etc.), all in one transaction.
- `DELETE /school-profile/departments/:type` — deselect. Deletes the
  department row (cascades to everything under it, per Phase 1's schema).
  This is destructive to any edits the admin made — confirm whether a
  warning/confirm step belongs at the frontend layer (Phase 3) before
  calling this.

## Step 3 — Structural editing endpoints (Course/Strand/Level/Section/Subject)

Standard CRUD per entity, scoped to `org_id` and validated against the
parent department/course/strand/level chain:

- `POST/PATCH/DELETE /school-profile/courses`
- `POST/PATCH/DELETE /school-profile/strands`
- `POST/PATCH/DELETE /school-profile/levels`
- `POST/PATCH/DELETE /school-profile/sections`
- `POST/PATCH/DELETE /school-profile/subjects`

Each follows the existing repo pattern (repository does raw Prisma access,
service does validation/orchestration, controller is thin). No business
logic in controllers, per this project's standing architecture rule.

## Step 4 — Read endpoint for the full profile tree

`GET /school-profile` — returns the full nested tree (departments → their
courses/strands → levels → sections/subjects) in one call, for both the
Configuration Mode frontend and, later, any read-only profile display.
Avoid N+1 queries — use Prisma's nested `include` in one query, matching
patterns already used elsewhere in this codebase (e.g.
`grading-scheme-template.repository.ts`'s `COMPONENTS_INCLUDE` constant
approach).

## Verification

- Manually exercise: select a department → confirm predefined data is
  correctly copied in → rename/delete a course → deselect the department →
  confirm cascade cleanup → reselect → confirm it reseeds fresh (not
  reusing stale deleted-row remnants).
- Run backend test suite; add unit tests for the new services following
  existing `__TEST__/` conventions.

Stop and report before Phase 3.
