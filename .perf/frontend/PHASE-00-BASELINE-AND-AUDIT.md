# Phase 00 — Baseline and Repository Audit

**Priority:** First  
**Risk:** Low  
**Goal:** Establish what is slow, verify the current source state, and avoid optimizing based on assumptions.

## Tasks

1. Inspect `frontend/package.json`, `frontend/next.config.ts`, and the current app structure.
2. Confirm the exact Next.js, React, TanStack Query, and Agora SDK versions from package metadata/lockfile.
3. Run the normal production build and record the complete result. Do not treat `Compiled successfully` as a pass if TypeScript or route generation later fails.
4. Inspect the current contents of:
   - `src/app/providers.tsx`
   - `src/hooks/meeting/useAgoraRTC.ts`
   - `src/hooks/meeting/useMeetingSocket.ts`
   - `src/lib/query-client.config.ts`
   - `src/app/layout.tsx`
   - `src/app/page.tsx`
5. Review the existing build output and available bundle-analysis tooling. If bundle analysis is not already configured, propose the smallest safe way to measure bundles before adding a dependency.
6. Identify the top user-visible performance concern: initial load, route navigation, dashboard loading, meeting startup, or another measured bottleneck.
7. Inspect recent changes and build failures before planning new code edits.

## Current known blockers

The conversation reported these build errors after recent changes:

- A generated `.next/dev/types/routes.d.ts` syntax error around JSX-looking content in generated type output. The suggested first response was to remove `.next` and rebuild; if it recurs, inspect the generated file and source that produced it. Never patch the generated file directly.
- A TypeScript nullability error in `src/hooks/meeting/useAgoraRTC.ts` at `screenTrack.close()`.

The agent must check whether these still reproduce against the current working tree before making any further optimization changes.

## Deliverables

- A short baseline report with commands, results, and relevant build warnings/errors.
- A prioritized list of measured or strongly evidenced hotspots.
- A revised phase order if repository evidence supports changing it.
- No source changes during this phase unless explicitly approved to fix a blocking build issue.

## Exit criteria

- Current build status is known and reproducible.
- Current working-tree state is understood.
- The next phase is selected based on evidence, not guesswork.
