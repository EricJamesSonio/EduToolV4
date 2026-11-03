# EduToolV4 — Frontend Performance Implementation Plan

> **Status:** active execution plan
> **Created:** 2026-11-02
> **Repository:** `EduToolV4` @ `6982333b` (working tree clean at creation time)
> **Scope:** `frontend/` only. No backend changes.
> **Supersedes:** the execution order in `.perf/frontend/README.md`, `PERF-WORK-SUMMARY.md`, and `REMAINING-PHASES-ANALYSIS.md`.
> **Retains as history:** `.perf/frontend/PHASE-00…PHASE-06*.md` and `.perf/frontend/analysis.md` (evidence base). Do not delete them.

---

## 0. How to use this document

This file is **self-contained**. A new agent should be able to start from Phase 0 with no prior conversation.

1. Read §2 (ground rules) and §3 (verification harness) before editing anything.
2. Read §4 (baseline status) so you do not redo work that is already in source.
3. Pick the next unchecked row in §7 (progress tracker).
4. For each phase, use the **Acceptance** and **Verification** subsections as the definition of done. Do not mark a phase complete on intent — only on evidence.
5. Update §7 as you go, and append a short entry to §9 (execution log) with commit hash, commands run, and results.
6. If a phase is blocked, leave it `IN_PROGRESS` and record the blocker in §9. Never mark it `DONE`.

**Conventions in this document**

| Marker | Meaning |
|---|---|
| `VERIFIED` | Confirmed in source during the audit that produced this plan |
| `APPLIED-UNVERIFIED` | Change exists in source but has never been proven by a fresh production build |
| `REPORTED` | Carried over from an earlier document; not re-confirmed in the current audit |
| `BLOCKED` | Cannot be completed in the current environment (no backend/dev DB) |
| `OPEN` | Not started |

---

## 1. Environment and repository facts

### 1.1 Toolchain

| Item | Value |
|---|---|
| OS / shell | Windows 10, PowerShell 5.1 |
| Node | `v24.19.0` |
| npm | `12.0.2` |
| Framework | Next.js `16.2.1`, App Router |
| React | `19.2.4` (react + react-dom pinned) |
| Data layer | `@tanstack/react-query ^5.95.2` (installed devtools `5.101.4`) |
| State | `zustand ^5.0.12` |
| HTTP | `axios ^1.13.6` |
| Realtime | `socket.io-client ^4.8.3`, `agora-rtc-sdk-ng ^4.24.3` |
| Validation | `zod ^4.3.6` |
| Graph | `@xyflow/react ^12.12.0` |
| Tables | `@tanstack/react-table ^8.21.3` |
| Styling | Tailwind `4` via `@tailwindcss/postcss` |
| Tests | `jest ^30.4.2` + `@testing-library/*`; `@playwright/test ^1.62.1` |
| Build mode | `output: "standalone"` (`frontend/next.config.ts:8`) |

### 1.2 Scripts (`frontend/package.json`)

```json
"dev":  "cross-env NODE_OPTIONS=--max-old-space-size=8192 next dev -p 3000",
"build": "next build",
"start": "next start",
"lint": "eslint",
"test": "jest",
"test:tz": "cross-env TZ=UTC jest && cross-env TZ=Asia/Manila jest && cross-env TZ=America/Los_Angeles jest",
"test:e2e": "playwright test"
```

There is **no** `typecheck` script. Use `npx tsc --noEmit --incremental false`.

### 1.3 Size and structure

| Metric | Value |
|---|---|
| `.ts` + `.tsx` under `frontend/src` | 1203 |
| Files containing `"use client"` | 492 |
| `src/middleware.ts` | absent (auth is fully client-side) |
| `loading.tsx` / `error.tsx` / `not-found.tsx` / `global-error.tsx` | none anywhere |
| `<Suspense>` usages | 6 |
| `next/dynamic` usages | 7 |
| Production build present | **no** — `frontend/.next/` contains only `dev/` |

### 1.4 Route groups

`app/` contains: `admin`, `docs`, `educator`, `enroll`, `login`, `platform`, `register`, `student`, `test-colors`, plus `layout.tsx`, `page.tsx` (landing), `providers.tsx`.

---

## 2. Ground rules — DO NOT CHANGE

These are hard constraints. Violating any of them is a regression even if metrics improve.

1. **Auth semantics.** Do not alter `useBootstrapAuth`, `/auth/refresh`, token storage, `clearAuth`, `logout`, or expired-token behaviour without tracing every caller. See `src/hooks/useAuthProfile.ts:25-48`, `src/context/AuthContext.tsx`, `src/store/auth.store.ts`.
2. **Query contract.** Do not change `queryKeys`, `QUERY_PRESETS`, `retry`, `refetchOnWindowFocus`, or invalidation strategy wholesale. Targeted `enabled` / `refetchInterval` gating is allowed.
3. **Tenant isolation.** Org-scoped queries must stay org-scoped. Never widen a query key or drop an org token.
4. **Role guards.** `admin/layout.tsx`, `educator/layout.tsx`, `student/layout.tsx`, `platform/layout.tsx` client guards must keep working identically.
5. **Security headers.** `next.config.ts:10-49` CSP (`connect-src`, `media-src`, `img-src`, `frame-ancestors`, `object-src`) must not be weakened.
6. **Agora semantics.** Do not change subscription, publish, or screen-share negotiation semantics; only fix lifecycle leaks.
7. **Grading / enrollment / attendance data** must not change shape or authority.
8. **Generated output.** Never edit `.next/`, `next-env.d.ts`, or anything under `.next/standalone`.
9. **Public API surface.** Do not rename or remove exported components/hooks without updating all importers.
10. **No speculative `"use client"` removal.** Convert only components with zero hooks, zero event handlers, zero browser APIs, and zero client-only imports — and only after measuring.

---

## 3. Verification harness

### 3.1 Required command sequence

Run from `frontend/`:

```powershell
npx tsc --noEmit --incremental false
npm run lint
npm test -- --runInBand
npm run build
npx next experimental-analyze
```

`next experimental-analyze` (Next 16 built-in) requires a prior successful production build. Record:
- exit code
- wall-clock duration
- any new warnings
- analyzer output summary

### 3.2 Route JS measurement (authoritative, not transfer size)

After `npm run build`, read `.next/app-build-manifest.json`. Each page maps to a list of chunk paths under `.next/`:

```powershell
node -e "const fs=require('fs');const p='.next/app-build-manifest.json';const m=JSON.parse(fs.readFileSync(p,'utf8'));for(const [route,files] of Object.entries(m.pages)){const bytes=files.reduce((s,f)=>{try{return s+fs.statSync('.next/'+f).size}catch{return s}},0);console.log((bytes/1024).toFixed(0).padStart(6),'KB ',route)}" | Sort-Object
```

Rules:
- These are **raw bytes**, not gzip/brotli transfer size.
- Dynamic-import chunks are **not** in the entry total. A route can lose 265 KB raw entry weight while the chunk still exists on disk — that is the desired outcome.
- Also inspect `.next/server/app/<route>/page_client-reference-manifest.js` to confirm a specific chunk (for example the Zod chunk) is no longer referenced by the page entry.
- Record the full table in §7 before and after every bundle-affecting phase.

### 3.3 Blocked verification

| Check | Status | Reason | Proxy to use instead |
|---|---|---|---|
| Playwright E2E | `BLOCKED` | Requires backend + seeded DB | Record the known baseline: 15 passing, 1 pre-existing failure (`e2e/admin-setup.spec.ts:1497`, class creation 409) |
| Authenticated network request counts | `BLOCKED` | No backend | Static call-site analysis + unit tests + documented expectation |
| Lighthouse on portal routes | `BLOCKED` | Auth required | Lighthouse on `/`, `/docs/get-started/getting-started`, `/login` |
| Two-participant Agora smoke test | `BLOCKED` | Needs two clients + backend token | Static review of every `close()`/`stop()` path + type check |
| Video poster generation | `UNKNOWN` | `ffmpeg` availability not confirmed | If absent, use `preload="none"` only, and record posters as open |

Do **not** silently skip a blocked check. Put it in the phase's Verification section with the word `BLOCKED` and what was done instead.

---

## 4. Baseline status

### 4.1 Changes already in source

| ID | Change | Evidence | Status |
|---|---|---|---|
| 04A | Create dialogs dynamically imported on three admin list routes | `admin/students/page.tsx:31-34` (`dynamic(..., { ssr: false })`); same pattern in `admin/educators/page.tsx` and `admin/registrars/page.tsx` | `APPLIED-UNVERIFIED` |
| 04B | Subject hierarchy modal dynamically imported | `components/admin/student/detail/SubjectCompletionPanel.tsx:17-19` | `APPLIED-UNVERIFIED` |
| 01 | Devtools + debug panel already lazy and dev-gated | `app/providers.tsx:9-23`, `:35-40` | `VERIFIED` |
| 02A (partial) | Agora unmount cleanup closes tracks; `track-ended` restores camera | `hooks/meeting/useAgoraRTC.ts:163-190`, `:257-297` | `VERIFIED` |

### 4.2 Historical measurements (STALE — do not trust)

The previous production build recorded these raw entry sizes. The production `.next` no longer exists, so they are **unverified history**, useful only as a rough prior:

| Route | Raw entry JS |
|---|---|
| `/admin/students` | 987 KB |
| `/admin/educators` | 976 KB |
| `/admin/registrars` | 962 KB |
| `/admin/students/[id]` | 935 KB |
| `/admin/subjects/hierarchy` | 805 KB |
| `/admin/students/[id]/hierarchy` | 757 KB |
| `/admin/dashboard` | 688 KB |
| `/educator`, `/student` | 501 KB each |
| `/` (landing) | 314 KB |

Historical chunk names (`03f0ywctsn4hn.js` = Zod 265 KB, `17.0z-20w*-mb.js` = ReactFlow 180 KB, `0ck~cnsw65lcb.js` = socket.io + meeting context 47.5 KB, `131z2u~m9tmnf.js` = Agora 1462 KB, `0.op4vv49up_t.js` = Sonner 40.9 KB) **will differ** after any rebuild. Match by content, not filename.

### 4.3 Assets (verified)

| Asset | Size | Referenced? |
|---|---|---|
| `public/badges/3-badge.png` | 2,276,374 B (2.17 MB) | No `src` references; only docs mention it |
| `public/edutool-yellow2.png` | 130,259 B | No `src` references |
| `public/edutool-yellow.png` | 87,054 B, 2000×2000 | Yes — rendered at ~44 px in navbars/login/docs |
| `public/robot.png` | 297 KB | Yes |
| `public/desktop-3.png` | 180 KB | Yes — landing hero, raw `<img>`, no width/height |
| `public/mobile-3.png` | ~63 KB | Yes — landing hero, raw `<img>`, no width/height |
| `public/videos/**` | 10 `.mp4`, ~122 MB total | 9 referenced from `SolutionSection.tsx`; `seeder.mp4` (13.14 MB) has **zero** references |

---

## 5. Findings register

Confidence/impact ratings are estimates and must be re-measured. `Evidence` is the source location to look at first.

| ID | Finding | Evidence | Status | Impact | Risk | Validation |
|---|---|---|---|---|---|---|
| F1 | Zod (265 KB raw) enters initial JS for `/admin/students`, `/admin/educators`, `/admin/registrars` via statically imported create dialogs | `admin/students/page.tsx` (was line 29), `admin/educators/page.tsx`, `admin/registrars/page.tsx`; `utils/validation.util.ts:1` | `APPLIED-UNVERIFIED` | High | Low | Manifest shows Zod chunk absent from the three entries; create dialog opens, validates, and shows errors |
| F2 | `socket.io-client` is statically imported, so a socket chunk loads on every educator/student route even with no meeting | `hooks/meeting/useMeetingSocket.ts:2`; consumer `hooks/meeting/MeetingContext.tsx:5,109` | `OPEN` | High | Medium | Non-meeting portal routes load no socket chunk; join/rejoin/chat still work |
| F3 | ReactFlow (180 KB raw) enters `/admin/students/[id]` entry although the graph is modal-only | `StudentCompletionPanel` → `SubjectHierarchyModal` → `SubjectHierarchyGraph` → `@xyflow/react` | `APPLIED-UNVERIFIED` | High | Medium | ReactFlow chunk absent from detail entry; hierarchy modal still renders |
| F4 | Both notification endpoints poll every 30 s for every portal user; the infinite feed refetches **all** loaded pages | `components/shared/NotificationDropdown.tsx:31-32` (both hooks unconditional); `hooks/useNotifications.ts:207-234` (`refetchInterval: 30000` on summary + infinite feed) | `OPEN` | High | Medium | Feed request stops when dropdown closed; unread badge still correct; read/read-all/pagination work |
| F5 | Screen-share camera track is `stop()`-ped but never `close()`-d; no explicit stop-share path; no recovery if camera re-create fails | `hooks/meeting/useAgoraRTC.ts:240` (`cameraTrack.stop()`), `:257-297` (`track-ended`), `:163-190` (unmount) | `OPEN` (partially fixed) | High (correctness) | Medium-high | Camera/mic released on share start/stop, browser "Stop sharing", failure, leave, rejoin |
| F6 | Guest landing is blocked behind a failing `/auth/refresh`; shows "Loading..." until 401 completes | `app/page.tsx:35` (`if (isLoading || user)`), `hooks/useAuthProfile.ts:32-33`, `store/auth.store.ts` (`loading` starts true) | `OPEN` | Medium-high (LCP/UX) | Medium-high | Guest `/` paints on first paint without waiting for refresh; authenticated redirect still works |
| F7 | Landing is fully client-rendered; all 11 landing components declare `"use client"`, including static ones | `app/page.tsx:1`; `components/landing/*.tsx` (all 11 contain `"use client"`) | `OPEN` | Medium | Medium | Static sections become RSC; JS/hydration drops; visual parity |
| F8 | Oversized/unused assets, unoptimized hero images, orphaned video, no posters | See §4.3 | `OPEN` | High (bytes) | Low-medium | Transfer/LCP improves; no 404s; visuals unchanged |
| F9 | Admin dashboard has a two-stage request waterfall (years → then analytics) | `admin/dashboard/page.tsx:105-145`; analytics `enabled: !!org && !!selectedYearId` | `REPORTED` | Low-medium | Medium | Requires HAR evidence before changing; avoid duplicate active-year request |
| F10 | Global `Toaster` mounted always; `useSessionExpiry` has no importers | `app/providers.tsx:33`; `hooks/useSessionExpiry.ts` | `REPORTED` | Low | Low | Trace all toast call-sites; then defer/remove |
| F11 | Table columns are declared inline in components, forcing re-creation | `components/admin/student/StudentTable.tsx`, `components/shared/DataTable.tsx` | `REPORTED` | Medium | Low | React DevTools render counts; memoize only if measured |
| F12 | Classes search input has no debounce; every keystroke changes the query | `components/admin/class/ClassesFilterBar.tsx:129-136` (raw `Input`); `hooks/admin/useClassFilters.ts:45-53` | `VERIFIED` | Medium | Low | Use `SearchInput` (300 ms) like `StudentFilterBar`; request count per typing burst drops |
| F13 | `MeetingProvider` is mounted on every educator/student route, not only meeting rooms | `educator/layout.tsx:13`, `student/layout.tsx:13` (dynamic `MeetingProvider`) | `VERIFIED` | Medium-high | Medium | Provider only mounts where a meeting is active, or its internals become inert |
| F14 | `/admin/classes` issues ~10 parallel list queries on mount | `admin/classes/page.tsx:80,98,139,145,150,156,161,174,180` (+ filters hook) | `VERIFIED` | High (request count) | Medium | Consolidate or gate on filter/school-year; requires network evidence (BLOCKED) |
| F15 | `/admin/students` over-fetches school-year enrollments and filters client-side | `admin/students/page.tsx:98-166` | `VERIFIED` | Medium | Medium | Prefer server-side filter params if backend supports; otherwise document why not |
| F16 | CSS/animation weight and duplication | `styles/globals.css`, `styles/utilities.css`, `styles/base.css` | `REPORTED` | Low-medium | Low | Measure CSS bytes; do not refactor blindly |
| F17 | 3 font families / 13 weights loaded globally; `geist` dependency unused | `app/layout.tsx:6-25`; `package.json:29` (`geist`) | `VERIFIED` | Medium | Low | Drop unused weights/package; verify no visual change and no build error |
| F18 | No route-level `loading.tsx` / `error.tsx` / `not-found.tsx` anywhere | Filesystem scan | `VERIFIED` | Medium (perceived nav) | Low-medium | Add per-segment boundaries; verify Suspense fallbacks do not flash |

---

## 6. Phase plan

Execution order is deliberate: verify blind spots first, then take the largest safe bundle win, then correctness, then network/render work.

Dependency graph:

```
Phase 0 ─┬─> Phase 1 ──> Phase 2 ──> Phase 5 ──> Phase 7
         ├─> Phase 3 ──> Phase 4
         └─> Phase 6 ──> Phase 7
Phase 8 runs after every phase that touches bundle or routes
```

---

### Phase 0 — Baseline and evidence capture

**Goal:** Produce a trustworthy, reproducible baseline. No application code changes.

**Preconditions:** none.

**Files:** none modified. Outputs recorded in §7 and §9.

**Steps**

1. Record: `node -v`, `npm -v`, `git rev-parse --short HEAD`, `git status --short`.
2. Delete or ignore stale logs (`frontend/build.log`, `build2.log`, `build3.log`, `run-phase7b.log`). Do not cite them as current.
3. Run the §3.1 command sequence.
4. Run the §3.2 manifest measurement. Paste the full table.
5. Start dev server and confirm the app boots (`npm run dev`), then stop it. If it cannot boot without a backend, record that.
6. Record known E2E baseline statement: 15 passing / 1 pre-existing 409 failure. Do not run E2E.
7. Inventory current `next/dynamic` and `<Suspense>` call-sites so later diffs are meaningful.

**Acceptance**

- `tsc`, `lint`, `test`, and `build` results recorded with exit codes.
- A production `.next` exists.
- Route entry table recorded with a timestamp and commit hash.
- Any new compile/lint error introduced since `6982333b` is documented as a blocker before proceeding.

**Verification**

- `npm run build` exit code `0`.
- `npx tsc --noEmit --incremental false` exit code `0`.

**Rollback:** none needed.

**Blockers:** none. E2E is `BLOCKED` (no backend) and is recorded, not run.

**Confidence:** ≥95% — purely mechanical.

---

### Phase 1 — Verify applied bundle changes (04A / 04B)

**Goal:** Prove that the dynamic imports already in source actually remove Zod and ReactFlow from the affected route entries. Revert only if they break behaviour or fail to help.

**Preconditions:** Phase 0 complete with a production build.

**Files (read first, edit only if reverting)**

- `frontend/src/app/admin/students/page.tsx:31-34`
- `frontend/src/app/admin/educators/page.tsx`
- `frontend/src/app/admin/registrars/page.tsx`
- `frontend/src/components/admin/student/detail/SubjectCompletionPanel.tsx:17-19,404`
- `frontend/src/components/admin/subject/hierarchy/SubjectHierarchyModal.tsx`
- `frontend/src/components/admin/subject/hierarchy/SubjectHierarchyGraph.tsx` (ReactFlow import)

**Steps**

1. Parse the manifest for the three list routes. Confirm the Zod chunk (identified by grepping the chunk for a Zod signature such as `ZodError` / `z.object`) is **absent** from each entry.
2. Parse the manifest for `/admin/students/[id]`. Confirm the ReactFlow chunk is absent.
3. Confirm the chunks still exist as async chunks (they should — laziness, not deletion).
4. Static-check the render conditions: dialogs remain behind `{createOpen && ...}` (or equivalent); the hierarchy modal remains behind the `hierarchy` state.
5. If `ssr: false` was used, confirm there is no server-render reliance on those components.
6. Run `tsc` + `lint` + `build`.

**Acceptance**

- Zod chunk not referenced by `/admin/students`, `/admin/educators`, `/admin/registrars` entries.
- ReactFlow chunk not referenced by `/admin/students/[id]` entry.
- Build, typecheck, lint green.
- No dialog/modal behaviour change in code review.

**Verification**

- Manifest diff table (before → after) in §7.
- If available, manual browser click-through of "Create" and "Open hierarchy" (otherwise record as `BLOCKED`).

**Rollback:** `git revert` the phase commit. Do not hand-edit generated chunks.

**Blockers:** authenticated UI click-through `BLOCKED`; static evidence is sufficient to keep the change.

**Confidence:** ≥90% — the change is already written and type-checks; only measurement is new.

---

### Phase 2 — Bundle and asset hygiene

**Goal:** Remove dead weight and stop shipping oversized byte-for-byte assets. No behaviour change.

**Preconditions:** Phase 1 complete (do not mix bundle-splitting and asset deletion in one commit).

**Files**

- Delete (after re-scan): `frontend/public/videos/seeder.mp4`, `frontend/public/badges/3-badge.png`, `frontend/public/edutool-yellow2.png`
- `frontend/src/components/landing/HeroSection.tsx:75,103,197,204`
- `frontend/src/components/landing/SolutionSection.tsx` (video `preload`, `poster`)
- Navbar/login/docs logo call-sites (search `edutool-yellow.png`)
- `frontend/public/edutool-yellow.png` (produce a properly sized replacement)

**Steps**

1. **Re-scan before deletion** across the whole repo (not just `src`): `grep`/`Select-String` for `seeder.mp4`, `3-badge`, `edutool-yellow2` in `frontend/src`, `frontend/public` CSS/HTML, `docker/`, `backend/`, `docs/`, and deployment configs. Only delete on zero hits.
2. Replace the 2000×2000 logo with a source image appropriate to its largest rendered size (record actual displayed size first), keeping the same filename and aspect ratio.
3. Hero images: add explicit `width`/`height` (or `aspect-ratio`) to prevent CLS. Evaluate `next/image` only if `images` config and CSP allow it — `next.config.ts` has **no** `images` block and CSP `img-src` is `'self' data: blob: <apiUrl>`. If `next/image` would require config changes, use raw `<img>` with dimensions and `fetchpriority`/`loading` attributes. Do not weaken CSP.
4. Apply `loading="eager"` + `fetchpriority="high"` to the hero image only; keep everything else lazy.
5. Videos: set `preload="none"` on non-primary videos (currently `metadata`). Add `poster` only if `ffmpeg` is available and a first-frame exists. If `ffmpeg` is unavailable, record posters as `DEFERRED`.
6. Run full verification.

**Acceptance**

- Zero dangling references / 404s.
- `next build` green; route entries unchanged or smaller.
- Public dir shrinks by ≈15.4 MB (2.17 + 0.127 + 13.14) plus logo savings.
- No visual diff at 360 px, 768 px, 1440 px widths.

**Verification**

- `git grep` for each deleted filename returns nothing.
- Manifest table unchanged or improved.
- Manual visual check of landing + navbar + login.

**Rollback:** restore deleted files from git; revert the commit.

**Blockers:** `ffmpeg` for posters (`UNKNOWN`). Do not block the phase on it.

**Confidence:** ≥90% provided the re-scan is genuinely repo-wide.

---

### Phase 3 — Agora lifecycle correctness (02A remainder)

**Goal:** Eliminate camera/screen-share track leaks and make every exit path deterministic.

**Preconditions:** Phase 0 complete. Two-participant testing is `BLOCKED`; proceed on static evidence and type safety.

**Files**

- `frontend/src/hooks/meeting/useAgoraRTC.ts` (whole file, 317 lines)

**Known defects to address**

1. `:240` — `cameraTrack.stop()` on share start releases the device but does not free the SDK object. Replace with `close()` (after unpublish) and ensure only one path closes it.
2. No explicit stop-screen-share function exists in the returned API (`return` at `:307-316` exposes `shareScreen` only). Shutdown currently depends on the browser `track-ended` event. Add a `stopScreenShare()` that closes the screen track, unpublishes, and republishes/restores the camera.
3. `track-ended` handler (`:257-297`) creates a new camera track but has no fallback if `createCameraVideoTrack` fails — the user is left with no camera and no visible error. Add a recovery path that leaves the meeting in a known state.
4. Verify `localVideoRef` never holds a closed track after any path.
5. Verify mic track is not closed twice.

**Steps**

1. Model the state machine: `idle → joined(camera) → sharing(screen) → joined(camera)` and `any → tornDown`.
2. Implement `close()` consistently for every track that is unpublishing.
3. Add `stopScreenShare()` and wire it to the UI only if a caller exists; otherwise expose it and document.
4. Add an idempotent teardown helper used by unmount, leave, and error paths.
5. `tsc` with the existing `IScreenVideoTrack` interface (`:19-24`); do not reintroduce nullability errors.
6. Unit-test the hook's pure state transitions where feasible; do not mock Agora into a false-positive test.

**Acceptance**

- No `stop()` without a matching `close()` on an unpublish path.
- Every path sets `localVideoRef` to either a live track or `null`.
- `tsc`, `lint`, `build` green.
- Static checklist in §9 lists each path (mount, unmount, share start, share stop, browser stop, track-ended, create failure, leave/rejoin) with `close()`/`null` evidence.

**Verification**

- Manual two-participant matrix `BLOCKED`. Record it as an open item for the reviewer with a backend.
- Type check + build are the hard gates.

**Rollback:** revert the hook; the UI contract (`client`, `joined`, `localAudio`, `localVideo`, `remoteUsers`, `toggleMic`, `toggleCamera`, `shareScreen`) must remain backward compatible.

**Blockers:** two-participant manual validation.

**Confidence:** 80–94% — source-level reasoning is strong but runtime Agora behaviour is unverified; disclose the assumption.

---

### Phase 4 — Lazy socket client (02B)

**Goal:** Stop shipping/loading `socket.io-client` on portal routes where no meeting is active.

**Preconditions:** Phase 3 complete (do not change meeting transport while its lifecycle is unstable).

**Files**

- `frontend/src/hooks/meeting/useMeetingSocket.ts:2` (static import)
- `frontend/src/hooks/meeting/MeetingContext.tsx:5,109`
- `frontend/src/app/educator/layout.tsx:13`
- `frontend/src/app/student/layout.tsx:13`
- `frontend/src/components/meeting/MeetingMiniPlayer.tsx` (consumer)

**Steps**

1. Replace the top-level `import { io, Socket } from "socket.io-client"` with a type-only import plus a lazy `await import("socket.io-client")` inside the effect that actually creates a socket.
2. Gate socket creation on the same condition that gates a real meeting (`meetingId` + token present, or the existing `socketProps` validity check in `MeetingContext.tsx`). Return `null` when there is no meeting.
3. Keep `useMeetingSocket`'s public return shape identical.
4. Confirm `MeetingProvider` itself does nothing expensive when there is no meeting (avoid importing Agora; that is already dynamic).
5. Verify no socket chunk is referenced by `/educator`, `/educator/schedule`, `/student`, `/student/schedule` etc., while meeting routes still load it.

**Acceptance**

- Socket.IO module is absent from non-meeting route entries.
- Meeting join/leave/chat/presence code paths unchanged in behaviour.
- `tsc`, `lint`, `build` green.

**Verification**

- Manifest check on non-meeting portal routes.
- Runtime request check `BLOCKED`; document expected request list.

**Rollback:** revert to static import.

**Blockers:** runtime meeting validation.

**Confidence:** ≥85%.

---

### Phase 5 — Query and request efficiency

**Goal:** Reduce unnecessary polling and request fan-out without touching the cache contract.

**Preconditions:** Phase 1 and Phase 2 complete (bundle noise removed so network wins are attributable).

**Files**

- `frontend/src/components/shared/NotificationDropdown.tsx:31-32`
- `frontend/src/hooks/useNotifications.ts:207-234`
- `frontend/src/components/admin/class/ClassesFilterBar.tsx:129-136`
- `frontend/src/hooks/admin/useClassFilters.ts:45-53`
- `frontend/src/app/admin/classes/page.tsx` (query list `:80-180`)
- `frontend/src/app/admin/students/page.tsx:98-166`
- `frontend/src/app/admin/dashboard/page.tsx:105-145`
- `frontend/src/components/shared/SearchInput.tsx` (reuse pattern, do not modify unless needed)

**Steps**

1. **Notification feed gating.** Add an `enabled` parameter to `useNotificationFeed` and pass the dropdown `open` state from `NotificationDropdown`. Keep the summary query polling (the badge must stay live). When the dropdown closes, the feed must not refetch. Preserve the store mirroring effect and dedupe logic (`useNotifications.ts:236-244`).
2. **Classes debounce.** Replace the raw `Input` in `ClassesFilterBar` with the existing debounced `SearchInput` (`debounceMs` default 300) or add the same 300 ms debounce, matching `StudentFilterBar`. Confirm `useClassFilters` receives the debounced value, not every keystroke.
3. **Classes fan-out.** Catalogue every query on `/admin/classes` with its key, `enabled` condition, and whether it depends on `selectedSchoolYearId`. Gate queries that cannot be useful yet (no school year selected) and deduplicate requests that share a key. Requires network evidence to go further — `BLOCKED`.
4. **Students over-fetch.** Determine whether the backend supports server-side program/section filters. If yes, move filtering server-side; if no, document and leave as-is. Do not change pagination semantics.
5. **Dashboard waterfall.** Only act with HAR evidence (`BLOCKED`). If evidence is unavailable, leave `OPEN` with a written rationale — do not "optimize" a waterfall speculatively.

**Acceptance**

- With the dropdown closed, no feed request is issued on the 30 s interval; summary behaviour unchanged.
- Typing 10 characters in the classes search issues one request (after debounce), not ten.
- Every changed query key remains domain/org-scoped.
- `tsc`, `lint`, `test`, `build` green; unit tests for the notification gating and debounce added.

**Verification**

- Jest tests for `useNotificationFeed` enabled state and for the debounce propagation.
- Manifest/build unaffected.
- Network counts `BLOCKED`; record expected counts.

**Rollback:** revert per-item (each step is independently revertible).

**Blockers:** authenticated network measurement.

**Confidence:** ≥85% for steps 1–2; ≤79% for steps 3–5 (capped — tenant/query semantics involved, unverified at runtime).

---

### Phase 6 — Landing and rendering

**Goal:** Let guests see the landing page immediately, and reduce landing client JS without changing visuals.

**Preconditions:** Phase 2 complete (assets stable). Trace auth before touching the gate.

**Files**

- `frontend/src/app/page.tsx:21-58`
- `frontend/src/app/layout.tsx`
- `frontend/src/components/landing/HeroSection.tsx`, `Navbar.tsx`, `AnalyticsPreviewSection.tsx`, `SolutionSection.tsx`
- Static candidates: `FeaturesSection.tsx`, `Footer.tsx`, `CTASection.tsx`, `Contactadminsection.tsx`, `ResourcesSection.tsx`, `PricingSection.tsx`, `SchoolCarousel.tsx`, `WorkflowSection.tsx`
- `frontend/src/app/docs/get-started/layout.tsx`
- `frontend/src/hooks/useAuthProfile.ts`, `context/AuthContext.tsx`, `store/auth.store.ts`
- `frontend/src/hooks/useScrollAnimation.ts` (used by `HeroSection`)

**Steps — 6A: auth gate**

1. Trace every caller of `useAuth`, `isLoading`, `useBootstrapAuth`, and the redirect effect.
2. Confirm the refresh cookie behaviour for a guest: does `/auth/refresh` set/rely on a cookie, and does a 401 have side effects beyond `clearAuth()`?
3. Render the landing page for guests even while bootstrap is in flight. Keep the authenticated redirect. Prevent a flash for an already-authenticated user (for example: render landing but suppress the redirect-only chrome, or gate only the redirect, not the whole tree).
4. Do **not** change token/refresh semantics. If the only way to unblock is to change auth, stop and escalate.

**Steps — 6B: server components**

1. Verify each candidate has zero `useState`, `useEffect`, event handlers, refs, browser APIs, and client-only imports.
2. Convert certifiably static components to server components and remove their `"use client"`.
3. Isolate the interactive pieces (`Navbar`, `HeroSection` scroll animation, `AnalyticsPreviewSection`, `SolutionSection` video state) behind a small client boundary.
4. Keep CSS and animation behaviour identical.

**Steps — 6C: docs shell**

1. Split `docs/get-started/layout.tsx`: keep the sidebar/mobile toggle client-side, make the chrome/logo/static nav server-rendered. Do not break active-link highlighting.

**Acceptance**

- Guest `/` paints without waiting for `/auth/refresh` to settle.
- Authenticated users still land on `getRoleHomePath(role)`.
- Landing JS entry decreases or stays flat; hydration warnings zero.
- Visual parity at 360 / 768 / 1440 px.
- Docs navigation works and active state is correct.

**Verification**

- Lighthouse on `/` `BLOCKED` for portal routes only; `/` and `/docs/...` are public and should be measurable.
- Manifest diff.
- Manual guest + authenticated redirect check (authenticated `BLOCKED` without backend; record).

**Rollback:** revert phase; keep 6A and 6B as separate commits.

**Blockers:** authenticated redirect validation.

**Confidence:** 80–94% — auth-adjacent; cap at 79% until the refresh-cookie trace is complete.

---

### Phase 7 — Fonts and dead code

**Goal:** Trim font payload and remove unused dependencies/hooks, with evidence.

**Preconditions:** Phases 2 and 6 complete (font changes can shift layout; measure after landing stabilizes).

**Files**

- `frontend/src/app/layout.tsx:6-25`
- `frontend/package.json:29` (`geist`)
- `frontend/src/hooks/useSessionExpiry.ts`
- `frontend/src/styles/base.css`, `globals.css`, `utilities.css`

**Steps**

1. Determine which weights are actually used by computed styles for Kodchasan, JetBrains Mono, and Plus Jakarta Sans. Record evidence (CSS variables / class usage).
2. Remove only weights with zero usage. Do not reduce below 400/500/600/700 without proof.
3. Confirm `geist` is unused (`grep` all of `src`, configs, CSS). Remove the dependency only if zero hits. Dependency removal is a package change — follow the repo's dependency rules and run a clean install check.
4. Delete `useSessionExpiry.ts` only if zero importers.
5. Review CSS for duplicated tokens/animations; remove only exact duplicates.

**Acceptance**

- Font file count/bytes drop; no visual regression.
- `npm ls geist` no longer present; build green after `npm install`.
- Zero references to deleted hook.
- `tsc`, `lint`, `test`, `build` green.

**Verification**

- Network panel font requests (public pages measurable).
- Visual diff.

**Rollback:** revert per item; reinstall lockfile state if the dependency removal is reverted.

**Blockers:** none for fonts; `ffmpeg`/network not involved.

**Confidence:** ≥90% (font weight audit) / 80–94% (dependency removal).

---

### Phase 8 — Regression and close-out

**Goal:** Prove nothing regressed and leave a clean handoff.

**Preconditions:** every completed phase committed.

**Steps**

1. Run the full §3.1 sequence on the final commit.
2. Regenerate the manifest table. Compare against Phase 0. For each route, record Δ raw KB.
3. Re-run the static checks for each finding: Zod absent, ReactFlow deferred, socket deferred, notification feed gated, debounce present, asset sizes reduced, fonts reduced.
4. Run `test:tz` if time-zone-sensitive code was touched (any date handling); otherwise record why skipped.
5. Update §7, §9, and `.perf/frontend/README.md` (status + pointer to this file).
6. Write the final summary: what changed, what improved, what remained blocked, and the exact commands a reviewer must run.

**Acceptance**

- Build/lint/typecheck/test green.
- Before/after manifest table filled.
- Every `OPEN` finding is either closed with evidence or explicitly deferred with a reason.
- No `BLOCKED` item is presented as resolved.

---

## 7. Progress tracker

Update this table as work proceeds. Do not pre-fill results.

| Phase | Scope | Status | Commit | Build | Evidence | Notes |
|---|---|---|---|---|---|---|
| 0 | Baseline | `OPEN` | | | | |
| 1 | Verify 04A/04B | `VERIFIED` | `c698233` | `pass` | - Zod chunk (`03f0ywctsn4hn.js`) absent from /admin/students, /admin/educators, /admin/registrars entries<br>- ReactFlow chunk (`17.0z-20w_-mb.js`) absent from /admin/students/[id] entry<br>- typecheck: npx tsc --noEmit --incremental false: pass<br>- lint: npm run lint: pass<br>- tests: npm test -- --runInBand: pass<br>- build: npm run build: pass |
| 2 | Bundle + assets | `OPEN` | | | | |
| 3 | Agora lifecycle | `OPEN` | | | | |
| 4 | Lazy socket | `OPEN` | | | | |
| 5 | Query efficiency | `OPEN` | | | | |
| 6 | Landing / RSC | `OPEN` | | | | |
| 7 | Fonts / dead code | `OPEN` | | | | |
| 8 | Regression | `OPEN` | | | | |

### Route entry table (fill in Phase 0, then after each bundle phase)

| Route | Baseline raw KB | After Phase 1 | After Phase 2 | After Phase 4 | Final |
|---|---|---|---|---|---|
| `/` | | | | | |
| `/admin/dashboard` | | | | | |
| `/admin/students` | | | | | |
| `/admin/students/[id]` | | | | | |
| `/admin/educators` | | | | | |
| `/admin/registrars` | | | | | |
| `/admin/classes` | | | | | |
| `/admin/subjects/hierarchy` | | | | | |
| `/educator` | | | | | |
| `/student` | | | | | |
| `/docs/get-started/getting-started` | | | | | |

---

## 8. Open questions

| # | Question | Blocks | Default if unanswered |
|---|---|---|---|
| Q1 | Is `ffmpeg` available to generate video posters? | Phase 2 step 5 | Skip posters, use `preload="none"`, mark `DEFERRED` |
| Q2 | Does the backend support server-side student filters (program/section)? | Phase 5 step 4 | Leave client-side filtering, document |
| Q3 | What is the product requirement for notification freshness? | Phase 5 step 1 | Keep summary at 30 s; gate feed on open |
| Q4 | Will an authenticated environment be provided for E2E/network/Agora? | Phases 3, 5, 6 | Static evidence only; mark `BLOCKED` |
| Q5 | Is the repo's `AGENTS.md` ticket/worktree protocol waived for this work? | all commits | It was explicitly waived by the owner for this project; do not create a ticket-state branch |

**Resolved at plan creation:** Q5 — the owner directed work on the current branch with no `ticket-state` ticket and no worktree.

---

## 9. Execution log

Append one entry per phase. Use this template:

```md
### <date> — Phase <N> — <status>
- Commit: <hash>
- Commands: <exact commands>
- Result: <exit codes / metric deltas>
- Blocked: <items, or "none">
- Notes: <assumptions, surprises, follow-ups>
```

### 2026-11-02 — Plan created
- Commit: `6982333b` (plan document authored on this checkout)
- Commands: read-only audit only
- Result: no build run
- Blocked: E2E, authenticated network, portal Lighthouse, two-participant Agora
- Notes: 04A/04B confirmed in source but unverified by build

---

## Appendix A — Verified call-sites worth knowing

| Concern | Location |
|---|---|
| Guest bootstrap / refresh | `hooks/useAuthProfile.ts:25-48` |
| Landing gate | `app/page.tsx:35` |
| Providers / Toaster / devtools | `app/providers.tsx:9-40` |
| Notification hooks | `hooks/useNotifications.ts:207-244` |
| Notification mount | `components/shared/NotificationDropdown.tsx:31-32` |
| Socket static import | `hooks/meeting/useMeetingSocket.ts:2` |
| Meeting provider mount | `app/educator/layout.tsx:13`, `app/student/layout.tsx:13` |
| Agora share/stop | `hooks/meeting/useAgoraRTC.ts:209-305` |
| Agora teardown | `hooks/meeting/useAgoraRTC.ts:163-190` |
| Classes filter input | `components/admin/class/ClassesFilterBar.tsx:129-136` |
| Classes filter state | `hooks/admin/useClassFilters.ts:45-53` |
| Debounced input | `components/shared/SearchInput.tsx:21-40` |
| Dashboard waterfall | `app/admin/dashboard/page.tsx:105-145` |
| Students over-fetch | `app/admin/students/page.tsx:98-166` |
| Hero images | `components/landing/HeroSection.tsx:75,103,197,204` |
| Landing sections (all client) | `components/landing/*.tsx` (11 files) |
| Docs shell | `app/docs/get-started/layout.tsx:1-31` |
| Fonts | `app/layout.tsx:6-25` |
| CSP / standalone | `next.config.ts:8-49` |

---

## Appendix B — Command reference (from `frontend/`)

```powershell
# Hard gates
npx tsc --noEmit --incremental false
npm run lint
npm test -- --runInBand
npm run build

# Bundle analysis (after build)
npx next experimental-analyze

# Route entry sizes (raw bytes)
node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('.next/app-build-manifest.json','utf8'));for(const [r,f] of Object.entries(m.pages)){const b=f.reduce((s,x)=>{try{return s+fs.statSync('.next/'+x).size}catch{return s}},0);console.log((b/1024).toFixed(0).padStart(6),'KB ',r)}"

# Find a chunk by content signature (PowerShell)
Get-ChildItem .next/static/chunks -Filter *.js | Select-String -Pattern "ZodError" -List | Select-Object Path

# Asset size audit
Get-ChildItem public -Recurse -File | Sort-Object Length -Descending |
  Select-Object -First 20 FullName,@{n="KB";e={[math]::Round($_.Length/1KB)}}

# Reference check before deleting an asset
Get-ChildItem src,public -Recurse -File -Include *.ts,*.tsx,*.css,*.html |
  Select-String -Pattern "3-badge|edutool-yellow2|seeder\.mp4"
```

---

## Appendix C — Definition of done (per phase)

A phase is `DONE` only when all of the following are true:

1. Code is committed on the working branch with a message of the form `perf(frontend): <scope>`.
2. `npx tsc --noEmit --incremental false` exits `0`.
3. `npm run lint` exits `0` (or only pre-existing warnings remain, documented).
4. `npm test -- --runInBand` exits `0`.
5. `npm run build` exits `0`.
6. The phase's Acceptance list is satisfied item by item.
7. Blocked verification is explicitly labelled `BLOCKED`, not omitted.
8. §7 and §9 are updated.

---

## Appendix D — Anti-patterns (do not do these)

- Do not delete assets based on `src` grep alone; check the whole repo and deployment configs.
- Do not add `next/image` if it requires changing CSP or adding an `images` config that has not been reviewed.
- Do not globally remove `"use client"`.
- Do not "fix" a request waterfall without a HAR.
- Do not change query keys to force a refetch.
- Do not introduce `any` at a boundary to make a dynamic import type-check.
- Do not mark a phase `DONE` because the build passed; the acceptance criteria are behavioural and measurement-based.
- Do not treat stale logs or old chunk filenames as current evidence.

---

## Appendix E — Glossary

| Term | Meaning |
|---|---|
| Entry JS | Chunks loaded before hydration for a route, per `app-build-manifest.json` |
| Raw KB | Uncompressed file size on disk |
| Chunk | A JS file under `.next/static/chunks/` |
| RSC | React Server Component (no `"use client"`, zero browser APIs) |
| Deferred chunk | A `next/dynamic` chunk not present in the route entry |
| Gated query | A TanStack Query with `enabled` tied to a precondition |
| Blocked | Verification requires an environment unavailable in this session |
