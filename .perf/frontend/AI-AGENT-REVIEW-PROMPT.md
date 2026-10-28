# Prompt — Audit and Verify the EduTool Frontend Performance Plan

You have access to the full EduTool repository. Review the phase documents in this folder and independently inspect the current codebase before recommending implementation.

This is a **read-only review prompt**. Do not implement optimization changes during this review.

## Objective

Verify, correct, and improve the proposed frontend performance plan using actual repository evidence. Find important performance opportunities the plan missed, identify phases that are unnecessary or incorrectly ordered, and flag unsafe assumptions. The goal is a faster frontend **without breaking existing functionality**.

## First: inspect, do not edit

Do not modify source files during the initial review. Do not install dependencies, change configuration, delete files, or run migrations. Do not read or print secrets from `.env` files. Inspect package metadata and source code only as needed.

Start by reviewing:

- `README.md`
- `PHASE-00-BASELINE-AND-AUDIT.md` through `PHASE-06-VERIFY-AND-REGRESSION.md`
- `frontend/src/app/providers.tsx`
- `frontend/src/hooks/meeting/useAgoraRTC.ts`
- `frontend/src/hooks/meeting/useMeetingSocket.ts`
- `frontend/src/lib/query-client.config.ts`
- `frontend/src/app/layout.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/app/educator/layout.tsx`
- `frontend/src/app/student/layout.tsx`
- `frontend/src/components/shared/NotificationDropdown.tsx`
- `frontend/src/hooks/useNotifications.ts`
- `frontend/package.json`, `frontend/next.config.ts`, and the lockfile metadata
- Relevant tests, performance tooling, import boundaries, and route layouts

Paths are relative to `frontend/` unless stated otherwise. Confirm exact paths before relying on them.

## Current review context

Re-verify all of this against the current source; do not assume it remains true.

- Next.js `16.2.1`, React/React DOM `19.2.4`, TanStack Query `5.101.4`.
- The last recorded build succeeded in about 55 seconds of compilation and 49 seconds of TypeScript checking, with 50 static pages.
- `npx tsc --noEmit --incremental false` passed during the previous review.
- The previous review did not run a fresh build.
- The reported `.next/dev/types/routes.d.ts` error did not reproduce.
- The reported `screenTrack.close()` nullability error was fixed in the reviewed code.
- The recorded E2E baseline was 15 passing tests and one failure at `frontend/e2e/admin-setup.spec.ts:1497` (HTTP 409 instead of 201).
- Historical raw route-entry measurements are in `PHASE-00-BASELINE-AND-AUDIT.md`; treat them as historical until regenerated.

## Investigate independently

1. Confirm framework and dependency versions from the actual repository.
2. Trace imports from the root layout, providers, public entry page, and role layouts. Identify dependencies unnecessarily loaded on routes that do not use them.
3. Inspect role-specific layouts and route groups for route-isolation and client-boundary opportunities.
4. Find large dependencies and expensive components using package metadata, import graphs, generated manifests, and existing tooling.
5. Run or inspect `npx next experimental-analyze` as the built-in Next bundle analyzer. Do not add an analyzer dependency.
6. Compare raw route-entry JavaScript in `.next/server/app/**/page_client-reference-manifest.js`. Report dynamic chunks separately from initial entries.
7. Review API request patterns and TanStack Query configuration for demonstrated duplication, waterfalls, or unsafe cache policies.
8. Inspect images, video, fonts, and public assets for transfer, decode, and layout-stability costs.
9. Review client/server component boundaries and identify only evidence-backed candidates for reducing client JavaScript.
10. Examine meeting lifecycle code carefully: dynamic imports, initialization cancellation, Agora client cleanup, track cleanup, screen-sharing restoration, and socket lifecycle.
11. Check current build/test failures, including generated-type errors, screen-track nullability, and the known E2E baseline. Never fix generated `.next` output directly.
12. Identify additional performance issues not covered by the phase documents.
13. Compare the current execution order against the revised order in `README.md`:
    - Phase 00 baseline;
    - Phase 01 verification;
    - Phase 04A admin create-dialog/Zod deferral;
    - Phase 04B student-detail ReactFlow deferral;
    - Phase 02A meeting lifecycle;
    - Phase 02B lazy Socket.IO;
    - Phase 03 notification/query work;
    - Phase 05A assets;
    - Phase 05B landing/auth boundary;
    - optional dashboard waterfall;
    - Phase 06 verification.

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

Do not claim a bundle-size improvement without measurement or reliable build evidence. Raw manifest size and compressed browser transfer size are different; say which one is being reported. Do not label a component as a bottleneck merely because it is large or complex.

## Safety requirements

- Preserve all existing product behavior and UI.
- Preserve authentication, role checks, organization isolation, API contracts, and sensitive-data boundaries.
- Do not broadly change cache freshness, retry behavior, invalidation, or query keys without tracing all affected callers.
- Do not change Agora subscription or screen-sharing semantics without lifecycle validation.
- Do not globally remove `"use client"` or convert pages to server components without tracing hooks, browser APIs, context, and event handlers.
- Do not delete assets until repository references and usage have been checked.
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
7. **Validation plan** — commands, route-manifest comparisons, browser Network checks, and user journeys to test each phase.
8. **First recommended batch** — the smallest safe next change, or a statement that the build must be repaired before performance work continues.

Finish by listing the exact files in this plan folder that should be updated and what to change in each. Do not edit them in this review.
