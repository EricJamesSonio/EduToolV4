# AGENT — EduToolV4

> **This file is auto-read by your AI agent at session start.**
> It is deliberately short. For **building, fixing, or changing code** you MUST follow it. For pure Q&A / reading docs with no code change, you can skip the ticket-state steps.

This repo uses the `.ai` framework. The local project memory lives in `.ai/`, the reusable rules/skills live in the pinned submodule `.ai/shared` (`ai-skills@c09788beeaac149d69ad3b168354f1503a866698`). The framework is not optional when you touch code — it is how tickets, branching, and safety are enforced.

---

## When this applies (building / changing code)

**Applies:** new feature, bug fix, refactor, migration, schema change, API route, component, test, package bump, any file change under `backend/` or `frontend/`.

**Does not apply:** read-only questions, explaining code, drafting docs with no file edits. In those cases, just answer — don't create a worktree or touch `ticket-state`.

If you are about to edit/create any file, the rest of this document is mandatory.

---

## 1. Entry point — read CORE first

**Every ticket, always, read in full before anything else:**

→ `.ai/rules/CORE.md:1` — non-negotiables + routing table (Part 0 wiring, Part 1 always-active, Part 2 routing).

Do NOT read the entire `rules/` and `skills/` folders by default. Use CORE's routing table to load **only** what your task matches:

- Auth / guards / roles → `shared/skills/authentication/MUST-HAVES.md`, `shared/rules/security.md` §AuthN/AuthZ
- Tenant-scoped query / cross-org read → `shared/rules/security.md` §Multi-tenant isolation
- Grading / authoritative data → `shared/skills/database/MUST-HAVES.md` §Grading invariants
- Schema / migration → `shared/rules/database-migrations.md`
- Controller/service/repo / module boundary → `shared/rules/architecture.md`, `shared/skills/backend/MUST-HAVES.md`
- Component / page / styling → `shared/skills/frontend/MUST-HAVES.md`
- Realtime / gateway / socket → `shared/skills/realtime/MUST-HAVES.md`
- AI prompt / client / parsing → `shared/skills/ai-integration/MUST-HAVES.md`
- Upload / file handling → `shared/rules/security.md` §File uploads
- Package bump / submodule pin bump → `shared/rules/dependencies.md`
- Tests → `shared/skills/testing/MUST-HAVES.md`
- Dangerous: force-push, history rewrite, prod DB, secrets, infra → `shared/rules/dangerous-operations.md` (stop and read it)
- Confidence check → `shared/rules/confidence-gating.md`

Full map lives in `.ai/shared/INDEX.md:1`, not here. This file stays a pointer on purpose.

**Check for stale project docs before coding:**

If `.ai/rules/project.md:1`, any `.ai/skills/*/FACTS.md:1`, or `CORE.md` Part 3 says `UNKNOWN — needs onboarder run` or contradicts what you see in `backend/src/` / `frontend/src/` / `prisma/`, run `shared/agents/onboarder.md:1` first. Don't build on placeholder docs. See `.ai/rules/CORE.md:108` Part 3 and `Build.md:252` Step 7.

---

## 2. Project wiring (from `.ai/rules/CORE.md:22` Part 0)

- **Shared skills:** `.ai/shared/` — git submodule → `ai-skills`, pinned to `c09788beeaac149d69ad3b168354f1503a866698`. Bump only via a dedicated `INFRA` ticket (`shared/rules/dependencies.md` §Version Changes).
- **Ticket-state:** dedicated worktree at `../EduToolV4-ticket-state`, branch `ticket-state`. Never checkout `ticket-state` inside a feature worktree.
- **Handoffs:** `ticket-state/handoffs/<TICK-ID>.md` (per-ticket, not global).

Confirm all three exist before claiming work. If missing: `git submodule update --init --recursive`, `git worktree list`, then `shared/agents/onboarder.md`.

Build / wiring reference: `Build.md:1` (generic, works for any project — local fix for `EduToolV4`).

---

## 3. Branch model & golden rules (from `.ai/shared/rules/git-workflow.md:1`)

```
main                  — production (never commit directly)
└─ development        — integration (never commit directly)
   └─ agent/TICK-<DOMAIN>-<num>-<slug>  — one branch per ticket, from fresh development, in an isolated worktree
ticket-state          — orthogonal, no app code, never merges into development/main
```

**Hard rules (no exceptions):**

- Never push directly to `main` or `development` — all code lands via `agent/TICK-...` merge.
- **No ticket, no change.** Every code change ties to a `ticket-state` ticket.
- One agent branch per ticket, fresh from `development`, in a worktree **outside** the repo (`../EduToolV4-worktrees/TICK-...` or similar, never `worktrees/` inside repo).
- Tests for the change pass before `ready-for-review`; full suite passes on `development` after merge.
- Never `push --force` or `reset --hard` `ticket-state` to fix a rejected push — rejection is the mechanism working.

This repo's `ticket-state` protections are convention-only — see §5.

---

## 4. Ticket-state protocol (the only way to read/write tickets)

`ticket-state` is git-backed for the rejection signal. A second agent racing to claim the same ticket gets a hard `! [rejected] non-fast-forward`, not a silent overwrite — but only if every write follows the exact sequence:

**Reading state (always fresh):**

```bash
# from the dedicated worktree — never from your feature worktree
cd ../EduToolV4-ticket-state
git fetch origin ticket-state && git reset --hard origin/ticket-state
# now read tickets/pending/, tickets/in-progress/, counters/, handoffs/
```

A locally cached view is **never** valid. Do NOT trust the worktree without `fetch` + `reset`.

**Claiming a ticket / creating a new one:**

```bash
cd ../EduToolV4-ticket-state
git fetch origin ticket-state && git reset --hard origin/ticket-state
# 1. confirm ticket still in tickets/pending/ (or counter value for new ticket)
# 2. ONE commit: move ticket to tickets/in-progress/, fill Assigned to / Started / Worktree / Branch, AND increment/create counters/<DOMAIN>.txt (create as 1 if first ticket in that domain)
git push origin ticket-state
# 3. if rejected (non-fast-forward): DO NOT force-push. Fetch+reset again, re-check if still unclaimed / counter still current, retry max 3. If already claimed, pick another ticket.
```

Writing a handoff is the same sequence: single `handoffs/<TICK-ID>.md` file per ticket.

**Mechanical guard:** `ticket-state/.github/workflows/ticket-state-guard.yml:1` checks every push shape (ticket alone, ticket+counter, or single handoff). It still runs in Actions even though it isn't a required status check on this repo (see §5). A failed guard is a block — fix the protocol, don't bypass it.

Lifecycle: `pending → in-progress → ready-for-review → merged → completed` (or `blocked`, `cancelled`). Full steps: `shared/rules/git-workflow.md` §Step-by-step lifecycle. Never work without a worktree; delete `handoffs/<TICK-ID>.md` only after `completed`.

---

## 5. Branch protection note (this repo — org plan limit)

GitHub branch protection for `ticket-state` (Require linear history, Restrict force pushes, Require `ticket-state-guard`) **is not enabled** on this org — it requires a plan upgrade. See `.ai/workspace/context/known-issues.md:8` and `decisions/ADR-001-skip-ticket-state-protection.md:1`.

- `ticket-state-guard` still runs but does **not** block pushes — reviewer must check it manually in Actions.
- Convention is enforced by every agent following §4 exactly. Do NOT disable `ticket-state-guard.yml`.

Re-enable in GitHub Settings → Branches when the plan is upgraded (no code change needed).

---

## 6. Before / while / after code

**Before coding:**

- Self-assess confidence per `shared/rules/confidence-gating.md:1` — <80% stop/ask, 80–94% proceed with disclosed assumption, ≥95% proceed. Auth / tenant isolation / grading / migration / realtime touched but not fully verified → capped at 79%.
- Inspect related files — reuse over duplication, no `any`, explicit types on boundaries.

**While building:**

- Follow `CORE.md` Part 1 always (validation, pagination/no N+1, indexed queries, token-based tenant scoping on every relation hop, transaction for multi-step writes, no silent `catch {}`).
- If `rules/project.md:1` or `skills/*/FACTS.md:1` contradicts code, flag it and run `onboarder`.

**After building:**

- Targeted tests → full `lint`/`typecheck`/`test`/`build` on the feature worktree.
- `git add` + `git commit -m "feat(<scope>): <description>"` inside the feature worktree.
- Update the ticket via §4 to `ready-for-review` (commit hash + test results + confidence score), then reviewer merges to `development`, re-runs full suite on `development`, moves ticket `merged → completed`, updates `.ai/workspace/context/current-state.md:1` and `changelog/CHANGELOG.md:1`, deletes handoff.

Workspace memory (current-state, known-issues, roadmap, decisions) lives in `.ai/workspace/:1`; ticket coordination lives on `ticket-state`, not there. See `.ai/workspace/README.md:1`.

---

## 7. Where to look next

- Setup / re-wiring a new machine: `Build.md:1` Steps 1–7 (already done; Step 8 skipped per §5).
- Full rule reasoning: `shared/rules/*.md`, `shared/skills/*/MUST-HAVES.md` via `CORE.md` Part 2.
- Roles: `shared/agents/developer.md:1`, `tester.md`, `reviewer.md`, `debugger.md`, `onboarder.md`.

When in doubt, trust source code > explicit human instruction > `CORE.md` > `MUST-HAVES`/`FACTS.md` > `workspace/` > `agents/` (`shared/INDEX.md` hierarchy). And never guess — ask.
