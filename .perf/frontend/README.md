# EduTool Frontend Performance Plan

## Purpose

A conservative, incremental plan for improving the EduTool frontend without changing product behavior. Work one batch at a time, validate it, measure it, and only then continue.

This plan was revised after a read-only review of the actual repository. The original version was a proposal based on partial information; the current version replaces assumptions with source-confirmed findings and clearly labels the remaining hypotheses.

## Verified baseline

These facts were confirmed during the read-only review. They are a historical baseline, not results of a fresh build executed as part of this documentation update.

| Item | Verified value |
|---|---|
| Next.js | `16.2.1` |
| React / React DOM | `19.2.4` / `19.2.4` |
| TanStack Query | `5.101.4` |
| Agora RTC SDK | `4.24.3` |
| socket.io-client | `4.8.3` |
| `@xyflow/react` | `12.12.0` |
| Zod | `4.3.6` |
| Sonner | `2.0.7` |
| Last recorded production build | `build3.log`: compiled in 55s, TypeScript in 49s, generated 50 static pages |
| Typecheck during review | `npx tsc --noEmit --incremental false` passed (exit `0`) |
| Fresh build during review | Not run; the review was read-only |
| Built-in analyzer | `npx next experimental-analyze` is available in Next 16; no extra dependency is required |

**A fresh production build and typecheck are required before implementation begins.** Do not treat `build3.log`, the existing `.next` directory, or the review typecheck as permanent proof that the current working tree is green.

## Stale issues corrected

- The reported `.next/dev/types/routes.d.ts` syntax error did not reproduce; that generated file was absent during review.
- The reported `screenTrack.close()` nullability error is fixed in the reviewed code. `useAgoraRTC.ts` uses `IScreenVideoTrack` with a null check/cast, and the current typecheck passes.
- Failures recorded in `build.log` (`useSeederCard.ts:129`) and `build2.log` (`GradingSchemeEditor.tsx:9`) are stale relative to the passing typecheck.
- Never edit generated `.next` output to fix a source problem.

## Known E2E baseline

The recorded E2E run had **15 passing tests and 1 failure**:

- File: `frontend/e2e/admin-setup.spec.ts`
- Location: line 1497
- Test: Phase 7b enrollment wizard
- Failure: class creation returned HTTP `409` instead of the expected `201`

This is a known baseline failure related to test state/enrollment behavior, not a newly introduced performance regression. Record it before and after implementation batches; do not silently treat the suite as fully green.

## Confirmed high-impact findings

These findings are source-confirmed or derived from the generated route manifests. Expected bundle reductions are projections until a fresh build is compared.

| Finding | Evidence | Status |
|---|---|---|
| Zod adds about 265KB raw to three admin list routes | `CreateStudentDialog`, `CreateEducatorDialog`, and `CreateRegistrarDialog` statically import `validation.util.ts`, which imports Zod. The chunk `03f0ywctsn4hn.js` appears in the entry manifests for `/admin/students`, `/admin/educators`, and `/admin/registrars`. | Manifest-confirmed |
| Socket.IO and meeting context load on every educator/student route | The layouts use `next/dynamic` for the meeting provider, but the loader chunk requests `0ck~cnsw65lcb.js` (about 47.5KB) at hydration. `useMeetingSocket.ts` statically imports `socket.io-client`. Agora itself is already deferred. | Source/loader-confirmed; live request not yet measured |
| ReactFlow adds about 180KB raw to `/admin/students/[id]` | The page imports `SubjectCompletionPanel`, which imports `SubjectHierarchyModal`, which imports `SubjectHierarchyGraph`, which imports `@xyflow/react`. The graph is only shown when the modal opens. The chunk `17.0z-20w_-mb.js` is in the student-detail entry. | Manifest-confirmed |
| Notifications poll globally for portal users | `NotificationDropdown` calls both notification hooks unconditionally; it is mounted by `PortalNavbar`/`AppShell`. Summary and infinite feed both use 30-second polling, and feed polling can refetch all loaded pages. | Source-confirmed; request count timing pending |
| Meeting screen-share lifecycle can leak or lose the camera | `useAgoraRTC.ts` stops the camera without closing it, may leave replaced tracks unclosed, and may not restore the camera after a failed screen share. | Source-confirmed |
| Guest landing waits for a failing `/auth/refresh` | The landing page blocks on `isLoading`; the auth store starts loading; bootstrap calls `/auth/refresh` when no token and clears loading only after the request fails. | Source-confirmed; runtime timing pending |

## Revised execution order

The original phase numbers remain, but execution follows the order below. Phase 04 runs before Phase 02 because its confirmed bundle wins are larger and lower risk.

| Order | Work | Phase file |
|---:|---|---|
| 1 | Baseline and audit | `PHASE-00-BASELINE-AND-AUDIT.md` |
| 2 | Safe bundle cleanup verification only | `PHASE-01-SAFE-BUNDLE-CLEANUP.md` |
| 3 | Admin create-dialog splitting and Zod deferral (Phase 04A) | `PHASE-04-ROUTE-AND-COMPONENT-SPLITTING.md` |
| 4 | Student-detail hierarchy and ReactFlow deferral (Phase 04B) | `PHASE-04-ROUTE-AND-COMPONENT-SPLITTING.md` |
| 5 | Meeting lifecycle correctness (Phase 02A) | `PHASE-02-MEETING-DEPENDENCIES.md` |
| 6 | Lazy Socket.IO loading (Phase 02B) | `PHASE-02-MEETING-DEPENDENCIES.md` |
| 7 | Query/request efficiency, notifications first | `PHASE-03-QUERY-AND-REQUEST-EFFICIENCY.md` |
| 8 | Low-risk asset optimization (Phase 05A) | `PHASE-05-RENDERING-AND-ASSETS.md` |
| 9 | Landing client boundaries and auth-loading investigation (Phase 05B) | `PHASE-05-RENDERING-AND-ASSETS.md` |
| 10 | Optional dashboard request-waterfall work, only if measurements justify it | `PHASE-03-QUERY-AND-REQUEST-EFFICIENCY.md` |
| 11 | Final verification and regression testing | `PHASE-06-VERIFY-AND-REGRESSION.md` |

Phase 06 checks apply after every implementation batch, not only at the end.

## Working method

1. Audit the current source and capture a fresh baseline.
2. Implement one small, reversible batch.
3. Run the required build, typecheck, lint, and tests.
4. Measure the intended metric and inspect the diff.
5. Record the result.
6. Continue only if the batch is safe and the measurement supports it.

Do not combine unrelated phases in one batch. Do not claim an improvement without a before/after measurement or a clear manifest comparison.

## Phase index

| File | Focus | Risk |
|---|---|---|
| `PHASE-00-BASELINE-AND-AUDIT.md` | Establish a fresh baseline and route measurements | Low |
| `PHASE-01-SAFE-BUNDLE-CLEANUP.md` | Verify existing dev-tool deferral; no broad cleanup | Low |
| `PHASE-02-MEETING-DEPENDENCIES.md` | 02A lifecycle correctness; 02B lazy Socket.IO | Medium to high |
| `PHASE-03-QUERY-AND-REQUEST-EFFICIENCY.md` | Notification polling, optional dashboard waterfall | Medium |
| `PHASE-04-ROUTE-AND-COMPONENT-SPLITTING.md` | 04A Zod dialogs; 04B ReactFlow modal | Low to medium |
| `PHASE-05-RENDERING-AND-ASSETS.md` | 05A assets; 05B landing/auth boundary | Medium |
| `PHASE-06-VERIFY-AND-REGRESSION.md` | Measurements, regressions, and final reporting | Low to medium |
| `AI-AGENT-REVIEW-PROMPT.md` | Future read-only review prompt | N/A |

## Non-negotiable guardrails

- **Phase 02A (meeting lifecycle):** Do NOT implement track-cleanup rewrites without device-leak/rejoin validation. Treat as investigation + tests first; no bundle claim. Agora subscription/screen-share semantics remain untouched.
- **Phase 02B (lazy Socket.IO):** Dynamic-import `socket.io-client` inside the connection effect only after tracing all consumers; preserve context contract. Do not gate the whole provider.
- **Phase 03 (notifications):** Gate the feed while closed; keep summary polling for the unread badge. Do not change query keys/cache/retry. Dashboard waterfall remains optional with HAR evidence.
- **Phase 05A (assets):** Verify all references (including runtime/public URLs) before deleting any asset; resize logo and add dimensions/priority; add video posters; audit font weights.
- **Phase 05B (landing/auth):** Hypothesis only. Trace each section before converting; do not change auth bootstrap/refresh/redirect semantics without full flow validation. No global removal of `"use client"`.

- No broad refactors or mass rewrites for a small performance gain.
- Do not remove or weaken authentication, organization isolation, role checks, loading states, error handling, accessibility, or meeting functionality.
- Do not change auth bootstrap, refresh, logout, expired-token, redirect, or authorization semantics without tracing all callers.
- Do not change API contracts, query keys, cache freshness, retry behavior, or invalidation behavior without tracing their callers and documenting the reason.
- Do not weaken CSP or data-handling rules.
- Do not change Agora subscription or screen-sharing semantics without lifecycle validation.
- Do not globally remove `"use client"` or convert pages to server components without tracing hooks, browser APIs, context, and event handlers.
- Do not delete assets until repository references and actual usage have been checked.
- Do not add dependencies unless a measured need justifies them.
- Do not treat a successful compile as a successful build. TypeScript and all required build checks must pass.
- Keep every batch small enough to review and revert independently.
- Never edit generated `.next` output.
- Do not read, print, or expose secrets from `.env` files.
