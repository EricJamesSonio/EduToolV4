# Wire up `.ai` framework in this project — corrected agent instructions

> **Scope:** `development` only. `main` is never touched by any of this wiring — not the submodule add, not the `.ai/` files, not `ticket-state` (orthogonal branch, never merges into either). The only thing that ever reaches `main` is `development → main` through your normal release process, on its own schedule. Nothing here should be pushed to `main`.

Current state: `ai-skills` exists at `https://github.com/EricJamesSonio/ai-skills`. The `.ai/` project-local files (`CORE.md`, `project.md`, `skills/*/FACTS.md`, `workspace/*`) are drafted and ready to place. `ticket-state` does not exist yet — build it from scratch. These instructions are the **corrected flow** — the first prompt missed `.gitignore`, stray-file handling, Windows `git` path, duplicate guard, orphan cleanup, and the Part 0 pin. Follow this file verbatim.

All commands use Windows PowerShell with the explicit git path (git is not on `PATH` on this machine):

```powershell
$git = "C:\Program Files\Git\cmd\git.exe"
```

Run everything from the repo root (where `.git` lives), on branch `development`. Ensure `development` is clean before starting (`git status` shows `nothing to commit` or only ignored `node_modules`/`dist`/`build` artifacts).

---

## Step 1 — Remove empty `.ai/shared` stub, fix `.gitignore`, fix stray files in `ai-skills`, add the submodule

**Why this step was corrected:** the repo has `.gitignore:4` = `.ai` so `git add .ai` silently does nothing. An empty `.ai/shared` folder also blocks `git submodule add`. And `ai-skills` itself shipped stray `rules/CORE.md` + `rules/project.md` that must be deleted upstream before verifying.

```powershell
$git = "C:\Program Files\Git\cmd\git.exe"

# 1a. Remove the empty stub that blocks submodule add
Remove-Item .ai\shared -Force -Recurse -ErrorAction SilentlyContinue

# 1b. Fix .gitignore — delete the line that ignores `.ai` (don't use -f as a workaround)
# .gitignore before:
#   \client
#   .env
#   .env.local
#   .ai          <-- delete this line
# After:
#   \client
#   .env
#   .env.local
# Edit .gitignore manually, save. MUST be committed.

# 1c. Add the submodule
& $git submodule add https://github.com/EricJamesSonio/ai-skills .ai/shared
& $git submodule update --init --recursive

# 1d. Verify — this WILL fail the first time on this repo, that's expected:
ls .ai\shared
# expect: README.md  INDEX.md  CORE-template.md  rules/  skills/  agents/  Build.md  .gitignore
ls .ai\shared\rules
# MUST NOT contain CORE.md or project.md — those are project-local, not shared.
# If they appear, fix the upstream repo (you are the owner) before continuing:

& $git -C .ai/shared rm rules/CORE.md rules/project.md
& $git -C .ai/shared commit -m "chore: remove stray rules/CORE.md and rules/project.md from shared (project-local only)"
& $git -C .ai/shared push origin main
# then update the pin in this repo to the new upstream commit:
& $git submodule update --remote .ai/shared
ls .ai\shared\rules  # verify again — now should list only architecture.md, ci-cd.md, ... without CORE.md/project.md

# 1e. Commit the wiring (include .gitignore fix)
& $git add .gitmodules .ai/shared .gitignore
& $git commit -m "chore: add ai-skills as submodule at .ai/shared"
& $git push origin development

# Verify pin:
& $git submodule status        # should show <sha> .ai/shared (no leading -)
& $git -C .ai/shared rev-parse HEAD
```

**Commit:** `.gitmodules` + `.ai/shared` (160000) + `.gitignore` fix.

---

## Step 2 — Place the project-local `.ai/` files (already on disk, now visible)

These files already exist on disk at these exact paths — they were untracked because of `.gitignore`. Now that `.gitignore` is fixed, they are visible:

```
.ai/INDEX.md
.ai/rules/CORE.md
.ai/rules/project.md
.ai/skills/ai-integration/FACTS.md
.ai/skills/authentication/FACTS.md
.ai/skills/backend/FACTS.md
.ai/skills/database/FACTS.md
.ai/skills/frontend/FACTS.md
.ai/skills/realtime/FACTS.md
.ai/skills/testing/FACTS.md
.ai/workspace/README.md
.ai/workspace/handoff.md
.ai/workspace/handoff-template.md
.ai/workspace/context/current-state.md
.ai/workspace/context/known-issues.md
.ai/workspace/context/roadmap.md
.ai/workspace/decisions/ADR-000-template.md
.ai/workspace/changelog/CHANGELOG.md
```

```powershell
& $git add .ai
& $git commit -m "chore: add project-local .ai/ files"
& $git push origin development
```

---

## Step 3 — Remove the duplicate `ticket-state-guard.yml` from `development`

`ticket-state-guard.yml` is **canonical on `ticket-state` only**. A copy was drafted on `development` — delete it there.

```powershell
& $git rm .github/workflows/ticket-state-guard.yml
& $git commit -m "chore: remove ticket-state-guard.yml from development — canonical copy lives on ticket-state"
& $git push origin development
```

---

## Step 4 — Build `ticket-state` — orphan branch off current `development`

This is a **second, orthogonal branch in this same repo** — no application code, never merges into `main`/`development`. The working tree will appear empty while on this branch — that's expected. Your application files (e.g. `backend/`/`frontend/`/`src/`/`app/`) are safe in `development` history and will return when you checkout `development` again.

```powershell
& $git checkout --orphan ticket-state

# Clear everything carried over from development.
# The first rm may error on .gitmodules — that's fine, continue:
& $git rm -rf . 2>&1 | Out-String | Select-Object -First 5

# If the working tree still shows app code (the orphan's index was dirty
# because .gitmodules errored), clear it fully:
& $git rm -rf --cached . 2>&1 | Out-String | Select-Object -First 5
# remove any remaining app-code dirs that survived (adjust list to your project — examples below):
Remove-Item backend,frontend,src,app,.Build,.Documentation,.Images,.Tests,graphify-out,MCP -Recurse -Force -ErrorAction SilentlyContinue
& $git clean -fdx

# Working tree is now empty (only .git). Verify:
# Get-ChildItem -Force   # should show only .git
# git status --short     # should be empty
```

Create the exact structure:

```
ticket-state/  (branch root — no "ticket-state/" prefix)
├── README.md                                        # from ai-skills@6d60b84 ticket-state/README.md
├── .github/
│   └── workflows/
│       └── ticket-state-guard.yml                   # from ai-skills@6d60b84 ticket-state/.github/... same file
├── tickets/
│   ├── pending/
│   │   └── TICK-000-template.md                     # from ai-skills@6d60b84 ticket-state/tickets/pending/...
│   ├── in-progress/.gitkeep
│   ├── ready-for-review/.gitkeep
│   ├── blocked/.gitkeep
│   ├── merged/.gitkeep
│   ├── completed/.gitkeep
│   └── cancelled/.gitkeep
├── counters/.gitkeep
└── handoffs/.gitkeep
```

Source the 3 drafted files from the `ai-skills` submodule history (they live at `6d60b84` before the `ticket-state` folder was removed from HEAD). Easiest is a temp clone:

```powershell
& $git clone https://github.com/EricJamesSonio/ai-skills $env:TEMP\ai-skills-tmp 2>&1 | Out-Null
& $git -C $env:TEMP\ai-skills-tmp checkout 6d60b84 2>&1 | Out-Null

New-Item -ItemType Directory -Force -Path ".github\workflows","tickets\pending","tickets\in-progress","tickets\ready-for-review","tickets\blocked","tickets\merged","tickets\completed","tickets\cancelled","counters","handoffs" | Out-Null

Copy-Item "$env:TEMP\ai-skills-tmp\ticket-state\README.md" ".\README.md" -Force
Copy-Item "$env:TEMP\ai-skills-tmp\ticket-state\.github\workflows\ticket-state-guard.yml" ".\.github\workflows\ticket-state-guard.yml" -Force
Copy-Item "$env:TEMP\ai-skills-tmp\ticket-state\tickets\pending\TICK-000-template.md" ".\tickets\pending\TICK-000-template.md" -Force

# Empty-folder placeholders — zero bytes:
"" | Out-File -Encoding utf8 -NoNewline "tickets\in-progress\.gitkeep"
"" | Out-File -Encoding utf8 -NoNewline "tickets\ready-for-review\.gitkeep"
"" | Out-File -Encoding utf8 -NoNewline "tickets\blocked\.gitkeep"
"" | Out-File -Encoding utf8 -NoNewline "tickets\merged\.gitkeep"
"" | Out-File -Encoding utf8 -NoNewline "tickets\completed\.gitkeep"
"" | Out-File -Encoding utf8 -NoNewline "tickets\cancelled\.gitkeep"
"" | Out-File -Encoding utf8 -NoNewline "counters\.gitkeep"
"" | Out-File -Encoding utf8 -NoNewline "handoffs\.gitkeep"

Remove-Item -Recurse -Force $env:TEMP\ai-skills-tmp -ErrorAction SilentlyContinue

# Verify scaffold:
# Get-ChildItem -Recurse | Select-Object FullName
# git status --short  # expect: A  .github/... A  README.md A  counters/.gitkeep ... A  tickets/... (11 files total)
```

`counters/` stays empty except its `.gitkeep` until the first ticket in any domain is claimed (see `README.md`'s "Counters — created on demand" section — domain codes aren't known until `onboarder` fills `CORE.md` Part 3, so pre-seeding counters would be wrong).

```powershell
& $git add .
& $git commit -m "chore: initialize ticket-state branch"
& $git push origin ticket-state
```

---

## Step 5 — Return to `development`, add the dedicated worktree (outside the repo)

> **Generic name:** use `../<project-name>-ticket-state` — e.g. if the repo folder is `MyApp`, the worktree is `../MyApp-ticket-state`. Never inside the repo.

```powershell
& $git checkout development
& $git worktree add ../<project-name>-ticket-state ticket-state
& $git worktree list
# expect:
#   C:/.../<project>                 <sha> [development]
#   C:/.../<project>-ticket-state    <sha> [ticket-state]

# Verify worktree contents (outside repo):
Get-ChildItem ..\<project-name>-ticket-state -Force | Format-Table Name -AutoSize
# .github  counters  handoffs  tickets  README.md  .git

# Re-init submodule pointer on development (it was empty while on ticket-state):
& $git submodule update --init --recursive
ls .ai\shared   # should show agents/, rules/, skills/, etc again
```

Never create a `worktrees/` folder inside the repo, never `git checkout ticket-state` inside a feature worktree — the dedicated worktree exists so ticket-state ops never disturb code.

---

## Step 6 — Fill `.ai/rules/CORE.md` Part 0 pin (still on `development`)

Part 0 was still `<sha — fill in after first submodule add>` after Step 1. Fill it now:

```powershell
& $git -C .ai/shared rev-parse HEAD
# or: git rev-parse HEAD:.ai/shared
# or: git submodule status
# e.g. c09788beeaac149d69ad3b168354f1503a866698
```

Edit `.ai/rules/CORE.md`: replace the placeholder intro's Part 0 with (use the actual `<project-name>` of this repo):

```markdown
## Part 0 — Project wiring

- **Shared skills**: `.ai/shared/` — git submodule → `ai-skills`, pinned to commit `<paste SHA here>`. Bump only via a dedicated `INFRA` ticket.
- **Ticket-state**: dedicated worktree at `../<project-name>-ticket-state`, branch `ticket-state`. Never checked out inside a feature worktree.
- **Handoffs**: `ticket-state/handoffs/<TICK-ID>.md` (per-ticket, not a single global file).

Confirm these three exist and are current before claiming a ticket. If any is missing, that's an onboarding gap — run `shared/agents/onboarder.md`.
```

```powershell
& $git add .ai/rules/CORE.md
& $git commit -m "chore: fill CORE.md Part 0 submodule pin <short-sha>"
& $git push origin development
```

---

## Step 7 — Run `onboarder` (included in this flow, no longer deferred)

This step was previously listed as "still open / do later" — it is now part of the wiring. Do not start ticket work until it has run.

```powershell
# Every agent's entry point every ticket is .ai/rules/CORE.md — but CORE.md Part 3,
# project.md, and all skills/*/FACTS.md are still placeholders (UNKNOWN — needs
# onboarder run) until this runs:
# → read shared/agents/onboarder.md in full, then execute it against the actual
#   project codebase (whatever the real source dirs are — e.g. backend/src,
#   frontend/src, src/, prisma/, etc. — derived from repo evidence, not assumed).
# It will:
#   - derive domain codes from real top-level modules/route groups and write
#     CORE.md Part 3 (e.g. AUTH, BOOKING, PAYMENT, etc. + INFRA), replacing UNKNOWN
#   - fill .ai/rules/project.md (stack, purpose, scope, main domains)
#   - fill every .ai/skills/*/FACTS.md (ai-integration, authentication, backend,
#     database, frontend, realtime, testing) from repo evidence

# After onboarder, commit its output on development:
& $git add .ai/rules/CORE.md .ai/rules/project.md .ai/skills/*/FACTS.md .ai/workspace/context/*
& $git commit -m "chore: onboarder — fill CORE Part 3, project.md, skills FACTS from repo evidence"
& $git push origin development
```

No hand-writing domain codes — they must be evidenced. Re-run/extend Part 3 later as modules grow; never silently replace the list.

First ticket work then follows `shared/rules/git-workflow.md` §Step-by-step lifecycle normally (claim via `ticket-state` protocol with `git fetch origin ticket-state && git reset --hard origin/ticket-state` before every read/write).

---

## Step 8 — Branch protection (manual, on GitHub — NOT scriptable)

> **Skip if your org plan doesn't support it.** Some GitHub org/team plans require an upgrade to enable branch protection / required status checks. If `Settings → Branches → Add rule` is unavailable or asks for an upgrade for `ticket-state`, **skip this step** — do not block wiring. The framework works without mechanical enforcement; agents fall back to convention (see below).

If protection **is** available, enable for `ticket-state`:

- [x] Require linear history
- [x] Restrict force pushes (or "Do not allow force pushes" / "Block force pushes")
- [x] Require status checks to pass before merging → search `ticket-state-guard`
  > This option only appears **after** the workflow has run at least once — the `git push origin ticket-state` in Step 4 already triggered `ticket-state-guard` on that branch, so it should be selectable now. If it's not, wait for Actions to finish, then refresh.

Also keep any existing protection on `development`/`main`.

**When protection is skipped (this repo — org upgrade required):**

- `ticket-state-guard.yml` still runs on every push to `ticket-state` and will show a failed check in Actions — it just won't block the push.
- Agents **MUST NOT** force-push or `git reset --hard` `ticket-state` to override a rejected push. A rejection still means another agent moved first — re-fetch, re-check, retry (max 3), per `shared/rules/git-workflow.md` §Ticket-state protocol.
- `shared/rules/dangerous-operations.md` still applies — history rewrite on `ticket-state` is never allowed as a fix for a race.
- Reviewer checks the guard manually in PR/Actions before merging.

This is documented in `.ai/workspace/context/known-issues.md` (§ ticket-state branch protection unavailable) and `decisions/ADR-001-skip-ticket-state-protection.md`.

---

## After this — what's still open

**Nothing — when Step 8 is skipped, wiring is complete after Steps 1–7.** The agent has already filled the pin, run `onboarder`, and pushed `ticket-state`. No re-run needed. Only re-visit Step 8 if the org plan is later upgraded.

## Quick verification checklist (for the agent to run before declaring done)

```powershell
& $git branch -a                          # development, main, ticket-state + remotes
& $git submodule status                   # <sha> .ai/shared (no leading -)
ls .ai\shared                             # README.md, INDEX.md, CORE-template.md, rules/, skills/, agents/
ls .ai\shared\rules                       # NO CORE.md / project.md
Get-Content .ai\rules\CORE.md | Select-String "Part 0"  # should show pinned SHA + ../<project-name>-ticket-state
& $git worktree list                      # shows ../<project-name>-ticket-state [ticket-state]
Get-ChildItem ..\<project-name>-ticket-state   # README.md, .github/, tickets/, counters/, handoffs/
& $git -C ..\<project-name>-ticket-state status # clean or 11 files at root-commit
& $git log --oneline -3                   # development shows pin + onboarder commits; ticket-state shows root-commit
```
