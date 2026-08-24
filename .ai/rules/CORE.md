# CORE — Read This First, Every Ticket

This is the only file every agent reads on every ticket, in full, before doing
anything else. It is deliberately short. Everything below is a compressed
pointer, not the full reasoning — when you need the reasoning, an edge case,
or an example, follow the pointer to the full file. **Do not read the full
`rules/` and `skills/` folders top-to-bottom by default.** Read this file,
match your task against the routing table, load only what matches.

The bullets in Part 1 are the exception: they stay in your head regardless of
task type, because a rule you'd only look up "if triggered" can't trigger
itself. Everything else is on-demand by design — that's what keeps this
affordable as the ticket count grows.

**This file starts as a straight copy of `shared/CORE-template.md`'s Part
1 and Part 2, plus this placeholder Part 3.** It is not project-specific
yet. `shared/agents/onboarder.md` is what makes it project-specific — see
Part 3 below for exactly what it does here.

---

## Part 0 — Project wiring

- **Shared skills**: `.ai/shared/` — git submodule → `ai-skills`, pinned to commit `c09788beeaac149d69ad3b168354f1503a866698`. Bump only via a dedicated `INFRA` ticket.
- **Ticket-state**: dedicated worktree at `../EduToolV4-ticket-state`, branch `ticket-state`. Never checked out inside a feature worktree.
- **Handoffs**: `ticket-state/handoffs/<TICK-ID>.md` (per-ticket, not a single global file).

Confirm these three exist and are current before claiming a ticket. If any is missing, that's an onboarding gap — run `shared/agents/onboarder.md`.

---

## Part 1 — Non-negotiables (always active, no task-matching needed)

**Git / workflow**

- Never commit or push directly to `main` or `development`.
- No ticket, no change. One agent branch per ticket, created fresh from `development`, worked in an isolated worktree.
- Tests for the change must pass before `ready-for-review`; full suite must pass on `development` after merge.
- Ticket state lives on the `ticket-state` branch, not in local folders inside the app worktree. Before claiming a ticket (or checking for overlap with active work), go to the dedicated `ticket-state` worktree and `git fetch origin ticket-state && git reset --hard origin/ticket-state` — a locally cached view is never a valid check, and a stale check is the exact race this branch exists to prevent. Full protocol: `shared/rules/git-workflow.md` §Ticket-state protocol.

**Security**

- Backend is the only source of truth for authz — never trust a client-sent role, price, or ownership value.
- Every tenant-scoped query filters by the authenticated user's tenant ID, sourced from the token, never from the request body/params, including when the resource is reached through a chain of relations rather than directly — filtering only at the top of the chain is not sufficient. Cross-tenant leakage is critical severity, not medium.
- Validate all input server-side regardless of frontend validation. Reject unknown fields.

**Error handling / data integrity**

- No silent failures, no empty `catch {}`. Use typed errors, distinguish expected vs unexpected failures.
- Multi-step writes that must succeed/fail together go in a transaction.
- Grading/scoring/billing (or whatever this project's authoritative domain data is) must be deterministic, auditable, and idempotent where retried.

**Dangerous operations — full file required if any of these apply, do not act from memory alone**

- Force push / history rewrite / touching another agent's branch or worktree. Includes force-pushing or hard-resetting `ticket-state` to override a rejected push — a rejection there is the mechanism working, not an error to route around.
- Any production DB operation (drop, truncate, unrestricted delete, destructive migration) or running any seed/reset script against anything but a local/test DB.
- Production infra, auth config, secrets, or deployment changes.
  → If any of these might apply: stop, open `shared/rules/dangerous-operations.md` in full before proceeding.

**Confidence gating** (full rubric in `shared/rules/confidence-gating.md`)

- Score your understanding of the plan: requirement clarity, codebase verification, architecture fit, edge cases, blast radius.
- Auth / tenant isolation / this project's authoritative-data domain / migrations / realtime session-authorization touched and not fully verified → score capped at 79%.
- **<80% → stop, ask.** **80–94% → proceed, disclose the assumption in the ticket.** **≥95% → proceed, log the score.**

**Coding style**

- Reuse over duplication — search before writing a new utility/service.
- No `any`, explicit types on all function boundaries.
- Change only what the task requires — no drive-by refactors.

**Scalability (full framework in `shared/rules/scalability.md`)**

- Structural decisions expensive to retrofit later (indexing, tenant scoping, module boundaries, global style tokens, API/DTO shape, auth model) get decided correctly now, even in a small/early project.
- Infrastructure cheap to add later (caching, queues, read replicas, microservices, a dedicated vector DB) does not get built until a measured need or an explicit roadmap item justifies it.
- Every list-returning DB query: paginated, no query-per-row loops (N+1), indexed on its actual filter/sort/join columns.
- Every new UI value (color, spacing, font size) references the global token system — never hardcoded in a component.
- Every endpoint input passes through the global validation pipe/middleware — no per-endpoint hand-rolled checks as the norm.

---

## Part 2 — Routing table (load the full file only if a row matches your task)

| Your task touches...                                                                                                                                                                                                                | Load (full file)                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Any authoritative/graded/scored/billed data (this project's high-stakes domain — see Part 3 once onboarder has run, for which module)                                                                                               | `shared/skills/database/MUST-HAVES.md` §Grading invariants, `shared/rules/error-handling.md` §data integrity |
| Any new list-returning query, or any schema/entity design decision                                                                                                                                                                  | `shared/skills/database/MUST-HAVES.md` §Indexing, §Avoiding N+1, §Vector readiness                           |
| A structural decision (schema, module boundary, auth model, style system) with no obvious precedent in the codebase                                                                                                                 | `shared/rules/scalability.md`                                                                                |
| Any code calling an external AI/LLM provider (prompt building, AI client, response parsing)                                                                                                                                         | `shared/skills/ai-integration/MUST-HAVES.md`                                                                 |
| Any websocket/real-time feature (gateways, sockets, live sessions)                                                                                                                                                                  | `shared/skills/realtime/MUST-HAVES.md`                                                                       |
| Any `.prisma`/ORM schema file, schema change, new migration                                                                                                                                                                         | `shared/rules/database-migrations.md`                                                                        |
| Any file-upload handling                                                                                                                                                                                                            | `shared/rules/security.md` §File uploads                                                                     |
| Adding/removing/upgrading a package (including bumping the `ai-skills` submodule pin — see `shared/rules/dependencies.md` §Version Changes, this is a dependency change like any other, not an incidental part of a feature ticket) | `shared/rules/dependencies.md`                                                                               |
| Auth guards, roles, login/session/token logic                                                                                                                                                                                       | `shared/skills/authentication/MUST-HAVES.md`, `shared/rules/security.md` §AuthN/AuthZ                        |
| Cross-org reads, list/dashboard/analytics/export endpoints, or any query reaching a tenant-scoped resource through a chain of relations                                                                                             | `shared/rules/security.md` §Multi-tenant isolation                                                           |
| Any new controller/service/repository, or restructuring a module                                                                                                                                                                    | `shared/rules/architecture.md`, `shared/skills/backend/MUST-HAVES.md` (modularity, middleware/pipes)         |
| Any new component/page/hook, or any new style/color/spacing value                                                                                                                                                                   | `shared/skills/frontend/MUST-HAVES.md` (component reuse, global styling)                                     |
| "What else calls/depends on this," blast-radius questions                                                                                                                                                                           | `shared/skills/codebase-search/SKILL.md`                                                                     |
| Debugging an existing bug (any domain)                                                                                                                                                                                              | `shared/agents/debugger.md`                                                                                  |
| Preparing to merge / CI failure                                                                                                                                                                                                     | `shared/rules/ci-cd.md`                                                                                      |
| Writing or reviewing tests                                                                                                                                                                                                          | `shared/skills/testing/MUST-HAVES.md`                                                                        |
| Handling, storing, or logging credentials, tokens, or other secrets                                                                                                                                                                 | `shared/rules/secrets.md`                                                                                    |
| A ticket with no code impact yet (just planning/investigation)                                                                                                                                                                      | none of the above — proceed with Part 1 only                                                                 |

If your task spans multiple rows (common — e.g. a new authoritative-data
feature with a migration and a new endpoint), load all matching rows. If
nothing matches, you don't need anything beyond Part 1 — don't load
speculatively.

`shared/agents/onboarder.md` may add project-specific rows below this
table once it has run (e.g. a literal folder pattern like
`modules/booking*` pointing at a domain-specific section of a MUST-HAVES
file) — it does not rewrite the generic rows above, only appends what the
generic patterns can't express for this specific codebase.

---

## Part 3 — Ticket ID / domain codes

**Status: UNKNOWN — needs onboarder run. No domain codes assigned yet.**

<!--
shared/agents/onboarder.md fills this section in. Do not hand-write domain
codes here — they need to be evidenced, the same way every other onboarder
output is.

What onboarder does here:
1. Derive domain codes from the same top-level modules/route groups it
   uses for rules/project.md's "main domains" — a real folder like
   modules/booking/ or routes/payment/ becomes a code like BOOKING or
   PAYMENT. Short, uppercase, one word per real domain.
2. List every code found, plus one INFRA code for cross-cutting work (CI,
   tooling, shared utils not owned by one domain) — every project gets
   INFRA even if evidence for it is thin, since cross-cutting tickets are
   universal.
3. Replace this whole "Status: UNKNOWN" block with the real list, in the
   same format as the finished example below.
4. Re-run and extend (never silently replace) this list later as the
   project's real module set grows — treat it as a living list, not
   fixed forever.

Once populated, this section reads like:

    Tickets are `TICK-<DOMAIN>-<number>`, e.g. `TICK-BOOKING-001`. The
    domain code is a fast pre-read signal for which routing rows are
    likely relevant before even opening the ticket body — it is not a
    substitute for actually reading the ticket.

    Canonical domain codes (maintained/extended by
    `shared/agents/onboarder.md` as the project's real module set is
    confirmed — treat this list as a starting point, not fixed forever):

    `BOOKING` `PAYMENT` `AUTH` `ORG` `INFRA` (cross-cutting: CI, tooling,
    shared utils not owned by one domain)

    Full ID/branch/archival mechanics: `shared/rules/git-workflow.md`.
-->

---

## When this file itself might be stale

If you notice this file's routing table doesn't match what's actually in
the repo (a skill file referenced here doesn't exist, or a whole new
module has no row), flag it and run `shared/agents/onboarder.md` to
update `CORE.md` alongside the other project docs — this file drifts the
same way `rules/project.md` does and needs the same drift-correction
treatment.
