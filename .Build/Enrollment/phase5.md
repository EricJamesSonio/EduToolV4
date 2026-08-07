# Phase 5 — Auto-Lock Scheduler

## Goal

Applications automatically move `pending → locked` at each period's `lock_date`, without introducing a second job-scheduling mechanism into the codebase.

## Step 1 — Audit before writing anything

- `core/scheduler/scheduler.module.ts` + `scheduler.tasks.ts` — read these to confirm the _actual_ mechanism already in use (e.g. `@nestjs/schedule` `@Cron`, or something else). Do not assume BullMQ or any other queue system is in play until this is confirmed in code — earlier planning notes assumed BullMQ, verify before building on that assumption.
- `modules/grade-lock/grade-lock-auto.service.ts` — this already implements a scheduled sweep for the same shape of problem (something locks automatically past a date). Reuse its registration pattern (how it hooks into `scheduler.tasks.ts` or its own `@Cron`) exactly, rather than introducing a different mechanism for this one feature.

## Step 2 — Build only what's missing

- Add an enrollment-application lock sweep using whatever mechanism the audit confirms is already standard in this repo.
- Query: `EnrollmentApplication` where `status = pending` and `enrollment_period.lock_date <= now()`.
- For each match: set `status = locked`, `locked_at = now()`.
- Log via the existing audit-log service (Phase 3) with a system actor (`reviewed_by`/actor = null or a designated "system" identifier — match whatever convention `grade-lock-auto.service.ts` already uses for system-triggered audit entries).
- Do **not** touch applications for periods where `end_date` has also passed and status is not yet `approved`/`rejected` — confirm with the product rule (from the original conversation) whether those should stay `locked` indefinitely or need a separate "expired" state; if the schema doesn't already have a state for that, don't invent one silently — flag it back rather than guessing.

## Acceptance

- Exactly one scheduling mechanism exists in the codebase after this phase — no new cron library or queue was introduced if `scheduler.tasks.ts` already covers the need.
- The sweep is idempotent (running it twice in the same lock window doesn't double-log or error on already-locked rows).

## Status — COMPLETE ✅

### What shipped
Audit confirmed `@nestjs/schedule` `@Cron` in `core/scheduler/scheduler.tasks.ts` is the (only) scheduling mechanism — no BullMQ/queue anywhere. Reused the existing grade-lock sweep pattern (`grade-lock-auto.service.ts`: service + repo + `auditLogService` with `actorId: 'system'`).

- `enrollment-registrar.repository.ts` — `findExpiredPendingApplications(now)` (status `pending` + `enrollmentPeriod.lock_date <= now`) and `lockApplication(id)` (→ `locked`, `locked_at`).
- `enrollment-auto-lock.service.ts` (new) — `lockExpired()` loops matches, locks each, writes audit `ENROLLMENT_APPLICATION_AUTO_LOCK` with `actorId: 'system'`.
- `scheduler.tasks.ts` — `@Cron(EVERY_HOUR) handleAutoLockEnrollmentApplications()`.
- `scheduler.module.ts` — imports `EnrollmentPortalModule` (exports `EnrollmentAutoLockService`). No new dependency.

### Verified (live, cron temporarily set to 10s then reverted)
| Application | before | after sweep | ✓ |
|---|---|---|---|
| `pending`, period `lock_date` in past | pending | **locked**, `locked_at` set | ✓ |
| `pending`, period `lock_date` in future | pending | **pending** (not touched) | ✓ |
| `approved` in expired period | approved | **approved** (never re-locked) | ✓ |

Idempotency: after 2+ sweep windows the `AUTO_LOCK` audit count stayed at **1** (already-locked rows are filtered out; no double-log, no error).

### Product flag (not invented silently)
The `EnrollmentApplicationStatus` enum has **no `expired` state**. After a period's `end_date` passes, an application that was never approved/rejected is left `locked` indefinitely (it was locked at `lock_date` and stays locked). No `expired` value was added to the schema — flagging for a product decision whether an explicit "expired/closed" state is wanted before adding it.
