# Phase 4 — Backend: Admin/Registrar Inbox Endpoints

## Goal

Shared inbox for admin + registrar: list all concerns in the org, reply, resolve/reopen, manage categories. No claiming/assignment — anyone with `role: admin` in the org (registrar-flagged or not) can act on anything.

## Endpoints (`concern/staff/concern-staff.controller.ts`, `@Roles('admin')` — this naturally includes registrar accounts since their `role` field is still `admin`)

- `GET /concerns/staff` — list all concerns in the org, paginated, filterable by `status`, `categoryId`, `senderRole`. Include category label and a message-count/latest-message-preview per row **in the query itself** (Prisma `include`), not via per-row follow-up calls — see the N+1 warning in the overview doc.
- `GET /concerns/staff/:id` — full thread, no ownership restriction beyond org match
- `POST /concerns/staff/:id/reply` — same message-creation logic as the student reply endpoint (reuse `concern-core`'s message-creation helper, don't duplicate it), notifies the original sender via in-app `Notification` only (no email — sender is already logged in and this isn't the flood-risk direction)
- `PATCH /concerns/staff/:id/resolve` — sets `status: resolved`, `resolved_by: caller.id`, `resolved_at: now()`
- `PATCH /concerns/staff/:id/reopen` — sets `status: open`, clears `resolved_by`/`resolved_at` (manual reopen, separate from the auto-reopen-on-sender-reply behavior already built in Phase 2)

## Category management (`concern/category/concern-category.controller.ts`, `@Roles('admin')`)

- `POST /concerns/categories` — create, `is_default: false`
- `PATCH /concerns/categories/:id` — edit label / `is_active`
- Do not allow deleting a category that has existing `Concern` rows referencing it — deactivate (`is_active: false`) instead, same spirit as `SectionService.remove()`'s "can't delete if in use" guard. Categories with `is_default: true` can be deactivated but the four seeded defaults should not be deletable at all (deactivate only).

## Acceptance check

- Registrar-flagged admin account can list, reply, resolve, and reopen any concern in the org
- Attempting to hard-delete a category that has concerns attached is rejected; deactivating it succeeds and it disappears from `GET /concerns/categories` (student-facing) but existing concerns referencing it are unaffected
- Staff reply does not trigger the digest queue, only an in-app notification to the sender

---

## AI Prompt

```
Context: EduTool backend (NestJS). Concern module core + student endpoints exist
(Phase 2). Digest job exists (Phase 3).

Task: add staff-facing endpoints to the concern module, following the same
controller/service/repository pattern already used for the student side.

1. GET /concerns/staff — @Roles('admin'), paginated list of ALL concerns in the
   caller's org (no ownership filter — this is the shared inbox). Support query
   filters: status, categoryId, senderRole. Use a single Prisma query with
   `include` for category label and latest message preview — do NOT do a
   follow-up query per row.

2. GET /concerns/staff/:id — full concern + all messages, org-scoped only (no
   sender ownership check, any staff in the org can view any concern).

3. POST /concerns/staff/:id/reply — { body }. Reuse the same message-creation
   logic from concern-core that the student reply endpoint already uses — do not
   duplicate that logic. After creating the message, send an in-app Notification
   (NotificationService.createNotification, single recipient) to the concern's
   original sender_account_id. Do NOT call enqueueConcernDigest here.

4. PATCH /concerns/staff/:id/resolve — sets status='resolved', resolved_by=caller.id,
   resolved_at=now().

5. PATCH /concerns/staff/:id/reopen — sets status='open', resolved_by=null,
   resolved_at=null.

6. Category management, @Roles('admin'):
   - POST /concerns/categories — create with is_default: false
   - PATCH /concerns/categories/:id — edit label/is_active
   - Do not implement a hard-delete endpoint. If dto includes an attempt to delete
     a category that has any Concern rows referencing it, this must be impossible
     by design (no delete endpoint exists) — only is_active toggling. Default
     (is_default: true) categories can be deactivated but should be flagged in
     the response/UI as system defaults (no special backend restriction beyond
     that, deactivation logic is the same for all categories).

Remember: @Roles('admin') covers registrar-flagged accounts automatically since
their role field is still 'admin' — do not add any is_registrar-specific gating
here, per the project's UI-only registrar enforcement decision.

Show me the diffs before applying.
```
