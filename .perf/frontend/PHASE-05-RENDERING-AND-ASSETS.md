# Phase 05 — Rendering and Assets

**Priority:** Medium  
**Risk:** Medium–High  
**Goal:** Improve rendering and transfer costs after bundle and request issues are understood.

## Audit targets

- `src/app/layout.tsx` and global font loading.
- `src/app/page.tsx` and large client-side landing-page sections.
- Images, videos, stickers, badges, and profile media under `public/`.
- Large client components that could be isolated from server-rendered shells.
- Expensive tables/lists or components that re-render frequently.
- Layout shifts, large DOM trees, and unnecessary state subscriptions.

## Rules

- Do not remove fonts or weights based only on file size; inspect which are used and compare visual results.
- Use `next/image` where it fits the asset and delivery model, while respecting dimensions, quality, and external-source configuration.
- Use explicit image/video dimensions or aspect ratios to reduce layout shifts.
- Do not autoplay large videos or load offscreen media unnecessarily.
- Preserve browser behavior, SEO/metadata, auth gating, and client-only dependencies.
- Do not convert a client component to a server component until its hooks, browser APIs, context, and event handlers are traced.
- Do not introduce memoization everywhere. Profile expensive re-renders first.
- Keep visual appearance and responsive behavior stable.

## Validation

- Build and type-check pass.
- Compare Lighthouse or browser performance measurements on representative routes.
- Test mobile and desktop layouts.
- Check font loading, hydration warnings, image/video behavior, and layout shifts.
- Verify interactive sections and auth-protected routes.

## Exit criteria

Measured rendering/asset improvement with no regressions in appearance, interaction, or route behavior.
