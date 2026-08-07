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
