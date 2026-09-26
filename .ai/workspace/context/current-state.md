# Current Project State

Last updated: 2026-09-26

<!--
One section per major domain/module. Keep status labels consistent:
implemented / partially implemented / not implemented / needs investigation
-->

## Performance work (2026-09-25 → 2026-09-26, 8 tickets merged to development)

Status: implemented (TICK-GRADE-004 merged to development after human sign-off — see below)

Implemented (all validated on development: backend unit suite holds at 25 pre-existing failures / same 5 suites, tsc pre-existing set only, builds green):

- TICK-INFRA-003 — Perf observability: env-gated Prisma query logging, finalize()-based request timing + statusCode, request-id wiring, DB-ping health check (merge 05e6778a).
- TICK-INFRA-004 — 21 hot-path indexes via new migration + @@index entries (incl. Enrollment unique, verified dup-free); CONCURRENTLY script for prod (merge 72a787a1).
- TICK-GRADE-003 — Grade batching, pure-overwrite semantics: parallel terms, hoisted invariants, Map lookups, chunked batch writes (merge 35f4fab2).
- TICK-INFRA-005 — Mechanical N+1 batching, 9 modules (transcript, attendance, grade-student, class, educator/student bulk, enrollment bulk, auto-lock, grade-lock validator) (merge e16965a6; educator/student email-domain conflicts resolved to development's role-prefix rule).
- TICK-INFRA-006 — Server pagination for audit/activity logs + notifications; 15s full-log poll removed; analytics via SQL groupBy/aggregate (merge ea66ee99).
- TICK-CLASS-001 — Eligibility/prerequisite batching + per-request scale memoization; EXPLAIN ANALYZE on scratch volume, no red flags (merge 8995b2fb).
- TICK-INFRA-007 — In-memory read cache (org/scales/settings/calendar TTLs). Redis/BullMQ parked: no Redis provisioned (merge a84deeae).
- TICK-INFRA-008 — Frontend: overfetch tracker wired, 30s timeout, memoized tables, list-default query freshness (merge 1ae40a1e).
- TICK-GRADE-004 — Bulk compute skips locked grades: `saveComputedGrades({ skipLocked: true })` used by both computeGrades paths (grade.service.ts, grade-educator.service.ts), reports `skippedLocked`. Merged after explicit human sign-off (merge dbb61e17). GRADE-003 stays pure-overwrite by design.

On hold (needs human decision):

- Redis/BullMQ queues (no ticket yet — needs Redis provisioning + worker-topology/retry-policy decisions).

Known pre-existing debt (not from this work, flagged during merges):

- 25 backend unit failures in 5 suites (class/educator/semester/program/registrar — stale mocks vs evolved code, incl. email-rule spec drift from development's own role-prefix refactor).
- `next build` red on src/app/admin/page.tsx (server component using useEffect/useRouter; commits 86a2abe6/454cff32).
- Backend e2e hooks time out in this environment (180s+); not usable as a merge gate here.
- `tsc --noEmit` on backend is red at baseline (9 errors on origin/development). TICK-INFRA-007 added a 2nd ctor arg to `GradingScaleRepository`, but `grading-scale-batching.spec.ts` (written in the earlier phase5 commit) was never updated → TS2554. Type-only: the spec still passes at runtime, so unit counts hide it. Net 9 → 8 after this push. Filed as a ticket.
- Junk file `et --hard b1f9964f0e64b173fc94e063a0c33895682fbba6` (Vim help text, 16KB) is tracked at repo root and already on origin/development (commit 1a4d8693) — artifact of a botched `git reset --hard` redirect.

## Frontend / Landing & Admin UI

Status: implemented

Implemented:

- TICK-INFRA-002 — Frontend mojibake normalization (— U+2014, – U+2013, … U+2026, → U+2192, − U+2212, ─ U+2500) across SolutionSection, ResourcesSection, ProgramLevelsSection, SchoolProfileCard, SeederCard — 5 files, 30 fixes, 0 `â` hits, lint/typecheck/build passed (merge 00dfabe0).
- TICK-ORG-001 — Organization schedule settings: OrgScheduleConfig (07:00-17:00/30, 15|20|25|30|45|60), GET/PUT /org-schedule-config strict 409, class.service bounds validation, Organization tabs + picker (merge 4d0d8f51, commit 3b1996c0).
- TICK-PLATFORM-001 — Missing React Query invalidations for resets/profile — ready-for-review (4ce84a30).

In progress:

- TICK-ACADEMIC-001 — Register student/academic-history on React Query factory
- TICK-ADMIN-001 — Admin querykeys cleanup
- TICK-GRADE-001 — Educator grades realtime

Not implemented:

- Billing/payments (not evidenced in repo per onboarder)

## <Domain A>

Status: not implemented

Implemented:

-

In progress:

-

Not implemented:

-

## <Domain B>

Status: not implemented
