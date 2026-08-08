# Phase 4 — Frontend: Auth Context + Registrar-Scoped Navigation

## Goal
A registrar logging in sees a filtered `AdminSidebar` — only the items relevant to their job — while staying on the same `/admin/*` route tree as full admins.

## What to change

1. **`frontend/src/context/AuthContext.tsx`** and/or **`frontend/src/hooks/useAuth.ts`** / **`useAuthProfile.ts`**
   Confirm the `getMe()` response shape used here now includes `isRegistrar` (from Phase 1) and expose it through whatever hook currently exposes `role` (likely `useRole.ts` or `useAuth.ts`). Add an `isRegistrar: boolean` alongside it — don't replace `role`, which stays `'admin'`.

2. **`frontend/src/components/layout/AdminSidebar.tsx`**
   Locate the nav item config (likely an array of `{ label, href, icon }` or similar). Introduce a per-item flag, e.g. `registrarVisible: boolean`, defaulting to `true` for existing items unless explicitly restricted. Mark these as `registrarVisible: false`:
   - Classes, Grading Scale, Grading Schemes, Subjects, Lessons (if present here), Meetings, Assessments (if present here), Attendance (if present here), Analytics, Organization, Educators, Semester Settings, Data Seeder, Academic Calendar (as standalone nav — stays out per the overview doc), Programs/School Years/Levels (as standalone nav)

   Keep visible for registrar: Enrollment Portal (dashboard, periods, applications), Manual Enrollment, Students, Sections

   Filter the rendered list by `item.registrarVisible !== false || !isRegistrar` (i.e., show everything to non-registrars, filter for registrars).

3. **Do not add hard route guards/redirects in this phase.** Per the earlier decision, enforcement is UI-only and nav-hiding is sufficient for v1 — a registrar directly navigating to a hidden URL is an accepted risk for now, not something to block here.

## Acceptance check
- Registrar test account logs in → sidebar shows only the 6 allowed sections
- Regular admin account → sidebar unchanged, shows everything

---

## AI Prompt

```
Context: EduTool frontend (Next.js App Router + React). Auth already exposes
`isRegistrar: boolean` from GET /auth/me (added in a prior phase).

Task:
1. Find where the app currently exposes the authenticated user's role to
   components — check frontend/src/hooks/useAuth.ts, useAuthProfile.ts, useRole.ts,
   and frontend/src/context/AuthContext.tsx. Add isRegistrar to whichever of these
   is the canonical source, following the existing pattern for how `role` is exposed.
   Do not change what `role` returns — is_registrar is additive.

2. Open frontend/src/components/layout/AdminSidebar.tsx. Find the nav item
   configuration. Add a boolean flag per item (e.g. registrarVisible), defaulting
   to true, and set it to false for: Classes, Grading Scale, Grading Schemes,
   Subjects, Lessons, Meetings, Assessments, Attendance, Analytics, Organization,
   Educators, Semester Settings, Data Seeder, Academic Calendar, Programs,
   School Years, Levels.

   Keep true (visible) for: Enrollment Portal (dashboard/periods/applications),
   Manual Enrollment, Students, Sections.

   Filter the rendered nav list: show the item if `!isRegistrar || item.registrarVisible !== false`.

3. Do NOT add any route-level guards, redirects, or middleware restricting
   registrar access to hidden pages by URL — that's explicitly out of scope for
   this phase (UI nav filtering only, per project decision).

Show me the diff before applying.
```