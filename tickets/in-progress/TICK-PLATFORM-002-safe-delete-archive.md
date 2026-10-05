# TICK-PLATFORM-002 — Safe delete / archive: School Year, Department, Subject, Educator

Status: in-progress
Priority: high
Created: 2026-10-05
Created by: agent
Assigned to: agent
Started: 2026-10-05
Branch: development (owner-directed; no feature worktree — see Notes)

## Problem

Four admin entities could be destroyed destructively, blindly, or not at all:

- **Department (program)** — deleted with a blocker check that only looked at
  levels/courses/strands, with no transaction, so a partial delete could commit.
- **School Year** — deleted pending-only via a 13-model usage scan, no transaction.
- **Subject** — had **no `DELETE` route at all** and no soft-delete column, despite
  classes/grades/transcripts referencing it forever.
- **Educator** — gated on active classes only, performed a **silent soft-delete with
  no audit log entry**, and left orphaned teachable links, meetings, grade locks and
  notifications behind.

## Goal

One shared, auditable safe-delete contract applied to all four:

1. `GET /<entity>/:id/deletion-check` → `{ canDelete, blockers[], willDelete[] }`
   (`outcome: "delete" | "archive"` for subjects).
2. `DELETE /<entity>/:id` re-runs the **same check inside the transaction** and
   throws `ConflictException` naming what to unassign first.
3. Every cascade runs in **one `$transaction`** via the existing `runInTx` wrapper.
4. Every delete/archive/restore writes an **audit log** entry.
5. Subjects gain `deleted_at` and are **archived instead of hard-deleted** once any
   class references them, so transcript/grade/class history keeps resolving.

## Relevant Areas

- backend/src/commons/utils/deletion-report.util.ts (new — shared formatter)
- backend/src/modules/{program,school-year,subject,educator}/*
- backend/prisma/schema.prisma (Subject.deleted_at + @@index([org_id, deleted_at]))
- backend/prisma/migrations/20260930167000_subject_soft_delete
- frontend/src/components/shared/DeleteEntityDialog.tsx (new)
- frontend/src/components/shared/ConfirmDialog.tsx (added `hideCancel`)
- frontend/src/types/admin/deletion.types.ts (new)

## Acceptance Criteria

- [x] All four entities expose `GET /:id/deletion-check` (admin-only, org-scoped)
- [x] `DELETE` re-checks inside `$transaction` and blocks with a readable message
- [x] Department cascades children-first (sections → subjects → levels → courses →
      strands → terms → semesters → program), spec asserts call order
- [x] School Year reuses the shared program cascade — no duplicated delete logic
- [x] Subject hard-deletes when class-free, archives when any class references it;
      archived subjects hidden from selectable queries, visible in history queries
- [x] Educator blocks on classes/teachable links/meetings/ownership logs/grade locks
- [x] Audits: program_deleted, school_year_deleted, subject_deleted/archived/restored,
      educator_deleted
- [x] Frontend: 3-state dialog (checking → blocked → confirm) for all four
- [x] Department delete no longer gated on `type === "custom"`
- [x] School Year delete available on both the list card and the [id] detail page

## Open questions resolved

1. `SubjectCompletionOverride` on subject delete → **cascade-deleted** with the
   subject (class-free subjects have no meaningful overrides to preserve).
2. Educator with history → **strictly blocked**, no deactivate shortcut.
3. School Year delete placement → **both** card and detail page (parity with Educator).
4. Calendars / grading-scheme assignments rely on existing DB cascade; verified, not
   re-deleted.

## Confidence

Score: 92/100

## Tests

- Backend `tsc --noEmit`: 0 errors
- Backend eslint: 0 errors
- Deletion specs: 3 suites / 24 tests pass (program, subject, school-year)
- Frontend `tsc --noEmit`: 0 errors
- Frontend eslint: 0 errors on touched files
- Frontend jest: 310/310 pass (30 suites)
- `next build`: pass, 63/63 pages
- `prisma migrate status`: up to date (97 migrations); `migrate diff`: no difference

### Pre-existing failures NOT caused by this ticket

- `educator.service.spec.ts` — 4 failures in `bulkCreate`/email dedup; this diff only
  adds mocks, never touches that code (matches baseline debt in known-issues.md).
- `useTeachableSeed.test.tsx` — JavaScript heap OOM at 4 GB, reproduced in isolation;
  neither the test nor its hook is in this diff.

## Blocker

None.

## Activity Log

2026-10-05 — Resumed work left uncommitted in the main checkout by a stalled agent
(the agent hung on a malformed `Select-String -Path ... -Recurse` without a file
filter). Audited all 76 files: intact and compiling, nothing half-written.
2026-10-05 — Closed the one real gap: School Year had no delete entry point on the
[id] detail page (only the list card).
2026-10-05 — Cleared 2 unused-import lint warnings in the new specs.

## Commits

- (see below)

## Notes

Worked directly in the main checkout on `development` at the owner's explicit
direction, because the previous agent had been editing there and its work was
uncommitted in that tree. This bypasses the worktree + reviewer-merge path — flagging
that this lands unreviewed. Precedent: TICK-SUBJECT-002 records the same
owner-directed arrangement.

Educator blockers surfaced = 7 of ~12 candidate relations. The remainder
(`Notification`, groupy messages, meeting chat, audit-log actor) are either
explicitly deleted or are **plain string columns with no FK** (GroupyMessage.
sender_account_id, MeetingChatMessage.sender_id); the Account itself is
soft-deleted so those references keep resolving to history.

`GET /educators/:id/deletion-check` is declared **before** `@Get(':id')` in the
controller so the nested route is never shadowed.