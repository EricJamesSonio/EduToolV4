# TICK-PLATFORM-001 — Fix missing React Query invalidations for resets and uploads

Status: ready-for-review
Priority: high
Created: 2026-08-27
Created by: agent
Assigned to: agent
Started: 2026-08-27
Worktree: ../EduToolV4-worktrees/TICK-PLATFORM-001-missing-invalidations
Branch: agent/TICK-PLATFORM-001-missing-invalidations

## Problem

Several mutations lack invalidateQueries so UI stays stale until manual reload: platform admin resetPassword (platform/admins page and [id] page), admin students resetPassword (admin/students page and ResetPasswordDialog), and direct apiClient uploads (/uploads/profile) in ProfileContent that use setQueryData without invalidation.

## Goal

1. Add invalidateQueries to resetPassword mutations (platform admins all, admin students all/list) so UI refreshes realtime.
2. Ensure profile upload invalidates auth.me.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md
- frontend/src/app/platform/admins/page.tsx
- frontend/src/app/platform/admins/[id]/page.tsx
- frontend/src/app/admin/students/page.tsx
- frontend/src/components/admin/student/detail/ResetPasswordDialog.tsx
- frontend/src/components/shared/ProfileContent.tsx

## Acceptance Criteria

- [x] resetPassword mutations invalidate factory keys (platform.admins.all, admin.students.all/detail)
- [x] ProfileContent publishUser also invalidates auth.me
- [x] tsc --skipLibCheck pass

## Confidence

Score: 90/100

## Tests

- Targeted: tsc --noEmit --skipLibCheck pass (junction)
- Full suite: not run
- Development integration: not run

## Blocker

None.

## Activity Log

2026-08-27 — Claimed, creating worktree from development.
2026-08-27 — Added invalidations to 5 files, verified tsc, committed 4ce84a30.
2026-08-27 — Ready for review.

## Commits

- 4ce84a30 feat(platform): add missing React Query invalidations for resets and profile

## Notes

Phase 5 of React Query factory fix. Groupy excluded per user request. Worktree GROUPY removed (cancelled).
