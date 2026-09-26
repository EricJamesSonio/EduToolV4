# TICK-INFRA-009 — Fix broken `next build` on src/app/admin/page.tsx

Status: pending
Priority: high
Created: 2026-09-26
Created by: agent
Assigned to: unassigned
Worktree: (filled in when claimed)
Branch: (filled in when claimed)

## Problem

`next build` fails on `frontend/src/app/admin/page.tsx`. The file is a React
Server Component (no `"use client"`) that imports `useEffect` from `react` and
`useRouter` from `next/navigation`, which are Client-Component-only APIs:

```
./src/app/admin/page.tsx:4:10
You're importing a module that depends on `useRouter` into a React Server
Component module. This API is only available in Client Components.
```

The file body is only `redirect("/admin/dashboard")` — the two hook imports
appear to be unused leftovers, and `useEffect`/`useRouter` are never called in
the component body. Last touched by commits `454cff32` ("Created the admin
page") and `86a2abe6`.

This makes `next build` — and therefore the CI `frontend-build` job and the
`ci-gate` aggregate — permanently red. It is pre-existing (present on
`origin/development` at `939625b8`) and is NOT related to the TICK-GRADE-004
merge or the perf-phase pushes.

## Goal

1. `next build` completes successfully in a clean checkout.
2. The admin route still redirects to `/admin/dashboard` with the same behavior.
3. No dead imports remain; decide deliberately whether the file should be a
   Server Component (drop the hooks) or a Client Component (add `"use client"`
   and actually use them).
4. No other page regresses.

## Relevant Areas

- frontend/src/app/admin/page.tsx
- frontend/next.config.ts (build config, for reference)
- shared/rules/architecture.md; frontend skill MUST-HAVES (component rules)
- .github/workflows/ci.yml (`frontend-build` job + `ci-gate`)

## Acceptance Criteria

- [ ] `npm run build` in `frontend/` succeeds end-to-end
- [ ] `/admin` still redirects to `/admin/dashboard`
- [ ] No unused `useEffect` / `useRouter` imports left behind
- [ ] Lint + typecheck clean for the changed file
- [ ] Verified in a fresh clone with a clean `npm install`

## Confidence

- Score: not yet assessed (filed only, per explicit instruction not to start work)

## Tests

- Targeted: not run
- Full suite: not run
- Development integration: not run

## Blocker

None. Not started — filed for triage only.

## Activity Log

2026-09-26 — Filed by agent during the TICK-GRADE-004 pre-push verification.
Confirmed still present and unrelated to the 43-commit push: `git log
origin/development..development -- frontend/src/app/admin/page.tsx` returns
empty. Reproduced in a fresh clone at `dbb61e17`: the build emits exactly one
erroring file, `src/app/admin/page.tsx` (lines 3 and 4), and nothing else.
Explicitly out of scope for the GRADE-004 merge — do not start without a
claim.

## Commits

(none yet)

## Notes

Because this file breaks `next build`, the frontend production bundle cannot
currently be produced at all. Consider whether the two unused imports can just
be deleted (likely the whole fix), which keeps the file a Server Component and
preserves `redirect()` semantics.