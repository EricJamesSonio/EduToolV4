# ticket-state

Coordination-only branch. No application code lives here, ever. This
branch never merges into `development` or `main`, and application branches
are never created from it — its history is completely orthogonal to the
rest of the repo.

Full protocol: `shared/rules/git-workflow.md` §Ticket-state protocol (in
the `ai-skills` submodule, reachable from the app worktree — this branch
intentionally does not carry its own copy).

## Why this branch exists

A shared ticket file that two agents edit directly can silently overwrite
one agent's claim with another's. Git gives that a real fix for free: two
agents racing to claim the same ticket or bump the same counter get a
hard, loud rejection on the second push, not a silent overwrite — but only
if every write goes through fetch → reset → single commit → push → retry
on rejection. Skipping that sequence (especially the re-check after a
rejection) reintroduces the exact race this branch exists to prevent.

## Layout

```
ticket-state/
├── tickets/
│   ├── pending/              ← unclaimed, TICK-000-template.md lives here
│   ├── in-progress/
│   ├── ready-for-review/
│   ├── blocked/
│   ├── merged/
│   ├── completed/            ← archived into completed/<YYYY-MM>/ monthly
│   │                            once it holds >40 tickets outside a dated
│   │                            subfolder
│   └── cancelled/            ← same archival rule as completed/
├── counters/                 ← STARTS EMPTY. See "Counters" below — a
│                                 domain's counter file is created the
│                                 first time a ticket is ever claimed in
│                                 that domain, not seeded in advance.
└── handoffs/
    └── <TICK-ID>.md          ← per-ticket, never a shared handoff.md.
                                  Deleted once that ticket completes.
```

`.gitkeep` files sit in the otherwise-empty tracked folders purely so git
tracks the empty directory — delete a `.gitkeep` the moment that folder
gets its first real file, don't leave it alongside real content.

## Counters — created on demand, not seeded

`counters/<DOMAIN>.txt` tracks the last-assigned ticket number for that
domain, as a single integer. This branch does **not** ship with a fixed
list of domain files, because the domain codes themselves aren't known
until `agents/onboarder.md` has run against the actual project and
populated the project's `rules/CORE.md` Part 3 — this branch is meant to
be reusable as-is across different projects, and pre-seeding one project's
domain names into it would defeat that.

How a counter actually comes into existence:

1. The first time anyone claims or creates a ticket for domain `X` (per
   `shared/rules/git-workflow.md` §Ticket-state protocol → "Claiming a
   ticket"), check whether `counters/X.txt` exists in the freshly-fetched
   `ticket-state` view.
2. If it doesn't exist: create it in the **same commit** as the ticket
   claim/creation, set to `1` — that ticket becomes `TICK-X-001`. This is
   still one atomic write, same as incrementing an existing counter; a
   missing counter file is not a special case that skips the fetch/reset/
   single-commit sequence.
3. If it exists: read the current value, increment, use the new value as
   the ticket number, same as always.
4. If two agents race to create the _same_ domain's counter for the first
   time, the second push is rejected exactly like any other counter race
   — go back to fetch/reset, discover the counter now exists, and
   increment from it instead of trying to create it again.

Once created, a counter file is never deleted, even if every ticket in
that domain later gets archived — it's the only reliable source for "what
number comes next," independent of what's currently visible in
`tickets/`.

## Working here

- Always `git fetch origin ticket-state && git reset --hard origin/ticket-state`
  before reading or writing anything below — a locally cached view is
  never valid, that's the entire premise of this branch.
- Claim a ticket, create/increment a counter, or write a handoff only
  through the protocol in `shared/rules/git-workflow.md` §Ticket-state
  protocol — never a raw `git commit && git push`.
- Never force-push or hard-reset this branch to resolve a rejected push.
  A rejection means another agent moved first — that's the mechanism
  working, not an error. See `shared/rules/dangerous-operations.md`.
- This branch has its own CI guard (`.github/workflows/ticket-state-guard.yml`)
  as a required status check — it flags a push whose changed files don't
  match a known claim/handoff shape (ticket alone, ticket + counter
  together, or a single handoff file), catching a skipped protocol rather
  than replacing it. The guard doesn't care about specific domain names,
  so it needs no changes when a new domain's counter is created for the
  first time.

## Setting this branch up for the first time (per project)

```bash
git checkout --orphan ticket-state
git rm -rf .                     # clear anything carried over from main
# copy this scaffold's contents in — counters/ stays empty except for
# a .gitkeep, tickets/pending/ gets only TICK-000-template.md
git add .
git commit -m "chore: initialize ticket-state branch"
git push origin ticket-state
```

Then, from the main checkout, add the dedicated worktree (outside the repo,
per `shared/rules/git-workflow.md` §Worktree layout):

```bash
git worktree add ../<project>-ticket-state ticket-state
```

And enable on the remote (GitHub/GitLab branch protection for
`ticket-state`):

- Require linear history
- Restrict force pushes
- Require the `ticket-state-guard` status check to pass before merging/pushing
