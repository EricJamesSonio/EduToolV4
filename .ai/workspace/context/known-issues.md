# Known Issues

<!--
One entry per issue. This is institutional memory — record rejected
solutions explicitly so agents don't re-propose them.
-->

## ticket-state branch protection unavailable (org plan)

Location: `ticket-state` branch, `.github/workflows/ticket-state-guard.yml`

Problem:
GitHub branch protection for `ticket-state` (Require linear history, Restrict force pushes, Require `ticket-state-guard` status check) cannot be enabled on this org — GitHub asks for a plan upgrade. The guard workflow still runs but does not block pushes.

Investigation:
Set up per `Build.md` Step 8 and `shared/rules/git-workflow.md` §Ticket-state protocol §Mechanical enforcement. Verified in repo Settings → Branches → Add rule — upgrade prompt shown. `ticket-state` itself is otherwise correctly wired (scaffold at 9dc0950b, worktree at `../<project-name>-ticket-state`).

Rejected approaches:
- Do not disable or delete `ticket-state-guard.yml` — it still provides the failure signal in Actions even without required-check enforcement.
- Do not work around a rejected `git push` to `ticket-state` with `git push --force` or `git reset --hard` — a rejection is the mechanism working, not an error (see `shared/rules/dangerous-operations.md`).

What agents must do instead:
- Follow `shared/rules/git-workflow.md` §Ticket-state protocol strictly: `git fetch origin ticket-state && git reset --hard origin/ticket-state` before every read/write, single-commit claim (ticket + counter together), push, retry on rejection (max 3, re-check state), never force-push.
- Reviewer manually checks the `ticket-state-guard` run in Actions before merging — treat a failed guard as a block even though GitHub doesn't enforce it.

Decision:
`decisions/ADR-001-skip-ticket-state-protection.md` — accepted: skip mechanical protection, rely on convention.

Possible cause:
GitHub org/team plan tier. Re-enable protection if the plan is later upgraded — no code change needed, just apply the rule in Settings.

---

## <Issue title>

Location: <path>

Problem:
<description>

Investigation:
<related ticket, e.g. TICK-014>

Rejected approaches:

- <approach> — rejected because <reason>

Possible cause:
<if known>
