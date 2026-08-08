# Phase 6 — Frontend: Students Scope, Manual Enrollment, Periods Lock-Down + QA Pass

## Goal
Close out the remaining scoped pages, then walk the full matrix end-to-end as a registrar test account.

## What to check/change

1. **Students — limited edit**
   `frontend/src/components/admin/student/detail/EditStudentDialog.tsx`
   Currently likely allows editing full student profile. For a registrar-flagged account, restrict the editable fields to **contact info and status only** — everything else (academic assignment, enrollment records, etc.) should render read-only or be hidden from this dialog for registrars. Use the `isRegistrar` flag from Phase 4's auth context to conditionally render/disable fields — don't fork the component into two separate dialogs if a conditional field-set will do.

2. **Manual Enrollment — confirm full access**
   `frontend/src/app/admin/enrollment/enroll/page.tsx` and its `_components/`
   This should already work for registrars once Phase 4's nav change makes it reachable — no field restrictions needed here, registrar gets full enroll/unenroll/view. Just confirm nothing inside this flow has a leftover `role === 'admin'`-style check that would coincidentally still pass (it will, since registrar's role is admin) but double check there's no separate, more specific gate.

3. **Enrollment Periods — read-only for registrar**
   `frontend/src/app/admin/enrollment-portal/periods/page.tsx` and `components/admin/enrollment-portal/EnrollmentPeriodModal.tsx`
   Hide/disable the "Create Period" button and any edit/delete actions on existing periods when `isRegistrar` is true. Registrar should still see the list (dates, status, share link) — just no mutation controls.

4. **QA pass — walk the full matrix**
   Using a registrar test account, verify against the final matrix from the overview doc:
   - Sidebar shows exactly: Enrollment Portal dashboard, Periods (view only), Applications (full), Manual Enrollment (full), Students (limited edit), Sections (full incl. move)
   - Everything else is absent from the sidebar
   - Section capacity floor rule triggers correctly (test with a section that has enrolled students)
   - Student move validates level/course/strand match and capacity
   - Applications: approve, reject (with reason), unlock all work end-to-end and trigger the expected downstream effects (account creation on approve, email on reject)

## Acceptance check
Full matrix from `00-project-overview.md` verified working, end to end, as an actual registrar login — not just code review.

---

## AI Prompt

```
Context: EduTool frontend. isRegistrar is available via auth context (Phase 4).

Task:
1. Open frontend/src/components/admin/student/detail/EditStudentDialog.tsx.
   When the current user isRegistrar, restrict editable fields to contact info
   and status only — render other fields as read-only (not hidden, so registrar
   still has visibility) rather than removing them. Use a single component with
   conditional field-level editability, do not fork into two dialogs.

2. Open frontend/src/app/admin/enrollment/enroll/page.tsx and its _components/.
   Confirm there is no role or permission check more specific than the general
   admin route access that would block a registrar-flagged account. Report findings;
   only change something if you find an actual blocker.

3. Open frontend/src/app/admin/enrollment-portal/periods/page.tsx and
   frontend/src/components/admin/enrollment-portal/EnrollmentPeriodModal.tsx.
   When isRegistrar is true: hide/disable the "Create Period" trigger and any
   edit/delete controls on existing period rows. The list itself (view) stays
   fully visible.

4. After making these changes, give me a manual QA checklist I can walk through
   with a real registrar test account, covering: sidebar contents, periods
   (view-only enforced), applications (full CRUD works), manual enrollment (full
   access works), students (edit restricted to contact/status), sections (create/
   edit-capacity/move all work, capacity floor rejects correctly).

Show diffs before applying.
```

---

## After this phase

The registrar portal scope defined in `00-project-overview.md` is fully implemented. The one deliberately deferred item — API-level lockdown beyond the UI — remains marked with the `TODO` comment from Phase 1's context and should be revisited if/when registrar hiring moves beyond "trusted staff."