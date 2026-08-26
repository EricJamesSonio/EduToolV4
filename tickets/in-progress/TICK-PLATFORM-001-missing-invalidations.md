# TICK-PLATFORM-001 — Fix missing React Query invalidations for resets and uploads

Status: in-progress
Priority: high
Created: 2026-08-27
Created by: agent
Assigned to: agent
Started: 2026-08-27
Worktree: ../EduToolV4-worktrees/TICK-PLATFORM-001-missing-invalidations
Branch: agent/TICK-PLATFORM-001-missing-invalidations

## Problem

Several mutations lack invalidateQueries so UI stays stale until manual reload: platform admin resetPassword (platform/admins page and [id] page), admin students resetPassword (admin/students page and ResetPasswordDialog), and direct apiClient uploads (/uploads/profile) in ProfileContent/EditEducatorDialog/EditStudentDialog that use setQueryData instead of invalidation. Needs realtime via factory keys.

## Goal

1. Add invalidateQueries to resetPassword mutations (platform admins all, admin students all/list) so UI refreshes realtime.
2. Replace direct apiClient upload handling with useMutation + queryKeys.auth.me() / admin.* invalidation.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md
- frontend/src/app/platform/admins/page.tsx
- frontend/src/app/platform/admins/[id]/page.tsx
- frontend/src/app/admin/students/page.tsx
- frontend/src/components/admin/student/detail/ResetPasswordDialog.tsx
- frontend/src/components/shared/ProfileContent.tsx
- frontend/src/components/admin/educator/EditEducatorDialog.tsx
- frontend/src/components/admin/student/detail/EditStudentDialog.tsx

## Acceptance Criteria

- [ ] resetPassword mutations invalidate factory keys
- [ ] upload/profile uses mutation with invalidation
- [ ] tsc pass

## Confidence

Score: 90/100

## Tests

- Targeted: not run
- Full suite: not run

## Blocker

None.

## Activity Log

2026-08-27 — Claimed

## Commits

None yet.

## Notes

Phase 5 of React Query factory fix. Groupy excluded per user request.
