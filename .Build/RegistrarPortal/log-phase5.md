# Phase 5 Status Report — Frontend: Sections Page for Registrar (Create, Edit Capacity, Move Students)

## Investigation findings (before code)
- **Role gates:** `SectionDialog.tsx`, `SectionFormDialog.tsx`, and `/admin/sections/page.tsx` were inspected — **no** role-gating exists in any of them. They only guard on `ensureOrganization` (org context, not role). Since a registrar's `role` stays `'admin'`, no gate removal/adjustment was needed. Confirmed rather than assumed, per the phase doc.
- **Capacity floor error path:** `SectionDialog` (data-table page) already disposed of the backend 409 via a generic `toast.error` in `onError`. `SectionsPanel` (school-years) showed a *hardcoded* toast ("Failed to update section.") that discarded the backend message entirely. `SectionFormDialog` had no inline error surface at all.
- **Move-student reuse:** `AssignSectionDialog.tsx` (under `admin/school-years/program-view/`) was already a self-contained, level/course/strand-filtered section picker calling the Phase 3 endpoint (`useUpdateProgramEnrollment` → PATCH `/school-years/:schoolYearId/enrollments/programs/:programEnrollmentId` with `{ section_id }`). It was directly reusable for both entry points; no new picker was built.

## What changed
1. **Inline capacity-floor (and general save) errors, verbatim backend message:**
   - `frontend/src/components/admin/section/SectionDialog.tsx` — added `formError` state; `onError` now copies `err.response.data.message` into it instead of toasting; passed to `DialogForm` via its existing `error` prop; cleared on success and close. `DialogForm` renders it inline in the form (not a toast).
   - `frontend/src/components/admin/school-years/SectionFormDialog.tsx` — added optional `error?: string | null` prop and rendered an inline `<p className="text-xs text-destructive">` in the form body.
   - `frontend/src/components/admin/school-years/SectionsPanel.tsx` — wired create/update `onError` to `setFormError(err?.response?.data?.message ?? …)` (replacing the generic "Failed to…" toasts); passes `error={formError}` to both create and edit dialogs; resets on close/success. Since Phase 2's backend message includes the specific numbers, the 409 now shows verbatim inline.
2. **Move-student entry point #1 — From Sections:**
   - `frontend/src/components/admin/school-years/SectionDetailPanel.tsx` — `StudentsTab` now resolves each roster student to their `StudentSchoolYearEnrollment` + `ProgramEnrollmentSnapshot` (via `studentEnrollmentApi.getBySchoolYear(…, limit=MAX_SELECT_LIMIT)`), showing a **Move** button per student; it opens the shared `AssignSectionDialog` (filtered to the same level/course/strand, showing per-section capacity/`studentCount`). Hidden when the school year is ended.
   - Threaded `isEnded?: boolean` prop through `SectionDetailPanelProps` (default `false`) so the Move action can be disabled on ended school years (`SectionsPanel` now passes its own `isEnded`).
   - `AssignSectionDialog` now surfaces its own backend errors (level mismatch, section full) inline in the dialog (`formError` state rendered as a red paragraph) instead of only a toast — covers the "clear error, not silent failure" acceptance.
3. **Move-student entry point #2 — From Students:**
   - `frontend/src/components/admin/student/detail/StudentInfoCard.tsx` — each program-enrollment card got a **Move** button (hidden when `isEnded`); it maps the program enrollment back to its parent `StudentSchoolYearEnrollment` and opens the same `AssignSectionDialog`.
   - `frontend/src/app/admin/students/[id]/page.tsx` — computed `activeSchoolYearIsEnded` (active SY status === `'ended'`) and passed `schoolYearId` / `isEnded` to `StudentInfoCard`.

## Verification
- `npx tsc --noEmit` — unchanged from the phase-4 baseline: the only remaining errors are the 42 pre-existing lines in test files (`CreateClassDialog.test.tsx`, `SubjectDialog.test.tsx`); zero errors in any changed file.
- `npx eslint` on the 7 changed files — 0 errors; 8 warnings, all pre-existing (unused `buildLevelLabel`/`Button`/`canSubmit` in `SectionDialog`, unused `Section` import + missing return type in `AssignSectionDialog`, pre-existing `exhaustive-deps` notes). None introduced by this phase.
- `npx next build` — **Compiled successfully** (Next.js 16, all routes).

## Acceptance check (frontend scope)
- ✓ Registrar can open "Create Section," fill/persist the form — no role gate blocks it.
- ✓ Editing a section's capacity below enrolled count surfaces the backend's Phase-2 message inline (verbatim), not a generic toast.
- ✓ Registrar can move a student to another section from the **Sections** view (roster Move button) and the **Students** view (enrollment-card Move button) — both reuse the same `AssignSectionDialog`.
- ✓ Moving into a full or level-mismatched section shows the backend's error message inline in the dialog.

## Deviations / notes
- No role-gate removal was performed because investigation confirmed no role gate exists in any target file (registrar's `role` stays `'admin'`, so `role === 'admin'`-style checks already pass). This is a positive confirmation, not a skipped step.
- The common 50/assign dialog was reused as-is (minor inline-error enhancement only); no duplicate picker was authored.
- UI-only enforcement remains the scope for v1 (backend “TODO” from the overview stands). No new backend files touched.