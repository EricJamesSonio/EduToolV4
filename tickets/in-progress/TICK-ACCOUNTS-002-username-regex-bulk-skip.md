# TICK-ACCOUNTS-002 — Username regex enforcement + bulk import duplicate pre-check

Status: in-progress
Priority: high
Created: 2026-08-27
Created by: agent
Assigned to: agent
Started: 2026-08-27
Worktree: ../EduToolV4-worktrees/TICK-ACCOUNTS-002
Branch: agent/TICK-ACCOUNTS-002-username-regex-bulk-skip

## Problem

Accounts allow invalid usernames (., _, -, spaces, @) and bulk import fails entire batch on first duplicate. Student `emailName`, educator `emailName`, registrar `username` DTOs only check length, not alphanumeric; services only reject `@` before calling `buildOrgEmail`. Frontend `USERNAME_REGEX` exists but backend does not mirror it, so direct API bypass succeeds. `EmailInput.tsx` appends `.com` producing `cmi.educator.edu.com`. `Update*Dto` exposes raw `email` bypassing org+role domain. Bulk paths use `findEmailsInBatch` then throw 409 fail-fast instead of skip-and-continue.

## Goal

1. Add `@Transform(trim+lowercase) + @Matches(/^[a-zA-Z0-9]+$/) @MaxLength(30)` to `student.dto:emailName`, `educator.dto:emailName`, `registrar.dto:username` create fields; mirror regex guard in `student.service:buildOrgEmail`, `educator.service:buildOrgEmail`, `registrar.service:buildOrgEmail` before `buildOrgEmail` call.
2. Restrict Update DTOs: remove raw `email` or gate with domain check; prefer recompute from `emailName/username` + role. Read actual Update DTOs before deciding.
3. Fix `EmailInput.tsx` double-suffix bug; verify `USERNAME_REGEX` exact match.
4. Rewrite bulk import/create to pre-check: build full emails via `buildOrgEmail`, query `findEmailsInBatch(orgId)`, intra-batch set, classify `skipped: {row,email,reason: duplicate_in_database|duplicate_in_file|race_condition}`, insert survivors per-row catching `P2002`, return `{created, skipped}` (extend current shape, not replace). Surface `skipped` in bulk result UI.
5. Tenant scoping: all duplicate checks via `CurrentUser(org_id)` never body/param.

## Relevant Areas

- shared/skills/authentication/MUST-HAVES.md, shared/rules/security.md §Tenant
- shared/rules/architecture.md, shared/skills/backend/MUST-HAVES.md, shared/skills/frontend/MUST-HAVES.md, shared/skills/testing/MUST-HAVES.md
- backend/src/modules/student/dto/student.dto.ts, student.service.ts, student.repository.ts
- backend/src/modules/educator/dto/educator.dto.ts, educator.service.ts, educator.repository.ts
- backend/src/modules/registrar/dto/registrar.dto.ts, registrar.service.ts, registrar.repository.ts
- frontend/src/utils/validation.util.ts, frontend/src/lib/email/buildFullEmail.ts, frontend/src/components/shared/EmailInput.tsx
- frontend/src/components/admin/student/CreateStudentDialog.tsx, BulkCreateStudentDialog.tsx, frontend/src/components/admin/educator/CreateEducatorDialog.tsx, frontend/src/components/admin/registrar/CreateRegistrarDialog.tsx

## Acceptance Criteria

- [ ] DTOs reject `alic.james`, `ali_james`, `ali-james`, `ali james`, `ali@x`, `a*32chars` with 400; accept `ericjames`/`ABC123`
- [ ] Service bulk with 3 rows: all unique ? 3 created 0 skipped; 1 already in DB ? 2 created 1 skipped duplicate_in_database; 2 rows same email in file ? 1 created 1 skipped duplicate_in_file; simulated P2002 race ? skipped race_condition no 500
- [ ] Update with `email: "attacker@evil.com"` rejected or recomputed to org+role domain, not written verbatim
- [ ] EmailInput preview shows `user@cmi.educator.edu` not `user@cmi.educator.edu.com`
- [ ] Bulk endpoint returns 200 {created, skipped} on partial success with tenant-scoped check
- [ ] lint/typecheck/test/build pass in worktree

## Confidence

Score: 92/100 (Requirement clarity 25, Codebase verification 23, Architecture fit 18, Edge cases 13, Blast radius 13)
- Requirement locked: alphanumeric 30, no grandfathering, cross-role allowed, skip-not-fail, no DB migration, per-page bulk scope — unambiguous.
- Codebase verified: read student/educator/registrar DTOs, services, repos, EmailInput/buildFullEmail, validation.util, bulk response shapes via explore agents (line-precise) — not assumed.
- Architecture fit: reuses existing DTO decorators, service guards, repo findEmailsInBatch pattern, global ValidationPipe.
- Edge cases: concurrent P2002 mapping, tenant isolation, intra-batch dedup, Update DTO bypass — identified.
- Blast radius: student/educator/registrar account creation only; no grading/migration/realtime.

## Tests

- Targeted: not yet run
- Full suite: not yet run
- Development integration: not yet run

## Blocker

None.

## Activity Log

2026-08-27 - Claimed TICK-ACCOUNTS-002, creating worktree from development.
Confidence: 92/100 — see Confidence section.

## Commits

None yet.

## Notes

Per-role bulk only (student page bulk checks students). Update DTO decision deferred until file read confirms current shapes. Out of scope: schema.prisma migrations, SchoolYear/Program uniqueness, cross-role checks, partial indexes.
