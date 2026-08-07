# Phase 3 — Registrar-Side API

## Goal

Registrar creates/manages enrollment periods, searches applications, approves/rejects, and manually unlocks.

## Step 1 — Audit before writing new logic

- `modules/grade-lock/` — **read this whole module first.** `grade-lock-auto.service.ts`, `grade-lock-requests.service.ts`, `grade-lock-operations.service.ts`, `grade-lock.validator.ts` already solve the exact shape of this problem for a different resource: something auto-locks on a date, and an authorized person can request/perform a manual unlock. Mirror this module's structure and naming for the enrollment-application lock/unlock logic instead of inventing a new shape. If grade-lock's pattern doesn't fit cleanly, adapt it — don't force a bad fit, but don't reinvent without checking first.
- `commons/guards/role.guard.ts` + `commons/decorators/roles.decorator.ts` — reuse for gating registrar-only routes. Check whether composing the new `is_registrar` flag (Phase 1) into the existing guard is cleaner than writing a parallel guard.
- `modules/audit-log/audit-log.service.ts` — reuse for logging approve/reject/unlock actions. Do not create a second logging mechanism.
- `modules/notification/notification.service.ts` — reuse for the "section full, needs capacity" alert to registrars.
- Check whichever repository already implements search/pagination (e.g. `audit-log.repository.ts` or `student.repository.ts`) for the existing pagination helper pattern before writing a new one.

## Step 2 — Build only what's missing

New module: `modules/enrollment-portal/registrar/` (or nested under `modules/enrollment-portal/` alongside `public/`, whichever matches how similarly-split modules like `assessment/educator` + `assessment/student` are organized).

### Period management

- `POST /admin/enrollment-portal/periods` — create (org_id from authenticated admin's org, school_year_id, name, start/end/lock dates → generates `token`).
- `GET /admin/enrollment-portal/periods` — list for org.
- `PATCH /admin/enrollment-portal/periods/:id` — edit dates/name.
- `DELETE /admin/enrollment-portal/periods/:id` — only if no applications reference it, or soft-delete per whatever pattern `deleted_at` fields use elsewhere in the schema (check `Section` migration `add_deleted_at_to_section` for the existing soft-delete convention and reuse it if applicable).

### Application review

- `GET /admin/enrollment-portal/applications` — search/filter by `application_code`, `personal_email`, `status`, `period_id`; paginated (reuse existing pagination helper).
- `GET /admin/enrollment-portal/applications/:id` — full detail.
- `POST /admin/enrollment-portal/applications/:id/approve` — see Phase 4, this endpoint just triggers it.
- `POST /admin/enrollment-portal/applications/:id/reject` — body: `{ reason: string }`.
- `POST /admin/enrollment-portal/applications/unlock` — body: `{ personal_email }` or `{ application_code }` (search either way, per the earlier requirement); moves `locked → pending`, sets `unlocked_by`/`unlocked_at`.

## Step 3 — Locking logic

Mirror whatever `grade-lock-auto.service.ts` does structurally:

- Applications auto-lock at `period.lock_date` (Phase 5 wires the actual schedule).
- Registrar unlock is a direct action here (not a "request" queue, per the confirmed flow — applicant just tells the registrar their email/code out of band), unlike grade-lock's request/approve flow. Don't copy the request-queue part if it doesn't match the confirmed requirement — copy the _lock/unlock mechanics_, not necessarily the request-approval ceremony, unless during audit you find the request-queue pattern is actually a better fit here too.

## Acceptance

- Every approve/reject/unlock call produces exactly one audit-log entry, via the existing service.
- No second pagination or search-helper implementation was introduced if one already existed.
- Registrar-only routes are gated the same way other admin-only routes in the codebase are gated (consistent guard usage, not a bespoke check inline in the controller).
