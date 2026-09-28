# Handoff — TICK-INFRA-014 unified radius tokens (ready-for-review)

Branch: `agent/TICK-INFRA-014-unified-radius-tokens`
  (started as `style/radius-tokens` per direct user instruction, renamed;
  worktree dir keeps the old name `../EduToolV4-worktrees/style-radius-tokens`)
Head: `e451b312`. Base: `development @ 9a2194bb`. 5 commits, one per phase.

## What changed
- `theme.css` `@theme`: xs 4px / control 6px / box 8px / pill 9999px +
  legacy sm→xs, md→control, lg→box, xl→box. (`tailwind.config.ts` is NOT
  loaded under v4 — proven by compiling the app's classes; config kept for
  IDE compat with an honest comment.)
- 19 `ui/` primitives, 9 shared/layout files, dashboard StatCard, 4 CSS
  baselines, 7 outlier files → semantic classes. No literal radii remain
  (`lint:radius` clean, negative-tested).
- Guardrail: `frontend/scripts/check-radius-tokens.mjs` + `lint:radius` +
  CI `frontend-radius-guard` (wired into `ci-gate`). `docs/radius.md`.
  Landing `2xl/3xl` blocks intentionally untouched → `FOLLOW_UPS.md`.

## Verification (local Postgres `edutool` only; `DATABASE_URL2` never touched)
- tsc: 6 pre-existing errors, zero delta. eslint: 0 errors (1 pre-existing
  warning). jest: 102/102. `next build` compiles CSS; its type-check fails
  on the pre-existing `semester.api.ts` error (also red at baseline).
- Authenticated before/after (admin/educator/student + portal, 8 pages):
  pixel diffs 0.04–0.37% (corner-only) on 7 pages. No circle/pill shape
  changes, no footer mismatches, no nesting inversions, no clipping.
  → Zero radius regressions, no fix commits needed.
- Two methodology notes for the reviewer: (1) student-home first looked
  19–32% different — root cause is main-tree's UNCOMMITTED level rework
  (`student/classes/page.tsx` now auto-selects a semester instead of "all"),
  not this branch. (2) `educator/.../grades/[termId]` 404s intermittently on
  cold Turbopack dev (route-manifest race, both trees); reload resolves.
- Screenshots + radii JSONs: `C:\Users\WINDOW~1\AppData\Local\Temp\opencode\shots\`
  (`before-*/after-*`, `*-auth.json`).

## For the merger
- Merge to `development`, re-run full suite there. Then move this ticket
  `merged → completed`, update `.ai/workspace/context/current-state.md` +
  `changelog/CHANGELOG.md`, delete this handoff.
- Known non-blockers: `seed:domain` dies in `classes.seeder.ts:69`
  (`schoolYear` relation missing — pre-existing seed drift, only 2 students /
  6 classes seeded); educator/student test passwords were reset in LOCAL DB
  only to `seed123` for screenshots (no code change).
