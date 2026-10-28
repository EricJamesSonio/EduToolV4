# EduTool Frontend Performance Plan

## Purpose

A conservative, incremental plan for improving the EduTool frontend without changing product behavior. Work one phase at a time, validate it, and only then continue.

This plan is a **working proposal**, not a completed repository audit. It is based on the code and repository tree shared in this conversation, including:

- Next.js 16.2.1 and React 19.2.4, as previously reported.
- `frontend/src/app/providers.tsx`, which wraps the application with React Query and authentication providers.
- `frontend/src/hooks/meeting/useAgoraRTC.ts`, which initializes Agora RTC and manages local/remote media tracks.
- The frontend tree, which includes many role-specific routes and feature modules.
- Recent build reports showing compilation followed by TypeScript errors. Those errors must be resolved before treating any optimization batch as validated.

The AI agent should inspect the live repository and revise this plan wherever evidence supports a better approach.

## Current status

- **Provider optimization:** `ReactQueryDevtools` was changed from a static import to `next/dynamic` and remains gated to development. The user reported a successful compile stage afterward, but TypeScript failed in `useAgoraRTC.ts`.
- **Agora optimization:** dynamic loading of `agora-rtc-sdk-ng` is present in the shared version of `useAgoraRTC.ts`, but the latest version has not yet been confirmed to pass the production build. A nullability error was reported at `screenTrack.close()`.
- **Overall:** do not mark the current batch complete until the full build/type-check succeeds and meeting behavior has been smoke-tested.

## Recommended workflow

1. Ask the AI agent to inspect the repository and review these phases before implementation.
2. Agree on any plan changes before modifying code.
3. Implement one small batch only.
4. Run the checks listed in that phase.
5. Inspect the diff and test the affected user flow.
6. Record the result and only then start the next phase.

## Phase index

| File | Focus | Risk |
|---|---|---|
| `PHASE-00-BASELINE-AND-AUDIT.md` | Establish a valid baseline and inspect bundle/build evidence | Low |
| `PHASE-01-SAFE-BUNDLE-CLEANUP.md` | Development-only tools and safe static-import cleanup | Low |
| `PHASE-02-MEETING-DEPENDENCIES.md` | Lazy-load Agora and meeting-only dependencies safely | Medium–High |
| `PHASE-03-QUERY-AND-REQUEST-EFFICIENCY.md` | Query duplication, cache policy, invalidation, request waterfalls | Medium |
| `PHASE-04-ROUTE-AND-COMPONENT-SPLITTING.md` | Lazy-load genuinely heavy, route-specific UI | Medium |
| `PHASE-05-RENDERING-AND-ASSETS.md` | Client/server boundaries, images, video, fonts, and rendering costs | Medium–High |
| `PHASE-06-VERIFY-AND-REGRESSION.md` | Measure outcomes and protect behavior | Low–Medium |
| `AI-AGENT-REVIEW-PROMPT.md` | Prompt for a repository-aware agent to verify and improve this plan | N/A |

## Non-negotiable guardrails

- No broad refactors or mass rewrites for a small performance gain.
- Do not remove or weaken authentication, organization isolation, role checks, loading states, error handling, accessibility, or meeting functionality.
- Do not change API contracts, query keys, cache freshness, retry behavior, or invalidation behavior without tracing their callers and documenting the reason.
- Do not introduce dependencies unless a measurable need justifies them.
- Do not assume that `dynamic()` always improves performance. Use it where it removes genuinely optional or heavy code from an initial route.
- Do not treat a successful compile as a successful build. TypeScript and all required build checks must pass.
- Keep one phase/batch small enough to review and revert independently.
- Never edit generated `.next` output to fix a source problem.
- Do not read, print, or expose secrets from `.env` files.
