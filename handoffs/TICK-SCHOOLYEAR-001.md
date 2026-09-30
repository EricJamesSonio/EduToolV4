# TICK-SCHOOLYEAR-001 — Clickable readiness issues (handoff)

Status: ready-for-review
Branch: `agent/TICK-SCHOOLYEAR-001-clickable-readiness`
Worktree: `../EduToolV4-worktrees/TICK-SCHOOLYEAR-001-clickable-readiness`
Base: `development` @ `d47328d0`
Commit: `c757be32` (5 files, +403/-24)

## What changed

The readiness banner on `/admin/school-years/[id]` listed problems with no way
to act on them. Root cause was on the backend: `pushList` emitted aggregated
entities as `{ id, name }` with **no type**, so the client could not tell a
subject id from a section or class id and could not build a route. The line in
the report — "1 subject(s) in this school year have no class created" — is
exactly that shape.

- `backend/.../school-year-readiness.service.ts` — new shared
  `ReadinessEntityType` union (adds `section`, `class`) used by both `ref.type`
  and the new `entities[].type`; `pushList` takes the type; course/strand refs
  carry `programId`; `class_no_grading_scheme` labels read `Subject · Section`.
- `frontend/src/types/admin/school-year.types.ts` — mirrors the backend union.
- `frontend/src/utils/readinessTargets.ts` (new) — resolves an issue or entity to
  its admin page. Returns `null` for `missing_start_date`, `no_programs`, and
  any unrecognised code, so those render as plain text rather than dead links.
- `frontend/src/app/admin/school-years/[id]/page.tsx` — per-entity issues link
  the message; aggregated issues render clickable entity chips + a `+N more`
  overflow (`count` is the true total, `entities` is capped at 10).
- `frontend/src/utils/__tests__/readinessTargets.test.ts` (new) — 11 tests.

## Review notes

- **Schema-accurate, not schema-naive.** `Class` has no `section` relation in
  `schema.prisma` (only the `section_id` column — the readiness service already
  documents this). A nested `section: { select: ... }` would have been a Prisma
  type error, so section names are resolved from the `sections` list already
  loaded by the `section_no_class` check. No new query, no N+1.
- **Additive API change.** `entities[].type` and `ref.programId` are new
  optional fields; nothing is removed or renamed. Consumers that ignore them
  (`SchoolYearReadinessDialog`) are unaffected.
- **Baseline was measured, not remembered.** The prior "17 pre-existing tsc
  errors" note predates this commit. Both sides were measured at `d47328d0` in a
  throwaway baseline worktree: 20 errors before, 20 after, error sets
  byte-identical (`Compare-Object` on normalized lists). Same for eslint
  (1 error + 2 warnings before and after) and the backend school-year jest
  (2 pre-existing failures in `maybeAutoSeed`, unchanged).

## Validation

| Check | Result |
|---|---|
| `frontend` jest | 20 suites / 210 tests green (new suite included) |
| `frontend` tsc | 0 new errors (20 pre-existing, identical set) |
| `frontend` eslint | 0 new (1 pre-existing error, 2 warnings) |
| `backend` tsc | 0 errors |
| `backend` jest school-year | unchanged vs baseline (2 pre-existing failures) |
| `prisma validate` | fails only on missing `DATABASE_URL` env var; no schema change made |

## Not in scope (user decision)

Detail page banner only. `SchoolYearReadinessDialog.tsx` chips and the two
Enrollment-page issue lists still render entities as inert text — the dialog has
the `type` it needs now, so it is a small follow-up.

## Suggested follow-up

1. `SchoolYearReadinessDialog.tsx` — reuse `readinessTargets` for its chips.
2. The two Enrollment pages listing readiness issues.
3. Product decision: `subject_no_class` currently routes to the subject page.
   `/admin/classes?subjectId=` opens the *Create Class* dialog directly, which
   is arguably the real fix for "no class created". One line in
   `readinessTargets.ts` if that is preferred.
