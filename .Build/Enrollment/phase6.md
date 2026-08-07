# Phase 6 — Frontend (Public Portal + Registrar Admin UI)

## Goal

Applicant-facing multi-step form + registrar-facing management pages, built from existing shared components and hooks wherever possible.

## Step 1 — Audit before writing new components

- `components/admin/data-seeder/` (`Step*.tsx`, `hooks/useSeedState.ts`, `hooks/useSeederCard.ts`) — closest existing multi-step wizard pattern. Reuse this step-management approach for the applicant flow (email → OTP → personal info → program/course/level → confirm) instead of building a new step-state mechanism.
- `components/admin/grade-lock/` (`GradeLockSettingModal.tsx`, `GradeLockOverrideDialog.tsx`, `GradeLockStats.tsx`, `GradeLockHierarchyFilter.tsx`) — direct UI analog for: period settings modal, manual-unlock dialog, and a stats bar on the registrar review page. Reuse structure/styling conventions, not just copy-paste.
- `hooks/hook-factory.utils.ts`, `hooks/useAppQuery.ts`, `hooks/useAppMutation.ts`, `hooks/queryKeys.factory.ts` — reuse the existing hook-factory pattern for all new hooks (`useEnrollmentPeriods`, `useEnrollmentApplications`) instead of hand-rolling fetch logic.
- `src/api/client.ts` — reuse the existing client wrapper for new API files. Check whether it auto-attaches an auth token; if the public portal genuinely can't use an authenticated client, confirm that before creating a second client — a minimal unauthenticated variant should only be added if the audit shows the current client can't be used as-is (e.g. via an options flag).
- `components/shared/DataTable.tsx`, `Pagination.tsx`, `StatusBadge.tsx`, `SearchInput.tsx`, `ConfirmDialog.tsx` — reuse directly for the registrar application list/search/approve/reject UI. Do not build new generic table/search/pagination components.
- `AdminSidebar.tsx` — reuse the existing nav-item pattern to add the new section.

## Step 2 — Build only what's genuinely new

### Public (unauthenticated)

- `app/enroll/[orgSlug]/[periodToken]/page.tsx` — no admin/educator/student layout wrapper; standalone public layout.
- `_components/` under that route: wizard steps built on the data-seeder step pattern — email entry, OTP verify, personal info form, program/course-or-strand/level selection (reuse `programType.mapper.ts` for the conditional logic, don't re-derive it), confirmation/review, success screen showing the application code.
- `api/public/enrollment-portal.api.ts` — new, since there's no existing public API surface to extend.

### Registrar (admin)

- `app/admin/enrollment-portal/periods/page.tsx` — list + create/edit periods (built from `GradeLockSettingModal`-style modal).
- `app/admin/enrollment-portal/applications/page.tsx` — search/filter/list (built from `DataTable` + `SearchInput` + `Pagination`), row actions for approve/reject/unlock (built from `ConfirmDialog` + a reject-reason variant).
- `app/admin/enrollment-portal/applications/[id]/page.tsx` — detail view.
- `api/admin/enrollment-portal.api.ts` — new file, following the existing `api/admin/*.api.ts` conventions exactly (check `grade-lock.api.ts` as the closest sibling).
- `hooks/admin/useEnrollmentPeriods.ts`, `hooks/admin/useEnrollmentApplications.ts` — built via the existing hook-factory, not bespoke.

## Acceptance

- No new generic UI primitive (table, modal shell, pagination, search input, confirm dialog) was created if an equivalent already exists in `components/shared` or `components/ui`.
- New hooks follow `hook-factory.utils.ts` conventions and register through `queryKeys.factory.ts` like every other admin hook.
- Public portal pages do not import anything from the authenticated admin/educator/student layouts or contexts.
