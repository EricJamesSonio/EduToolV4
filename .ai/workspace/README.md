# AI Engineering Workspace

Shared engineering context for AI agents working in this repo. Read this before touching any code.

**Ticket coordination lives on the `ticket-state` branch, not in this
folder.** `workspace/` holds project _memory_ (current state, known issues,
roadmap, decisions, changelog) — things that describe the project. Ticket
files, claims, counters, and handoffs are _coordination state_ and live in
the dedicated `ticket-state` worktree instead, per
`shared/rules/git-workflow.md` §Ticket-state protocol. Don't look for
`tickets/pending/` or a shared `handoff.md` inside this repo — see that
protocol for where they actually live and how to read/write them.

## Before starting work

1. Read `.ai/rules/CORE.md` in full — this is the only file read on every
   ticket. It contains the non-negotiable rules that must always be active,
   plus a routing table telling you exactly which additional `rules/` and
   `skills/` files this specific task needs. **Do not read the full
   `rules/` and `skills/` folders by default** — load only what CORE's
   routing table matches for your task.
2. If `rules/project.md` or any `skills/*/FACTS.md` still contains
   placeholder/bracketed text — or you notice it contradicts what you're
   seeing in the actual code — run `shared/agents/onboarder.md` before
   relying on it. Ticket work built on inaccurate project docs re-creates
   the exact problems this folder exists to prevent.
3. Read `context/current-state.md` — what exists right now.
4. Go to the dedicated `ticket-state` worktree and
   `git fetch origin ticket-state && git reset --hard origin/ticket-state`,
   then check `tickets/in-progress/` there — don't duplicate active work.
   A stale local view is never a valid check; always fetch fresh first.
5. Check `tickets/blocked/` (same fetched `ticket-state` view) — know
   what's stuck and why.
6. Check `tickets/pending/` (same view) — claim an existing ticket if one
   matches, or create a new one (ID format: `TICK-<DOMAIN>-<number>`, see
   `rules/CORE.md` Part 3). Claiming and creating both go through the
   claim/counter protocol in `shared/rules/git-workflow.md` §Ticket-state
   protocol — never a direct file move.
7. Read `context/known-issues.md` — avoid re-attempting rejected solutions.
8. Read `decisions/` for any ADR relevant to the area — don't contradict an accepted decision without flagging it.
9. Check `ticket-state/handoffs/<your-ticket-ID>.md` (in the fetched
   `ticket-state` view) before doing anything else — if it exists, another
   agent left context for you there.

## Before modifying code

- Claim the ticket via the `ticket-state` protocol (`shared/rules/git-workflow.md`
  §Ticket-state protocol — fetch, reset, one commit moving the ticket to
  `in-progress/` and filling in `Assigned to` / `Started` / `Worktree` /
  `Branch`, push, retry on rejection). This replaces any local-folder move.
- Do not start work that overlaps a ticket already `in-progress` in the
  freshly-fetched `ticket-state` view — either wait, or explicitly note in
  the ticket that you're taking over and why.
- Follow `rules/CORE.md`, the files it routes you to, and `shared/rules/git-workflow.md`.
- Self-assess confidence per `shared/rules/confidence-gating.md` before writing code.

## While working

- If you must stop mid-ticket (context limit, session end, handing off to
  another agent), write `ticket-state/handoffs/<TICK-ID>.md` (via the
  ticket-state protocol) before stopping — see that file's template. Do not
  leave a ticket `in-progress` with no handoff and no recent activity log
  entry.

## After completing work

- Add an entry to the ticket's Activity Log.
- Record commit hash(es) and test results in the ticket.
- Move the ticket through `ready-for-review/` → `merged/` → `completed/` as
  each stage finishes (or `cancelled/` with a reason if abandoned) — all via
  the `ticket-state` protocol.
- Update `context/current-state.md` if the change alters what's implemented/in-progress.
- Add an entry to `changelog/CHANGELOG.md`.
- If the work involved a non-obvious architectural or product decision, add an ADR to `decisions/`.
- Delete `ticket-state/handoffs/<TICK-ID>.md` (via the ticket-state
  protocol) once the ticket is `completed` — it's a transient handoff, not
  permanent record. Permanent history lives in the ticket's own Activity
  Log and in `changelog/`.

## Ticket lifecycle and archival

pending → in-progress → ready-for-review → merged → completed

`completed`/`cancelled` tickets (on `ticket-state`) are archived into dated
subfolders monthly (`tickets/completed/2026-08/`) so the active folders stay
small. See `shared/rules/git-workflow.md` §Ticket archival — this is
routine housekeeping, not something that needs a ticket of its own, just a
changelog line.
