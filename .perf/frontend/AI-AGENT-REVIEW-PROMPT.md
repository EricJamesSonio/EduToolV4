# Prompt — Audit and Verify the EduTool Frontend Performance Plan

You have access to the full EduTool repository. Review the phase documents in this folder and independently inspect the current codebase before recommending implementation.

## Objective

Verify, correct, and improve the proposed frontend performance plan using actual repository evidence. Find important performance opportunities that this plan missed, identify phases that are unnecessary or incorrectly ordered, and flag any unsafe assumptions. The goal is a faster frontend **without breaking existing functionality**.

## First: inspect, do not edit

Do not modify source files during the initial review. Do not install dependencies, change configuration, delete files, or run migrations. Do not read or print secrets from `.env` files. Inspect package metadata and source code only as needed.

Start by reviewing:
- `README.md`
- `PHASE-00-BASELINE-AND-AUDIT.md` through `PHASE-06-VERIFY-AND-REGRESSION.md`
- `src/app/providers.tsx`
- `src/hooks/meeting/useAgoraRTC.ts`
- `src/hooks/meeting/useMeetingSocket.ts`
- `src/lib/query-client.config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `package.json`, `next.config.ts`, and relevant lockfile metadata
- Any relevant existing tests, performance tooling, import boundaries, and route layouts

Paths are relative to the `frontend/` directory unless stated otherwise. Confirm exact paths in the repository before relying on them.

## Investigate independently

1. Confirm framework and dependency versions from the actual repository.
2. Trace imports from the root layout, providers, and public entry page. Identify dependencies that may be unnecessarily loaded on routes that do not use them.
3. Inspect role-specific layouts and route groups to find opportunities for route isolation or smaller client boundaries.
4. Find large dependencies and expensive components using package metadata, import graphs, build output, and existing tooling.
5. Review API request patterns and TanStack Query configuration for demonstrated duplication, waterfalls, or unsafe cache policies.
6. Inspect images, video, fonts, and other public assets for likely transfer/rendering costs.
7. Review client/server component boundaries and identify only evidence-backed candidates for reducing client JavaScript.
8. Examine meeting lifecycle code carefully: dynamic imports, initialization cancellation, Agora client cleanup, track cleanup, screen-sharing restoration, and socket lifecycle.
9. Check current build/test failures, including the reported `.next/dev/types/routes.d.ts` syntax error and `screenTrack` nullability error. Determine whether either still reproduces. Never fix generated `.next` output directly.
10. Identify any additional performance issues not covered by the phase documents.

## Evidence requirements

For every recommendation, include:
- Exact file path(s) and relevant function/component/import.
- The observed issue and why it matters.
- Confidence: high, medium, or low.
- Expected impact: high, medium, or low.
- Implementation risk: high, medium, or low.
- How to validate the claim.
- Dependencies on earlier work.
- Whether the recommendation is confirmed by measurements or is only a hypothesis.

Do not claim a bundle-size improvement without measurement or reliable build evidence. Do not label a component as a bottleneck merely because it is large or complex.

## Safety requirements

- Preserve all existing product behavior and UI.
- Preserve authentication, role checks, organization isolation, API contracts, and sensitive-data boundaries.
- Do not broadly change cache freshness, retry behavior, invalidation, or query keys without tracing all affected callers.
- Do not suppress TypeScript errors with `any`, unsafe assertions, or weakened compiler settings.
- Do not apply mass memoization or lazy loading without evidence.
- Prefer small, reversible batches.
- Require a successful production build/type-check after each implementation batch.
- Do not implement changes during this review unless explicitly asked in a later instruction.

## Required output

Return a review report with these sections:

1. **Repository facts verified** — versions, scripts, architecture, and tooling confirmed from source.
2. **Current blockers** — exact reproducible build/type/test failures and their source locations.
3. **Review of each proposed phase** — keep, revise, reorder, split, merge, or remove, with reasons.
4. **Additional findings** — prioritized findings with paths, confidence, impact, risk, and validation.
5. **Revised phase plan** — ordered, small batches with explicit files/scope, prerequisites, and exit criteria.
6. **Do-not-change list** — fragile or high-risk areas that should remain untouched unless evidence requires it.
7. **Validation plan** — commands and user journeys to test each phase.
8. **First recommended batch** — the smallest safe next change, or a statement that the build must be repaired before performance work continues.

Finish by listing the exact files in this plan folder that should be updated and what to change in each. Do not edit them in this review.
