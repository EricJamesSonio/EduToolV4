# ADR-001 — Skip ticket-state branch protection (org plan limit)

Status: accepted
Date: 2026-08-24

## Decision

Do not require GitHub branch protection (Require linear history, Restrict force pushes, Require `ticket-state-guard` status check) on the `ticket-state` branch. The `.ai` framework's mechanical enforcement is downgraded to convention-only for this repo.

## Reason

GitHub Settings → Branches → Add rule for `ticket-state` requires an organization plan upgrade — the controls are not available on the current tier. Blocking the entire `.ai` wiring on a billing tier would prevent all ticket-state usage. The branch is already correctly scaffolded (root-commit 9dc0950b on `origin/ticket-state`, worktree at `../<project-name>-ticket-state`, guard at `.github/workflows/ticket-state-guard.yml`) and `ticket-state-guard` still runs in Actions — it just cannot be set as a required check.

## Consequences

- Agents MUST follow `shared/rules/git-workflow.md` §Ticket-state protocol and `shared/rules/dangerous-operations.md` without exception: `fetch` + `reset --hard` before every read/write, single-commit ticket+counter, `push`, retry on rejection (max 3, re-check), never `push --force` / `reset --hard` to override a rejection. A rejection is the signal, not an error.
- Reviewer manually verifies the `ticket-state-guard` run in Actions before merging — treat a failed guard as a block even though GitHub won't block it automatically.
- Agents must not create or re-propose a ticket to "fix" protection — this is a known-issue, not a bug. See `.ai/workspace/context/known-issues.md` §ticket-state branch protection unavailable.

## Alternatives Rejected

- Delay wiring until the org is upgraded — rejected: wiring is needed now; convention is sufficient with disciplined agents.
- Delete or disable `ticket-state-guard.yml` because it isn't required — rejected: the guard still provides the failure signal in Actions; its value is the post-facto check, not just the block.
- Work around `git push` rejections with force-push — rejected: reintroduces the exact race `ticket-state` exists to prevent; explicitly forbidden in `CORE.md` Part 1 and `dangerous-operations.md`.

Revisit: if the org plan is later upgraded, apply the protection rule in Settings (no code or branch change needed).
