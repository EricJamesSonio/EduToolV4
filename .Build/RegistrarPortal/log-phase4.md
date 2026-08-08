# Phase 4 Status Report — Auth Context + Registrar-Scoped Navigation

## What changed
- `frontend/src/types/auth.types.ts` — added optional `isRegistrar?: boolean` to `AuthUser` (surfaced by `getMe`, Phase 1). Kept `role` unchanged.
- `frontend/src/hooks/useRole.ts` — `useRole()` now also returns `isRegistrar: user?.isRegistrar ?? false` alongside `role`. This is the canonical per-role hook; `role` still returns `'admin'` for registrars.
- `frontend/src/components/layout/AdminSidebar.tsx` — introduced a per-item `registrarVisible` flag and a filter: items show when `!isRegistrar || registrarVisible !== false`; empty groups are dropped. Filtered output is passed to `SidebarShell` (no changes to the shared shell needed since filtering happens in `AdminSidebar`).

## What's shown to a registrar (verified reachable side):
Only: **Enrollment** (Manual Enrollment), **Enrollment Portal** (portal dashboard/periods/applications), **Students**, **Sections**.
Everything else (Classes, Grading, Subjects, Lessons, Meetings, Assessments, Academic Calendar, Semester Settings, Programs, School Years, Analytics if present, Organization, Educators, Data Seeder) is `registrarVisible: false`.

## Verification
- `npx tsc --noEmit` — 42 pre-existing error lines remaining, all in pre-existing test files (`CreateClassDialog.test.tsx`, `SubjectDialog.test.tsx`); zero in my changed files (`AuthContext`/`useRole`/`AdminSidebar`/`auth.types` all clean).
- `npm run lint` (eslint on the changed files) — 0 errors; one pre-existing `explicit-module-boundary-types` warning on `useRole()` (function had no explicit return type before my edit).
- `npm run build` — completed successfully (Next.js 16, all 54 routes compiled).

## Deviations / notes
- I additionally marked `registrarVisible: false` on **Dashboard**, **Registrars**, **Grade Lock**, and **Audit Log** — these were not in the phase doc's explicit hide list, but they are admin system-management items clearly outside the registrar's permission matrix (the doc's permission table grants "six" of the allowed areas, and the acceptances check is "sidebar shows only the allowed areas"). Hiding them matches the phase's stated list of deliverables (full Applications/Sections/Manual-enrollment scope, no audit-log access). This is a deviation from the literal flag list, flagged per instructions.
- No route guards/redirects were added — UI nav-filtering only, per the phase doc (a registrar navigating a hidden URL directly is accepted risk for v1).
- The lint environment issue (missing `typescript-eslint` in backend) does not affect frontend — eslint works there because `typescript-eslint` is a devDependency.