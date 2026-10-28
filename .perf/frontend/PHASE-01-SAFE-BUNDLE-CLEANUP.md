# Phase 01 — Safe Bundle Cleanup

**Priority:** High after baseline  
**Risk:** Low  
**Goal:** Keep development-only tools out of production's initial client bundle and remove avoidable eager imports.

## Known candidate

### `src/app/providers.tsx`

The file currently imports React Query Devtools and renders it only in development. A recent change replaced the static import with `next/dynamic`, while retaining the development-only conditional. Verify the actual current file before changing it again.

## Audit candidates

- Development-only panels, inspectors, mock tools, and debug overlays.
- Large optional libraries imported by global providers or root layouts.
- Modules imported at the top level even though they are used only after a user opens a feature.
- Duplicate imports or re-exports that prevent a clear route-specific dependency boundary.

## Rules

- Keep the existing providers and their ordering unless code tracing proves a change is safe.
- Do not lazy-load tiny components without evidence that it helps.
- Confirm that production does not render development tools and that development tools still work in development.
- Avoid moving authentication or query initialization into a delayed component.
- Check SSR/client-only constraints before applying `ssr: false`.

## Validation

1. Run the production build and TypeScript checks.
2. Run the development app and confirm React Query Devtools and the debug panel still appear in development.
3. Inspect production rendering/configuration to confirm development-only tools are absent.
4. Review the diff for accidental provider-order or behavior changes.

## Exit criteria

- Build and type-check pass.
- Development-only tools work in development.
- No development tooling is rendered in production.
- Any bundle-size claim is supported by output or measurement.
