# Handoff — TICK-ACADEMIC-001

Moved to ready-for-review (d3b59e9c). Worktree: ../EduToolV4-worktrees/TICK-ACADEMIC-001-register-academic-history-query

## What was done (Phase 1)

- frontend/src/hooks/queryKeys/student.keys.ts:96 — added academicHistory {all, full, timeline(params)} with factory spread [...studentKeys.all,'academicHistory',...]
- frontend/src/hooks/queryKeys/admin.keys.ts:388 — added academicHistory {all, timeline(studentId,params), fullHistory(studentId)}
- frontend/src/hooks/admin/useAcademicHistory.ts:1 — migrated 4 hooks from raw [\"student\",\"academicHistory\",...] and suffixed students.detail to factory keys + meta {preset:'detail'}, added useInvalidateMyAcademicHistory / useInvalidateAcademicHistory helpers.
- No raw keys remain for academicHistory; useAppQuery VALID_ROOTS now enforced; invalidation via queryKeys.student.academicHistory.all gives realtime UI without reload (swap to preset 'realtime' for 30s poll if product wants).
- Verified: tsc --noEmit --skipLibCheck pass (via junction node_modules), eslint pass on 3 files, grep zero raw academicHistory.

## Next phases (audit catalog) — create separate tickets

Catalog from very-thorough subagent (25 ad-hoc keys, 10 direct apiClient, 5 missing invalidations):

### Phase 2 — Admin short keys (low blast)
TICK-ADMIN-002? or reuse ACADEMIC domain — files: GradingScaleList.tsx:63, CreateGradingScaleDialog.tsx:98, grading-scales/page.tsx:51, GradingScaleAssignmentSection.tsx:90, TemplateAssignmentPanel.tsx:116, SchoolYearCard.tsx:100/EditSchoolYearDialog.tsx:56, useSemesterTemplate.ts:54, students/import/page.tsx:91. Replace raw [\"admin\",\"gradingScales\"] / [\"school-years\"] kebab / 'credentials-list' suffix with queryKeys.admin.* factory.

### Phase 3 — Educator grades/lock (highest staleness risk, touches grading invariants)
TICK-GRADE-xxx — published-grades/PublishedGradesPage.tsx:24, grades/page.tsx:38/62/83/104/306, [termId]/page.tsx:94/118, StatusCell.tsx:118, useSubmissions.ts:8, usePresentations.ts:21/29, useAttendance.ts:34. Replace direct apiClient.patch/post + ad-hoc [\"grades\"]/[\"grade-lock\"]/refreshKey hack with useMutationWithInvalidation invalidating educator.grades/gradeLock/gradingScale factory keys.

### Phase 4 — Groupy + Landing roots
TICK-GROUPY-xxx / TICK-PLATFORM-xxx — landing/useLandingOrganizations.ts:6 ['landing'], groupy/* 6 hooks (groupyCache, useGroupyUnread/Messages/PollDetail/Stickers/Members/ActiveMeeting) raw useQuery/useInfiniteQuery with groupy-* roots. Decide: extend VALID_ROOTS with 'groupy'/'landing' or map to platform/student factory.

### Phase 5 — Missing invalidations + uploads
TICK-AUTH/INFRA — platform/admins/page.tsx:48 resetMutation, platform/admins/[id]/page.tsx:40, admin/students/page.tsx:51, ResetPasswordDialog.tsx:35 (no invalidate), plus ProfileContent.tsx:227 / EditEducatorDialog:87 / EditStudentDialog:97 direct apiClient.post \"/uploads/profile\".

All detailed in subagent report attached to ticket. Onboarder docs already committed on development as ed2d214d (project.md, CORE Part 3, FACTS.md) — included via feature branch merge, no extra push needed.

## Reviewer actions

- Merge agent/TICK-ACADEMIC-001-register-academic-history-query into development (fast-forward). Re-run full lint/typecheck/build on development.
- Then move ticket-state TICK-ACADEMIC-001: ready-for-review → merged → completed, update .ai/workspace/context/current-state.md + changelog/CHANGELOG.md, delete handoff.

## Open decision

- Swap preset 'detail' (5m stale, invalidate-driven) to 'realtime' (30s poll) for student academicHistory if PM wants true realtime — one-line change in useAcademicHistory.ts.
