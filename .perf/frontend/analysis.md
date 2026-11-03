Frontend Performance Plan Review (read-only)
No source or plan files were modified. Findings are from source tracing, the existing .next production manifests, build3.log, and tsc; no next build was rerun during review.

1. Repository facts verified
   Area Verified fact
   Framework Next.js 16.2.1, React/React DOM 19.2.4, TanStack Query 5.101.4
   Other key deps Agora 4.24.3, socket.io-client 4.8.3, @xyflow/react 12.12.0, @tanstack/react-table 8.21.3, Zod 4.3.6, Sonner 2.0.7, Zustand 5.0.12
   Scripts build = next build; lint = eslint; test = jest; test:e2e = playwright test
   Config App Router, output: "standalone", CSP headers, no custom images config
   Build Last recorded build (build3.log) succeeded: compile 55s, TS 49s, 50 static pages. .next/BUILD*ID = 04BLFR8HVkIuymHwuwv6d
   Typecheck npx tsc --noEmit --incremental false → exit 0
   Client boundary 485 of 932 src/\**/*.{ts,tsx} files contain "use client"
   Tooling Next 16 built-in next experimental-analyze exists; no extra dependency required
   Route entry JS totals below are raw bytes from page_client-reference-manifest.js, not gzip/transfer size. Dynamic chunks are not included in these totals.
   Route Raw entry JS
   /admin/students 987KB
   /admin/educators 976KB
   /admin/registrars 962KB
   /admin/students/[id] 935KB
   /admin/subjects/hierarchy 805KB
   /admin/students/[id]/hierarchy 757KB
   /admin/dashboard 688KB
   /educator, /student 501KB each
   / landing 314KB
   Confirmed large chunks: Zod 03f0ywctsn4hn.js 265KB; ReactFlow 17.0z-20w*-mb.js 180KB; socket.io + meeting context 0ck~cnsw65lcb.js 47.5KB; Agora 131z2u~m9tmnf.js 1462KB; Sonner 0.op4vv49up_t.js 40.9KB.
2. Current blockers
   No current source/build blocker reproduces.

- The reported .next/dev/types/routes.d.ts syntax error does not reproduce; that generated file is absent.
- The reported screenTrack.close() nullability error is fixed. useAgoraRTC.ts:19-24 defines IScreenVideoTrack; current tsc passes and build3.log completed.
- build.log and build2.log failures are stale: useSeederCard.ts:129 and GradingSchemeEditor.tsx:9; both are absent from the current passing typecheck.
- Only known failing check: frontend/run-phase7b.log has 15 passing E2E tests and 1 failure at frontend/e2e/admin-setup.spec.ts:1497 — class creation returned 409 instead of 201. This is Phase 7b enrollment-fixture/state behavior, not a frontend performance blocker.
- jest --listTests emits a haste warning from .next/standalone/package.json, not a failure.
  Implementation still must start with a fresh npm run build; do not treat the existing .next or historical log as the permanent baseline.

3. Review of each proposed phase
   Phase Verdict Reason
   00 — Baseline Keep, update Replace stale blocker claims. Add the route-manifest measurement above and next experimental-analyze. Record raw route totals before each batch.
   01 — Safe bundle cleanup Keep, narrow; mostly done Devtools/debug panel are already next/dynamic and development-gated in providers.tsx. Production manifest contains only a 0.3KB devtools stub. No further broad cleanup is justified here.
   02 — Meeting dependencies Revise and split Agora is correctly deferred, but socket.io is not. educator/layout.tsx:12-17 and student/layout.tsx:12-17 dynamically load the meeting provider, yet the loader chunk 0cnj_ayb8g6dw.js immediately requests 0ck~cnsw65lcb.js (47.5KB) via Promise.all on every portal route. Also fix lifecycle bugs before claiming meeting work complete. Split into 02A lifecycle correctness and 02B lazy socket client.
   03 — Query/request efficiency Keep, narrow scope Add the confirmed global notification polling. Dashboard waterfall exists but is lower priority. Do not broadly retune cache presets/keys.
   04 — Route/component splitting Keep; promote earlier Strongest confirmed, low-risk wins: Zod on three admin list routes and ReactFlow on student detail. This should run before Phase 02 because it is larger and safer.
   05 — Rendering/assets Keep, but later Add the guest-auth landing gate, unnecessary landing client boundaries, large image/logo assets, and 10 large videos. These are real but higher-effort and need visual/performance validation.
   06 — Verify/regression Keep; strengthen Add route-manifest diff, network-tab checks, and the known E2E 409 baseline.
   Recommended execution order: 00 → 01(verify only) → 04A → 04B → 02A → 02B → 03 → 05 → 06. Keep phase filenames; change the sequence and internal batches.
4. Additional findings
   ID Finding Evidence Confidence Impact Risk Validation
   F1 Zod 265KB is in the initial JS for /admin/students, /admin/educators, /admin/registrars. CreateStudentDialog.tsx:20-25 imports validation.util.ts:1 (zod); educator/registrar dialogs do the same. The dialogs are statically imported but only rendered when open (students/page.tsx:29,295; educators/page.tsx:26,199; registrars/page.tsx:22,192). Manifest confirms 03f0ywctsn4hn.js 265KB on all three. High (manifest-confirmed) High Low Dynamic-import the create dialogs; re-check manifests; exercise create/validation flows. Expected raw entry reduction ~265KB per route; actual removal must be measured.
   F2 socket.io + meeting context loads after hydration on every educator/student route, even without a meeting. useMeetingSocket.ts:2 is a static socket.io-client import. Layout dynamic loaders fetch 0ck~cnsw65lcb.js (47.5KB) at hydration. Agora is correctly deferred only when credentials exist. High for code path/chunk; runtime request not captured Medium Medium Lazy-import socket.io-client inside useMeetingSocket when meetingId/token exist, or gate the provider on an active meeting. Verify non-meeting routes make no 0ck request; verify join/rejoin/chat.
   F3 ReactFlow 180KB is in /admin/students/[id] initial JS although the graph is only shown in a modal. students/[id]/page.tsx:30 statically imports SubjectCompletionPanel; it imports SubjectHierarchyModal (:15), which imports SubjectHierarchyGraph (:6), which imports @xyflow/react (:14). The modal renders only when hierarchy is set (SubjectCompletionPanel.tsx:256). Manifest includes 17.0z-20w\_-mb.js 180KB. High (manifest-confirmed) Medium-high Low Dynamically load the modal/panel; confirm 17.0z leaves the student-detail entry; open the completion tab and hierarchy modal.
   F4 Two notification endpoints poll every 30s for every portal user, and the feed refetches all loaded infinite pages. NotificationDropdown.tsx:31-32 calls both hooks unconditionally; it is mounted by PortalNavbar.tsx:57 → AppShell.tsx:17. useNotifications.ts:188,207 sets refetchInterval: 30000 on summary and feed; feed is useInfiniteQuery. High for code path; request-count timing is hypothesis Medium-high Medium Gate the feed query on dropdown open, or pause it when closed while keeping the summary. Verify unread count, read/read-all, pagination, and network counts.
   F5 Screen-share lifecycle leaks the camera and can leave the user without a camera. useAgoraRTC.ts:236-240 calls cameraTrack.stop() but not close(); track-ended creates a new camera without closing the stopped one (:270-290); cleanup closes only localVideoRef (:163-173); failure after unpublishing camera does not restore it. High (source-confirmed) High for correctness Medium-high Add explicit track close/restore paths; smoke-test share start, stop, browser “Stop sharing,” failure, leave, and rejoin with two participants.
   F6 Guest landing render is blocked on a failing /auth/refresh. page.tsx:35 returns “Loading...” while isLoading; auth.store.ts:26 starts true; useAuthProfile.ts:32-33 calls /auth/refresh when no token; loading clears only after the 401 at :43-46. High for code path; timing is hypothesis Medium-high for LCP/UX Medium-high Measure guest / in network/Lighthouse. Consider rendering landing while bootstrap runs, or skipping refresh on public routes after tracing refresh-cookie behavior. Do not change auth semantics speculatively.
   F7 The landing page is entirely client-rendered at the page level, and several sections declare "use client" despite having no hooks/events. page.tsx is "use client" and imports all sections eagerly. FeaturesSection, Footer, CTASection, Contactadminsection, ResourcesSection, and PricingSection have no useState/useEffect/handlers. Landing entry is 314KB raw with a 54KB section chunk. Medium Medium Medium Convert static sections to server components and isolate the auth redirect in a small client boundary; measure JS/hydration and compare visuals. This is a hypothesis until measured.
   F8 Image/video assets carry avoidable transfer and decode cost. Hero uses raw <img> for desktop-3.png 184KB and mobile-3.png 63KB with no dimensions/priority (HeroSection.tsx). /edutool-yellow.png is 87KB at 2000×2000 but displayed at 44px in navbars/login. /badges/3-badge.png is 2.27MB and unused; /edutool-yellow2.png is 130KB and unused. Ten videos total ~124MB; visible videos use preload="metadata" with no poster. High for sizes; impact hypothesis Medium Low-medium Resize logo, add dimensions/next/image for hero, add posters/preload="none", remove confirmed-unused assets, and measure LCP/network.
   F9 Admin dashboard has a two-stage request waterfall. dashboard/page.tsx:129 loads school years; :134 sets the selected year in an effect; analytics at :148-160 stay disabled until org and selectedYearId exist. Backend can resolve the active year when schoolYearId is omitted (analytics.service.ts:11-16). High for code; impact hypothesis Low-medium Medium Capture a HAR. Possible optimization requires normalizing query keys or using the backend default without causing a duplicate active-year request. Do not include in the first batch.
   F10 Sonner (40.9KB) is mounted globally; useSessionExpiry is dead code. providers.tsx always renders Toaster; useSessionExpiry.ts has zero importers. High Low Low Consider deferring Toaster only after tracing every public/portal toast; delete dead hook in a separate cleanup.
   The admin dashboard’s duplicate useOrganization query is not a duplicate network request: both callers use queryKeys.admin.organization.detail(), so TanStack Query deduplicates. It is redundant code, not a proven performance issue.
5. Revised phase plan
   Batch Scope Prerequisites Exit criteria
6. Baseline Fresh build, typecheck, lint, unit tests, route-manifest snapshot, next experimental-analyze. No code. None Build/typecheck green; route totals recorded; E2E 409 recorded as pre-existing.
7. Safe list-route splitting (Phase 04A) next/dynamic for create dialogs in students/page.tsx, educators/page.tsx, registrars/page.tsx. Keep existing conditional {createOpen && ...} mount. Batch 0 03f0ywctsn4hn.js absent from the three route manifests; create/validation/error flows pass; no behavior change.
8. Student-detail ReactFlow split (Phase 04B) Dynamically load SubjectHierarchyModal or SubjectCompletionPanel in frontend/src/components/admin/student/detail/SubjectCompletionPanel.tsx. Batch 1 17.0z-20w\_-mb.js absent from /admin/students/[id] entry; hierarchy modal still opens and renders.
9. Meeting lifecycle correctness (Phase 02A) Fix camera stop()/close(), restoration after failed screen share, track-ended replacement, and unmount cleanup in useAgoraRTC.ts. Batch 0; meeting smoke environment Two-participant join/leave, camera/mic toggle, screen share stop/restore, navigation-away cleanup. No regressions.
10. Lazy socket client (Phase 02B) Move socket.io-client to a dynamic import inside useMeetingSocket when credentials exist, or gate meeting provider by active meeting. Batch 3 Non-meeting educator/student routes make no socket chunk request; meeting chat/presence/reconnect work.
11. Notification polling (Phase 03) Gate feed polling to dropdown-open state; keep summary polling unless product requirements change. Batch 0 Request count drops when dropdown closed; unread counts, read/read-all, and pagination still work.
    6A. Low-risk assets (Phase 05A) Resize logo; add hero dimensions/next/image; remove confirmed-unused assets; add video posters/preload="none". Batch 0 Visual parity; LCP/network improvement measured; no 404s.
    6B. Landing/auth boundary (Phase 05B) Convert static landing sections to server components; isolate auth redirect; investigate guest refresh blocking. Batch 6A; auth tracing Landing renders without auth refresh blocking for guests; authenticated redirects still work; JS/hydration measured.
12. Dashboard waterfall (optional) Only if HAR confirms material delay. Avoid duplicate active-year fetches. Batch 5 One fewer serial round trip or documented decision to leave as-is.
13. Fonts/dead code cleanup Audit unused weights/geist/useSessionExpiry; remove only with evidence. Batches 1-6 No visual regression; no bundle regression.
14. Do-not-change list

- Do not alter auth bootstrap, refresh, logout, or expired-token semantics without tracing all callers.
- Do not broadly change QUERY_PRESETS, retry, refetchOnWindowFocus, query keys, or invalidation.
- Do not weaken role guards, organization isolation, grading/enrollment/attendance data handling, or CSP.
- Do not change Agora subscription/screen-share semantics until lifecycle tests pass.
- Do not globally remove "use client" or convert pages to server components without tracing hooks/events.
- Do not lazy-load essential above-the-fold landing content or shared primitives without measurement.
- Never edit generated .next output.

7. Validation plan
   Commands, from frontend/:
   npx tsc --noEmit --incremental false
   npm run lint
   npm test -- --runInBand
   npm run build
   npx next experimental-analyze
   Also compare .next/server/app/\*\*/page_client-reference-manifest.js entry chunks before/after each bundle batch. Use browser Network/Lighthouse for:

- Guest /: /auth/refresh timing and landing paint.
- /admin/students, /admin/educators, /admin/registrars: no Zod chunk in initial load; create dialog opens and validates.
- /admin/students/[id]: ReactFlow chunk only after opening hierarchy.
- /educator and /student: no socket chunk on non-meeting routes; meeting join/leave, camera/mic, screen share start/stop.
- Notification dropdown closed/open: 30s requests and unread/read behavior.
- Landing mobile/desktop: images, videos, fonts, no layout shift.
  E2E baseline: 15 passing, 1 known 409 failure in Phase 7b; do not treat that as caused by performance work, but record it.

8. First recommended batch
   Dynamic-import the three admin create dialogs. These dialogs are already conditionally rendered only when open, but their static imports pull Zod (265KB raw) into the initial entry for three high-traffic admin routes.
   Files:

- frontend/src/app/admin/students/page.tsx:29
- frontend/src/app/admin/educators/page.tsx:26
- frontend/src/app/admin/registrars/page.tsx:22
  Change CreateStudentDialog, CreateEducatorDialog, and CreateRegistrarDialog to next/dynamic imports while preserving the existing {createOpen && ...} mount. Then verify the 03f0ywctsn4hn.js chunk leaves each route’s entry manifest and that create/validation/error flows still work.
  Plan-folder files to update
  File Change
  .perf/frontend/README.md Update current status: build/typecheck pass, stale errors resolved; reorder execution to put Phase 04A first; summarize confirmed Zod/ReactFlow/socket findings.
  .perf/frontend/PHASE-00-BASELINE-AND-AUDIT.md Replace stale blocker claims; add exact baseline route table, tsc/build evidence, next experimental-analyze, and manifest-parsing instructions.
  .perf/frontend/PHASE-01-SAFE-BUNDLE-CLEANUP.md Mark devtools work as already implemented with manifest evidence; narrow remaining scope; add production/dev verification.
  .perf/frontend/PHASE-02-MEETING-DEPENDENCIES.md Correct the socket.io assumption; split into 02A lifecycle and 02B lazy socket; add exact useAgoraRTC defects and smoke tests.
  .perf/frontend/PHASE-03-QUERY-AND-REQUEST-EFFICIENCY.md Add notification polling evidence, dashboard waterfall, guest refresh request; clarify organization query deduplication; require HAR evidence before cache changes.
  .perf/frontend/PHASE-04-ROUTE-AND-COMPONENT-SPLITTING.md Add confirmed targets: Zod dialogs and student-detail ReactFlow modal; include measured route sizes and before/after manifest checks.
  .perf/frontend/PHASE-05-RENDERING-AND-ASSETS.md Add landing auth gate, unnecessary section client boundaries, hero/logo dimensions, unused assets, video posters/preload, and font audit; mark as later batch.
  .perf/frontend/PHASE-06-VERIFY-AND-REGRESSION.md Add exact commands, route-manifest diffs, network journeys, and the known Phase 7b 409 baseline.
  .perf/frontend/AI-AGENT-REVIEW-PROMPT.md Optional: add next experimental-analyze and route-manifest inspection to the investigation list; no structural change required.
