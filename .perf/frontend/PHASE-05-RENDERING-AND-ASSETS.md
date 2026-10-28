# Phase 05 — Rendering and Assets

**Priority:** After route and meeting work  
**Risk:** Medium  
**Goal:** Improve transfer, decode, layout-stability, and rendering costs without changing appearance or authentication behavior.

This phase is split into:

- **Phase 05A — Low-risk asset optimization.**
- **Phase 05B — Landing page client boundaries and auth-loading investigation.**

Do not combine asset changes with auth/rendering changes in one batch.

## Phase 05A — Low-risk assets

### Review findings

| Asset | Finding |
|---|---|
| `/desktop-3.png` | Approximately 184 KB; hero uses a raw `<img>` without the reported explicit dimensions or priority configuration. |
| `/mobile-3.png` | Approximately 63 KB; same raw `<img>` pattern. |
| `/edutool-yellow.png` | Approximately 87 KB at 2000×2000; displayed around 44 px in relevant navigation/login UI. |
| `/badges/3-badge.png` | Approximately 2.27 MB; reportedly unused. |
| `/edutool-yellow2.png` | Approximately 130 KB; reportedly unused. |
| Videos | Ten files total approximately 124 MB. Visible videos reportedly use `preload="metadata"` without posters. |

The world-facing landing page also uses several decorative images; treat all size claims as review findings until the current files are checked.

### Changes to evaluate

1. Resize the logo to the largest size actually displayed, with an appropriate high-density variant if needed.
2. Add explicit width/height or aspect-ratio information to hero and other images to prevent layout shift.
3. Evaluate `next/image` for suitable local images, respecting the existing CSP and standalone output.
4. Add video posters and use suitable `preload` behavior; do not autoplay large videos.
5. Verify unused assets with repository-wide references before deleting anything.
6. Audit font families and weights before removing any. The root layout currently loads Kodchasan, JetBrains Mono, and Plus Jakarta Sans across multiple weights.

### Rules

- Preserve visual appearance and responsive behavior.
- Do not delete an asset until all references, including runtime/public URLs, have been checked.
- Do not convert an image to a different format if it would break transparency or visual fidelity.
- Do not use `next/image` where the existing delivery model or CSP makes it unsuitable.
- Do not change video behavior in a way that removes user control or changes playback semantics.
- Keep each asset batch reversible.

### Validation

- Fresh build and typecheck pass.
- Browser Network shows reduced image/video transfer where expected.
- Lighthouse or equivalent measurements for LCP and CLS before/after.
- Test desktop and mobile layouts.
- Check image dimensions, cropping, transparency, and logo sharpness.
- Confirm no 404s and no missing posters.
- Confirm videos still play, pause, and stop correctly.

## Phase 05B — Landing page and authentication boundary

### Review findings

- `frontend/src/app/page.tsx` is a client component and imports all landing sections eagerly.
- Several landing sections reportedly contain no hooks or event handlers and may be eligible to become server components after verification.
- The landing page blocks rendering on `isLoading` while authentication bootstrap runs.
- For a guest with no access token, bootstrap calls `/auth/refresh`; the loading state ends only after the request fails.
- This can delay first paint and produce a failing network request for public visitors.

Potential server-component candidates mentioned in the review include Features, Footer, CTA, Contact, Resources, and Pricing sections. Treat this as a hypothesis until each file is traced.

### Investigation before changes

1. Measure guest landing load in the browser Network and performance panels.
2. Confirm the `/auth/refresh` request and the time spent in the loading state.
3. Trace every authentication path: first load with no token, first load with a persisted token, valid refresh cookie, expired refresh cookie, login, logout, and protected-route redirect.
4. Trace each landing section for hooks, browser APIs, context, event handlers, and client-only children.
5. Determine whether the auth redirect can be isolated in a small client boundary without changing behavior.

### Rules

- Do not change auth bootstrap, refresh, logout, expired-token, redirect, or authorization semantics speculatively.
- Do not globally remove `"use client"`.
- Do not convert a page/section until its hooks, context, and event handlers are traced.
- Do not hide the loading state or cause a protected page to flash.
- Preserve SEO, metadata, responsive layout, and interactive sections.
- If guest rendering cannot be changed safely, document the constraint and leave auth behavior unchanged.

### Changes to evaluate

- Convert only verified static landing sections to server components.
- Isolate the authenticated-user redirect into the smallest client boundary possible.
- Investigate whether public routes can avoid blocking first paint on the refresh attempt.
- Keep the landing page visually identical.

### Validation

- Fresh build and typecheck pass.
- Measure initial JS, hydration cost, LCP, and CLS before/after.
- Test guest, returning user with valid session, expired session, login, logout, and direct protected-route access.
- Confirm no flash of protected content and no redirect loop.
- Test mobile and desktop layouts.
- Confirm all interactive landing controls still work.

## Exit criteria

- Each subphase has measured before/after results or a documented reason no change was safe.
- No visual regressions.
- No auth behavior changes without full flow validation.
- No unused assets deleted without a reference check.
