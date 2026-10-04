# TICK-GRADE-006 — Move educator grades/lock mutations into React Query hooks

Status: ready-for-review
Priority: high
Created: 2026-08-26
Created by: agent
Assigned to: agent
Started: 2026-08-26
Finished: 2026-08-26
Worktree: ../EduToolV4-worktrees/TICK-GRADE-006-grades-mutation-hooks
Branch: agent/TICK-GRADE-006-grades-mutation-hooks
Commit: 6d245f91

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

- [x] No `apiClient` import remains in grades/page.tsx, grades/[termId]/page.tsx,
      StatusCell.tsx or PublishedGradesPage.tsx
- [x] Manual score commit on both grades pages invalidates
      `queryKeys.educator.grades.list(classId, termId)`
- [x] Lock and unlock invalidate `grades.all` + `gradeLock.list(classId)`
- [x] `educatorGradeLockApi.unlockClass` POSTs `{ reason }` to
      `/grade-lock/:classId/unlock` (matches backend UnlockClassDto)
- [x] StatusCell uses `useUpdateSubmissionStatus` (same URL/payload as before) —
      NOT `useAssessmentStatusOverride`, which is a different endpoint
- [x] `refreshKey` removed from grades/page.tsx and DefaultGradeTable props
- [x] UI, copy and API contracts unchanged
- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` pass

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

- Targeted: `npx tsc --noEmit --skipLibCheck` — PASS (0 errors)
- Targeted: `eslint` on all 8 changed files — PASS (0 problems)
- Full suite: `npm run lint` — PASS (clean)
- Full suite: `npm test` — 1 pre-existing failure, unrelated to this change.
  `src/api/__tests__/client.test.ts` › "warns on overfetch (>3 calls in 5s)"
  fails identically on the unmodified base commit (verified: 1 failed / 11 passed
  before any of this ticket's edits). `src/api/client.ts` is not touched here.
  Remaining 10 suites / 99 tests PASS.
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
2026-08-26 — Implemented. Reshaped `useSetManualScore` so `studentId` is a mutation
variable instead of a hook arg: both grade tables commit for an arbitrary row, and
the hook had zero prior call sites, so this avoided a near-duplicate hook. It now
invalidates both the term-scoped and class-scoped grade lists.
2026-08-26 — Removed the `refreshKey` remount hack. It was a pure passthrough prop
that was never read; `onRefresh` now calls the `useClassGrades` refetch, which is
what `StatusCell`'s `onStatusChange` actually needed.
2026-08-26 — tsc + eslint + full lint pass. One pre-existing jest failure in
client.test.ts confirmed present on the unmodified base.
2026-08-26 — Committed 6d245f91. Ready for review (stacked).

## Commits

- 6d245f91 feat(grade): move educator grades/lock mutations into React Query hooks

## Notes

Stacked PR. Rebase onto development after TICK-GRADE-001 merges.