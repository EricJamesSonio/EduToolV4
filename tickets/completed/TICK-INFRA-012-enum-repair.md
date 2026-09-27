# TICK-INFRA-012 — Repair corrupted ProgramEnrollmentEndReason enum value

Status: completed
Priority: high
Created: 2026-09-26
Created by: agent
Assigned to: agent
Started: 2026-09-26
Worktree: ../EduToolV4-worktrees/TICK-INFRA-012-enum-repair
Branch: agent/TICK-INFRA-012-enum-repair

## Problem

Migration `20260926143546_add_org_auto_seed_setting` (commit `ee536434`, another agent's work) created the Postgres enum `ProgramEnrollmentEndReason` with a corrupted value `'admin_correctionorganiz'` instead of `'admin_correction'` (migration.sql line 9), and `schema.prisma:54` was edited to match (commit `bd5d8960`). The migration APPLIED to the dev DB, so schema, DB, and generated client all agree on the garbage value while the real value is unrepresentable. Verified live: `pg_enum` returns `[shifted, completed, withdrawn, dropped, admin_correctionorganiz, other]`.

Blast radius (all verified, not assumed):
- `student-enrollment-phase2.spec` failures + 2 tsc errors (`admin_correction` no longer exists on the generated client type).
- Any runtime write of `end_reason: 'admin_correction'` (e.g. `removeProgramEnrollment`'s default) fails at the DB level with an invalid-enum error.
- Lucky break: only 2 `StudentProgramEnrollment` rows exist and both have NULL `end_reason`, so no data was destroyed by the cast. The fix must keep it that way.

## Goal

1. New repair migration (never edit the applied one): `ALTER TYPE "ProgramEnrollmentEndReason" RENAME VALUE 'admin_correctionorganiz' TO 'admin_correction';` — metadata-only, no table rewrite, no data touch.
2. `schema.prisma:54` back to `admin_correction`.
3. Confirm no source references the garbage string (migration history file stays as record).
4. Apply to the dev DB via `prisma migrate deploy`; verify live enum labels, tsc errors gone, phase2 spec green.

## Relevant Areas

- shared/rules/database-migrations.md (new migration, never rewrite applied history)
- backend/prisma/schema.prisma, backend/prisma/migrations/

## Acceptance Criteria

- [ ] Live `pg_enum` labels exactly `[shifted, completed, withdrawn, dropped, admin_correction, other]`
- [ ] The 2 student-enrollment tsc errors gone; no new tsc errors
- [ ] `student-enrollment-phase2.spec` failures attributable to the enum are fixed (remaining failures, if any, documented as pre-existing)
- [ ] No `admin_correctionorganiz` references in src/schema outside the historic migration file
- [ ] `_prisma_migrations` shows the repair applied; no rows harmed (NULL end_reasons untouched)

## Confidence

Score: 88/100
- Requirement clarity: 24 (narrow repair; verified live state first)
- Codebase verification: 23 (read migration, schema, ledger, live enum, affected specs)
- Architecture fit: 18 (standard enum-rename repair migration)
- Edge cases: 11 (no rows use the value — verified; rename is metadata-only)
- Blast radius: 12 (dev DB `migrate deploy` of a non-destructive rename; prod needs its own rollout decision — flagged, not executed)
Proceeding. Assumption: dev DB may be migrated (standard dev flow); production rollout is a separate human decision.

## Tests

- Targeted: student-enrollment suites 8/8 green (phase2 previously failing on the corrupted enum); tsc student-enrollment errors gone
- Full suite on development post-merge: failures drop vs pre-merge (phase2 + org suites green); no new failures (level/section/school-year group stable at 11, dirty-tree/drift owned by others)
- Live DB verified: pg_enum labels exactly [shifted, completed, withdrawn, dropped, admin_correction, other]; 2 NULL rows untouched; repair in _prisma_migrations ledger; no invalid indexes
- Development integration: merged (624ada61); prisma validate OK; build OK (549 files)

## Blocker

None.

## Activity Log

2026-09-26 — Claimed (new INFRA-012, counter 11→12) during verification follow-up. Issue found while attributing post-merge test failures; verified against live DB, ledger, and git history before touching anything.
Confidence: 88/100 (Requirement clarity 24, Codebase verification 23, Architecture fit 18, Edge cases 11, Blast radius 12). Assumption: dev-DB migrate is standard flow; prod rollout separate.
2026-09-27 — Implemented (502256a4): schema value restored + repair migration (ALTER TYPE RENAME VALUE, metadata-only); regenerated client; applied to dev DB; verified live enum, rows untouched, ledger recorded, phase2 8/8 green. Merged to development (624ada61). Prod rollout NOT executed — separate human decision. Completed.

## Commits

None yet.

## Notes

DO NOT fix by editing `20260926143546` (applied history is immutable). DO NOT run the repair against production — dev only; prod rollout needs human sign-off.
