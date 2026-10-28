# Phase 00 — Baseline and Repository Audit

**Priority:** First  
**Risk:** Low  
**Goal:** Establish a fresh, reproducible baseline before any optimization, and replace assumptions with measurements.

## Verified repository facts

The read-only review confirmed:

- Next.js `16.2.1`.
- React and React DOM `19.2.4`.
- TanStack Query `5.101.4`.
- Agora RTC SDK `4.24.3`, socket.io-client `4.8.3`, `@xyflow/react` `12.12.0`.
- Zod `4.3.6`, Sonner `2.0.7`, Zustand `5.0.12`.
- `npx tsc --noEmit --incremental false` passed during the review (exit `0`).
- The last recorded production build succeeded: approximately 55 seconds to compile, 49 seconds for TypeScript, and 50 static pages.
- No fresh build was run during the review. The existing `.next` output and `build3.log` are historical evidence only.
- The reported `.next/dev/types/routes.d.ts` syntax error did not reproduce; that generated file was absent.
- The reported `screenTrack.close()` nullability error is fixed in the reviewed code.
- The failures in `build.log` and `build2.log` are stale relative to the passing current typecheck.

## Known E2E baseline

The recorded E2E result is **15 passing tests and 1 failure**:

- File: `frontend/e2e/admin-setup.spec.ts`
- Location: line 1497
- Test: Phase 7b enrollment wizard
- Observed result: class creation returned HTTP `409` instead of `201`

Treat this as a pre-existing baseline. It is not evidence of a frontend performance regression, and it does not by itself block performance work. Record whether it changes after each relevant batch.

## Historical route-entry measurements

The following values came from generated Client Reference Manifests in the existing build:

| Route | Raw entry JavaScript |
|---|---:|
| `/admin/students` | 987 KB |
| `/admin/educators` | 976 KB |
| `/admin/registrars` | 962 KB |
| `/admin/students/[id]` | 935 KB |
| `/admin/subjects/hierarchy` | 805 KB |
| `/admin/students/[id]/hierarchy` | 757 KB |
| `/admin/dashboard` | 688 KB |
| `/educator` | 501 KB |
| `/student` | 501 KB |
| `/` | 314 KB |

**Measurement caveats:**

- These are raw route-entry measurements derived from `.next/server/app/**/page_client-reference-manifest.js`.
- They are not compressed browser transfer sizes.
- Dynamic chunks are not included in these totals. For example, the Socket.IO/meeting-context chunk is requested after hydration and is not part of the educator/student entry totals above.
- These numbers are a historical review snapshot, not a freshly generated baseline for the current working tree.

## Tasks

1. Inspect `frontend/package.json`, `frontend/next.config.ts`, `frontend/tsconfig.json`, and the current app structure.
2. Confirm the exact installed versions from the lockfile, not only the package ranges.
3. Run a fresh production build and record the complete result:
   - compilation;
   - TypeScript checking;
   - route generation;
   - warnings;
   - build duration.
4. Run `npx tsc --noEmit --incremental false` and record the exit status.
5. Capture fresh route-entry measurements from the new build. Use `page_client-reference-manifest.js` and sum unique `entryJSFiles` chunk sizes.
6. Run `npx next experimental-analyze` after the build. This is the built-in Next 16 analyzer; do not add another analyzer dependency.
7. Inspect the import chains for the root layout, providers, role layouts, landing page, meeting hooks, and notification hooks.
8. Inspect the existing `.next` output only as build evidence. Never edit generated files.
9. Record the known E2E baseline and any other test failures separately from performance measurements.
10. Identify the next batch based on the revised execution order in `README.md`.

## Required baseline report

Record at minimum:

- Commands executed and their exact pass/fail results.
- Fresh build duration and static-page count.
- TypeScript exit status.
- Fresh raw route-entry totals for the routes in the table above.
- Any changes from the historical table.
- Confirmation that dynamic chunks are reported separately.
- The known E2E baseline.
- The recommended next batch.

## Exit criteria

- A fresh build and typecheck have been run, not merely assumed from history.
- The current working-tree state and test baseline are documented.
- Fresh route measurements exist for before/after comparisons.
- The next batch is selected from evidence, not guesswork.
- No source changes were made in this phase unless a blocking build issue was explicitly approved.
