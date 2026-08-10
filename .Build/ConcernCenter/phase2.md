# Phase 2 — Backend: Student-Facing Concern Endpoints

## Goal

Students can read active categories, submit a concern, list their own concerns, view a thread, and reply. Ownership-checked throughout — a student can never see or act on another student's concern.

## Module structure

New `backend/src/modules/concern/` following the `grade/` module's core/student/staff split:

- `concern/core/concern-core.service.ts` + `.repository.ts` — shared logic (category lookups, concern/message creation helpers, the "flip to resolved→open on new message" rule)
- `concern/student/concern-student.controller.ts` + `.service.ts` — student-facing routes
- `concern/dto/concern.dto.ts` — DTOs for all of Phase 2 + Phase 4

## Endpoints (student, auth-guarded, role: student)

- `GET /concerns/categories` — active categories for the caller's org (`is_active: true`), any authenticated user in the org can read
- `POST /concerns` — body `{ categoryId, subject, body }` → creates `Concern` (status `open`, `sender_account_id` = caller, `sender_role` = caller's role) + first `ConcernMessage` in one transaction, `last_message_at = now()`. Fire in-app notification to all org admin/registrar accounts (use `NotificationService.createBulkNotifications()`, not a loop of single calls). Enqueue the digest job per Phase 3's spec (stub this call now, wire the real queue in Phase 3 — do not block Phase 2 on Phase 3 existing yet, just leave a clearly marked call site).
- `GET /concerns/mine` — list caller's own concerns, ordered by `last_message_at desc`, paginated like your other list endpoints (see `QuerySectionDto` pattern)
- `GET /concerns/:id` — single concern + all messages, ownership-checked (`sender_account_id === caller.id` or `403`)
- `POST /concerns/:id/reply` — body `{ body }` → new `ConcernMessage`, ownership-checked, updates `last_message_at`, and if `status === 'resolved'` flips it back to `open`. Fire in-app notification to all org admin/registrar accounts (reply direction reuses the same notification path as new-concern, since staff need to know either way — do NOT trigger the email digest for this direction, only for brand-new concerns).

## Acceptance check

- Student A cannot `GET /concerns/:id` for student B's concern → 403/404
- Submitting a concern creates exactly one `Concern` + one `ConcernMessage`, notifies all admins/registrars once (not once per admin via separate round trips)
- Replying to a resolved concern flips it back to open

---

## AI Prompt

```
Context: EduTool backend (NestJS + Prisma). Schema and org seeding from Phase 1
already exist: ConcernCategory, Concern, ConcernMessage, OrgConcernSetting.

Task: build backend/src/modules/concern/ following the same core/student/staff
split pattern used in backend/src/modules/grade/ (look at grade-core, grade-student
for the exact pattern to mirror — controller → service → repository, DTOs with
class-validator).

Endpoints needed (student-facing only in this phase):
1. GET /concerns/categories — active categories for caller's org
2. POST /concerns — { categoryId, subject, body } — create Concern + first
   ConcernMessage in one transaction (Prisma $transaction). sender_account_id and
   sender_role come from the authenticated user (req.user), never trust a client-
   supplied sender. On success, notify all role=admin accounts in the org (this
   includes registrar-flagged accounts — they're still role=admin) via
   NotificationService.createBulkNotifications() — a single batch call, not a
   loop of individual createNotification() calls. Also call a method
   `enqueueConcernDigest(orgId)` on a new (currently stubbed, to be implemented in
   a later phase) service — just leave the call site clearly marked with a
   comment `// TODO Phase 3: wire real BullMQ digest job here`.
3. GET /concerns/mine — paginated list of the caller's own concerns, ordered by
   last_message_at desc. Follow the pagination shape used in section.service.ts's
   findAll (page/limit/meta).
4. GET /concerns/:id — full concern + messages. Enforce that
   concern.sender_account_id === req.user.id, else throw ForbiddenException.
5. POST /concerns/:id/reply — { body } — same ownership check as above, create a
   new ConcernMessage, update last_message_at, and if the concern's status is
   'resolved', set it back to 'open'. Notify all admin/registrar accounts the same
   way as #2, but do NOT call enqueueConcernDigest here — only new concerns
   (endpoint #2) trigger the digest.

Use the existing AuthGuard/RolesGuard/@Roles decorator pattern for auth.

Show me the file structure you plan to create before writing code, then the diffs.
```
