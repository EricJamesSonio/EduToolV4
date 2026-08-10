# Concern Center — Project Overview

## What this is

A student-facing feature for submitting concerns (account problem, grade problem, etc.) to admin/registrar, with in-app threaded replies. Admin/registrar get a shared inbox. New-concern notifications reach their personal email as a rate-limited digest, not a per-message blast.

Educator support is explicitly **out of scope** for this pass. The backend stays role-generic (`sender_role` on `Concern`) so adding educator later is a nav link + reusing the existing component — not new backend work. Do not build an educator-facing page in this pass.

## Data model

**`ConcernCategory`** — `id, org_id, label, is_default Boolean, is_active Boolean, created_at, updated_at`. Unique `(org_id, label)`. Seeded with defaults on org creation: `Account Problem`, `Grade Problem`, `Technical Issue`, `Other`. Both admin and registrar can add/edit/deactivate — this is NOT admin-only, unlike Enrollment Periods.

**`Concern`** (ticket container) — `id, org_id, category_id, sender_account_id, sender_role, subject, status, created_at, updated_at, last_message_at, resolved_by, resolved_at`. `status`: `open | resolved` only — no `in_progress`, since there's no claiming/assignment (shared inbox, anyone replies).

**`ConcernMessage`** — `id, org_id, concern_id, sender_account_id, sender_role, sender_name, body, created_at`. Mirrors the existing `MeetingChatMessage` pattern (denormalized sender info, no separate thread table).

**`OrgConcernSetting`** — `org_id (unique), last_digest_sent_at DateTime?, created_at, updated_at`. Same one-row-per-org shape as `OrgEnrollmentSetting`/`OrgHolidayConfig`.

## Behavior rules

- **Auto-reopen**: if the sender posts a new message on a `resolved` concern, it flips back to `open` automatically.
- **In-app notifications**: fire immediately, every time (new concern → all org admins+registrars; staff reply → original sender only).
- **Email digest**: new concerns only, batched. Staff replies never trigger email — the sender already gets an instant in-app notification for those, and there's no flood risk on that direction.

## Email digest mechanics (read this before Phase 3)

Uses a BullMQ delayed job with a **deterministic, per-org jobId** so the queue itself gives you debouncing for free — no manual counters or locks needed:

1. New concern saved → in-app notification fires immediately (unchanged, instant).
2. Enqueue a job: `jobId: concern-digest-${orgId}`, `delay: 60_000`. If a job with that ID is already waiting, BullMQ no-ops the enqueue — nothing new is scheduled, the concern is swept up by the pending job.
3. When the job fires (60s after the _first_ concern in the window): `COUNT(*) FROM Concern WHERE org_id = ? AND created_at > lastDigestSentAt`. Email every admin/registrar's `personal_email`: _"You have {count} new concern(s). Log in to EduTool to view them."_ — count only, never message content.
4. Update `OrgConcernSetting.last_digest_sent_at = now()`.
5. jobId is free again → next new concern starts a fresh window. No new concern → no job ever scheduled → no email. This matches "if none then none" exactly.

**Worst-case scenarios to build defensively against (senior-engineer checklist for whoever implements this):**

- **Mail send fails inside the job** → catch and log, do NOT throw and retry-loop the whole job (BullMQ will retry per its default policy, which could re-send old counts or hang the queue). Update `last_digest_sent_at` regardless of mail success/failure, so a persistent mail outage doesn't cause the count to balloon into next window and double-count. Log the failure loudly (existing `Logger` pattern from `SchedulerTasks`/`MailService`) for manual follow-up.
- **Org has zero admin/registrar accounts** (edge case, shouldn't happen but don't crash on it) → skip the email step gracefully, still update `last_digest_sent_at`.
- **Race between job execution and a concern created in the same millisecond** → use `created_at > last_digest_sent_at`, not `>=`, and always update `last_digest_sent_at` to the job's own `now()` at execution time, not to the max `created_at` of counted rows — avoids off-by-one double-counting on the boundary.
- **In-app notification volume** for a genuine flood (50 concerns in one minute) → `NotificationService.createBulkNotifications()` already exists for exactly this; do not fire 50 individual `createNotification()` calls in a loop of round-trips — batch them.
- **N+1 in the admin inbox list** → the list view will need category + latest message preview per concern; use a single query with proper Prisma `include`, not per-row follow-up queries.
- **Rate limiting on concern submission itself** (a student spamming the form) is explicitly **deferred** — not in scope this pass. Leave a `// TODO: consider rate-limiting concern creation per account if abuse is observed` comment where the create endpoint lives.

## Reusable structure

- **`components/shared/concern-center/ConcernCenterFeature.tsx`** — submit form + category dropdown + "my concerns" list + thread view. Mounted at `student/concerns/page.tsx` only for this pass, written so it's not student-specific internally (no hardcoded role assumptions beyond what the API naturally scopes).
- **`admin/concerns/page.tsx`** — separate inbox UI for admin/registrar: list all in org, filter by status/category/sender, thread view with reply + resolve, category management panel.
- **Backend module**: new `concern/` module, split the way `grade/` already splits into core/educator/student: `concern-core` (shared logic — category read, concern CRUD helpers), `concern-student` (submit, list own, reply — ownership-checked), `concern-staff` (list all in org, reply, resolve/reopen, category management — admin+registrar).

## Phase map

| Phase | Layer    | Delivers                                                                             |
| ----- | -------- | ------------------------------------------------------------------------------------ |
| 1     | Backend  | Schema + migration + default-category seeding on org creation                        |
| 2     | Backend  | Student-facing concern endpoints (submit, list own, reply, read categories)          |
| 3     | Backend  | BullMQ email digest job + mail template + `OrgConcernSetting`                        |
| 4     | Backend  | Admin/registrar inbox endpoints (list all, reply, resolve/reopen, manage categories) |
| 5     | Frontend | Reusable `ConcernCenterFeature` + student page                                       |
| 6     | Frontend | Admin/registrar Concern Center Messages page + category management UI + nav          |

Each phase file has a step list and a ready-to-paste AI prompt. No per-phase log files this time — keep it lean; verification happens via typecheck/build/lint the same way as before, just without writing status reports to disk.
