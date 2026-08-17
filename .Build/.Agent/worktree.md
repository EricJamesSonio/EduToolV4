## Git Worktree Isolation Policy

Never make code changes directly on main (or the default branch). For every
task that edits files:

1. Create an isolated worktree + branch before touching anything:
   git worktree add -b agent/<short-task-slug>-<timestamp> ../worktrees/<slug> main

2. Do all edits, commits, and test runs inside that worktree only. Never cd
   back into the main checkout to make changes.

3. Before proposing a merge, figure out how this repo runs its tests and
   lint/typecheck — don't assume a command. Check, in order: package.json
   scripts, Makefile, README/CONTRIBUTING docs, and the CI config (e.g.
   .github/workflows/*.yml) for the exact commands and any tests that are
   *expected\* to fail (known-bug proofs, flaky-quarantined specs, etc. —
   often marked or excluded in CI). Run only what's relevant to what you
   changed if the repo is a monorepo with scoped CI.

4. Only merge to main if the discovered tests pass (treat any
   intentionally-expected-failing tests as non-blocking, per what CI does):
   git checkout main && git pull --ff-only
   git merge --no-ff agent/<slug> -m "Merge <slug>: <summary>"
   Re-run the relevant tests on main as a sanity check after merging.

5. If tests fail or there's a merge conflict, resolve it inside the
   worktree/branch, retest, then retry — never patch main directly.

6. After a successful merge, clean up:
   git worktree remove ../worktrees/<slug>
   git branch -d agent/<slug>

Never force-push or rewrite history on main. If you can't determine the
test/lint commands with confidence, say so and ask rather than guessing.
