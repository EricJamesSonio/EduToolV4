# TICK-INFRA-014 - Unified border-radius token system (Relief-ED)

Status: in-progress
Priority: high
Created: 2026-09-28
Created by: agent
Assigned to: agent
Started: 2026-09-28
Worktree: ../EduToolV4-worktrees/style-radius-tokens
Branch: agent/TICK-INFRA-014-unified-radius-tokens

## Problem

Border radius is scattered: `rounded-sm/md/lg/xl/2xl`, `rounded-[...]`
arbitraries, and raw `border-radius` in CSS resolve inconsistently.
`tailwind.config.ts` borderRadius is dead under Tailwind v4 (no `@config`
directive — proven by compiling the app's classes), and `--radius-md` was
referenced by `button.tsx`/`select.tsx`/`error-login.css` but never defined.
Retuning the look requires hunting down hundreds of usages.

## Goal

1. Single source of truth: semantic tokens (`xs`/`control`/`box`/`pill` +
   legacy `sm/md/lg/xl` remap) in `theme.css` `@theme`, verified by compiled
   CSS and computed styles (box 8px, control 6px, xs 4px, pill 9999px).
2. Migrate `components/ui/` primitives, shared/layout surfaces, CSS
   baselines, and ad-hoc dialog shells to the tokens; no literal radii.
3. Guardrail (`lint:radius` + CI job) fails on new literals; `docs/radius.md`.
4. Visual verification on authenticated pages (local DB + seeds); fix only
   radius regressions, one small commit each. Circles/pills must not change.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md (global styling: token system)
- frontend/src/styles/theme.css, tailwind.config.ts
- frontend/src/components/ui/*, shared/*, layout/*
- frontend/src/app/admin/dashboard/page.tsx
- frontend/scripts/check-radius-tokens.mjs, docs/radius.md

## Acceptance Criteria

- [x] Phases 0-5 committed (5 commits); tsc/eslint/jest match baseline
- [ ] Authenticated before/after screenshots reviewed; regressions fixed
- [ ] `lint:radius`, eslint, jest green on final tree

## Confidence

Score: 90/100
- Requirement clarity: 95 (explicit phase spec + scale table from user)
- Codebase verification: 92 (compiled-CSS proof; computed-style proof on
  components; authenticated pages pending this ticket's verification step)
- Architecture fit: 95 (v4 `@theme` is the idiomatic token home)
- Assumption (disclosed): branch started as `style/radius-tokens` per direct
  user instruction, renamed to agent convention on this ticket; no ticket
  existed when work began.
