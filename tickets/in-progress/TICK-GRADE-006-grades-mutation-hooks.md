# TICK-GRADE-006 — Move educator grades/lock mutations into React Query hooks

Status: in-progress
Priority: high
Created: 2026-08-26
Created by: agent
Assigned to: agent
Started: 2026-08-26
Worktree: ../EduToolV4-worktrees/TICK-GRADE-006-grades-mutation-hooks
Branch: agent/TICK-GRADE-006-grades-mutation-hooks

> STACKED BRANCH. Branched from `agent/TICK-GRADE-001-educator-grades-realtime`
> (commit cf6b83c7), NOT from `development`. Open the PR against the TICK-GRADE-001
> branch. **This branch must be rebased onto `development` after TICK-GRADE-001
> merges.** Do not merge TICK-GRADE-006 into `development` directly.

## Problem

TICK-GRADE-001 (cf6b83c7) replaced ad-hoc query keys with factory keys on the
educator grades surface, but left every *mutation* as a raw `await` inside a
page or component. Remaining debt in `frontend/src`:

1. `app/educator/classes/[classId]/grades/[termId]/page.tsx:90-104` calls
   `apiClient.patch` directly for the manual category score and **performs no
   cache invalidation at all** — the table only updates on manual reload.
2. `app/educator/classes/[classId]/grades/[termId]/page.tsx:115-126` calls
   `apiClient.post` for grade lock, bypassing hooks.
3. `app/educator/classes/[classId]/grades/page.tsx:59-88` uses
   `gradeApi.setManualScore` inside a hand-rolled `try/catch` with a manual
   `setSaving` Set instead of the existing `useSetManualScore` mutation hook.
4. `app/educator/classes/[classId]/grades/page.tsx:90-125` lock + unlock are raw
   async calls; there is **no `useUnlockClassGrades` hook at all**.
5. `components/educator/published-grades/PublishedGradesPage.tsx:87-114` calls
   `gradeApi.publishStudent` in a loop and `educatorGradeLockApi.lockClass`
   directly, despite already instantiating `usePublishStudent`.
6. `components/educator/grades/StatusCell.tsx:121-137` patches submission status
   via raw `apiClient.patch`.
7. `app/educator/classes/[classId]/grades/page.tsx:41,317-321` keeps a
   `refreshKey` counter used to force a remount.

## Goal

1. Every grades/grade-lock mutation on the educator surface runs through a
   `useMutation`-based hook (`useMutationWithInvalidation`).
2. Add `useLockClassGrades` and `useUnlockClassGrades` to
   `hooks/educator/useGradeLock.ts`, plus the one allowed API-layer method
   `educatorGradeLockApi.unlockClass`.
3. Reuse the already-existing `useSetManualScore`, `usePublishStudent` and
   `useUpdateSubmissionStatus`; do not create duplicates.
4. Delete the `refreshKey` remount hack once invalidation covers the table.
5. Preserve existing toasts, error copy, and API request/response shapes exactly.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md
- shared/skills/database/MUST-HAVES.md (Grading invariants)
- frontend/src/hooks/educator/useGrades.ts
- frontend/src/hooks/educator/useGradeLock.ts
- frontend/src/hooks/educator/useSubmissions.ts
- frontend/src/hooks/queryKeys/educator.keys.ts
- frontend/src/api/educator/grade-lock.api.ts (ONLY file allowed to change in src/api/**)
- frontend/src/app/educator/classes/[classId]/grades/page.tsx
- frontend/src/app/educator/classes/[classId]/grades/[termId]/page.tsx
- frontend/src/components/educator/published-grades/PublishedGradesPage.tsx
- frontend/src/components/educator/grades/StatusCell.tsx

## Acceptance Criteria

- [ ] No `apiClient` import remains in grades/page.tsx, grades/[termId]/page.tsx,
      StatusCell.tsx or PublishedGradesPage.tsx
- [ ] Manual score commit on both grades pages invalidates
      `queryKeys.educator.grades.list(classId, termId)`
- [ ] Lock and unlock invalidate `grades.all` + `gradeLock.list(classId)`
- [ ] `educatorGradeLockApi.unlockClass` POSTs `{ reason }` to
      `/grade-lock/:classId/unlock` (matches backend UnlockClassDto)
- [ ] StatusCell uses `useUpdateSubmissionStatus` (same URL/payload as before) —
      NOT `useAssessmentStatusOverride`, which is a different endpoint
- [ ] `refreshKey` removed from grades/page.tsx and DefaultGradeTable props
- [ ] UI, copy and API contracts unchanged
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test` pass

## Confidence

- Score: 90/100
- Requirement clarity: 92 (explicit scope, 6 items enumerated by user)
- Codebase verification: 93 (read all 4 target files + 3 hook files + 2 api files;
  verified backend `POST /grade-lock/:classId/unlock` route and `UnlockClassDto`
  requires `reason: string`; verified `useUpdateSubmissionStatus` targets the same
  URL as StatusCell's current patch)
- Architecture fit: 90 (existing `useMutationWithInvalidation` + factory keys)
- Edge cases: 85 (readiness-issues error shape on lock must be preserved; the
  publish-all loop is sequential and must stay sequential)
- Blast radius: 82 (educator grading = high stakes, but changes are mechanical
  extractions of already-invalidated calls)
- Assumption (80-94 band): the hardcoded `"Educator unlocked grades"` reason string
  already sent by `grades/page.tsx:114` is preserved verbatim, since the audit scope
  forbids changing the UI that collects the reason.

## Tests

- Targeted: not run yet
- Full suite: not run yet
- Development integration: not run (awaiting TICK-GRADE-001 merge + rebase)

## Blocker

None.

## Activity Log

2026-08-26 — Claimed. Audited overlap with TICK-GRADE-001 (cf6b83c7): that commit
handled query keys but left all mutations as raw awaits. Items 2/3/4 are partially
addressed (API calls moved behind the api layer, invalidations added) but not yet
moved into mutation hooks.
2026-08-26 — Correction to audit: StatusCell must use `useUpdateSubmissionStatus`,
not `useAssessmentStatusOverride` (different endpoint/payload). Confirmed with user.
2026-08-26 — Branched stacked from agent/TICK-GRADE-001-educator-grades-realtime.

## Commits

(none yet)

## Notes

Stacked PR. Rebase onto development after TICK-GRADE-001 merges.