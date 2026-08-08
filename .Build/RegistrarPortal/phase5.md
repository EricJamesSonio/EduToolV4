# Phase 5 — Frontend: Sections Page for Registrar (Create, Edit Capacity, Move Students)

## Goal
Registrar gets full working access to Sections: create new sections, edit capacity (up or down, respecting the Phase 2 floor), and move students between sections — without any admin-only gating blocking them.

## What to check/change

1. **`frontend/src/components/admin/section/SectionDialog.tsx`** and **`SectionFormDialog.tsx`** (under `admin/school-years/`)
   Check if either currently gates create/edit actions by role (e.g. `if (role !== 'admin') return null` or a disabled button). If such a check exists, it likely predates the registrar concept and probably checks `role === 'admin'` — which is still true for registrars, since their `role` field is unchanged. **Confirm there's no gate, rather than assuming there is one.** If a gate does exist and it's checking something registrar-incompatible, remove/adjust it so registrars pass.

2. **Capacity floor error handling**
   Wherever the section capacity edit form submits (likely inside `SectionFormDialog.tsx` or a shared mutation hook in `hooks/admin/useSections.ts`), make sure the `409 Conflict` error from Phase 2's backend validation surfaces as a clear inline form error (not a generic toast), showing the backend's message verbatim since it already includes the specific numbers.

3. **Move-student action — new UI surface**
   Two entry points, both calling the Phase 3 backend endpoint:
   - **From Sections**: on a section's roster/detail view (`SectionDetailPanel.tsx` or similar), add a "Move to another section" action per student row, opening a section picker filtered to the same level/course/strand and showing remaining capacity per option.
   - **From Students**: on a student's detail page (`admin/students/[id]`), if there's not already a section-related action, add one there too — reuse the same picker component rather than duplicating it.
   Check whether `components/admin/school-years/program-view/AssignSectionDialog.tsx` (found in Phase 3's investigation) can be extracted/reused for both entry points rather than building two separate dialogs.

## Acceptance check
- Registrar can open "Create Section," fill the form, and it saves
- Registrar can edit an existing section's capacity; lowering below enrolled count shows the backend's error message inline
- Registrar can move a student from one section to another (valid target) from both the Sections and Students views
- Attempting to move a student into a full or level-mismatched section shows a clear error, not a silent failure

---

## AI Prompt

```
Context: EduTool frontend (Next.js + React + TanStack Query). Backend from prior
phases: section capacity floor validation (409 with descriptive message) and a
student-section-reassignment endpoint (confirm exact route from Phase 3's findings).

Task:
1. Inspect frontend/src/components/admin/section/SectionDialog.tsx,
   SectionFormDialog.tsx, and any role checks inside them or their parent pages
   (frontend/src/app/admin/sections/page.tsx). Report whether any existing check
   would block a registrar-flagged admin account (role stays 'admin' for
   registrars, so role==='admin' checks pass fine — but check for anything more
   specific). Remove/adjust only if something actually blocks registrars.

2. Find the mutation hook that submits section capacity edits (likely in
   frontend/src/hooks/admin/useSections.ts). Ensure a 409 error response is
   surfaced as an inline form field error using the exact backend message, not
   a generic toast.

3. Build a "move student to section" flow:
   - Reuse frontend/src/components/admin/school-years/program-view/AssignSectionDialog.tsx
     if it's adaptable, rather than building a new dialog from scratch. It should
     let the user pick a target section filtered to matching level/course/strand,
     showing each option's current enrolled count / capacity.
   - Add an entry point from the section roster/detail view (find
     SectionDetailPanel.tsx or equivalent) — a per-student "Move" action.
   - Add an entry point from the student detail page
     (frontend/src/app/admin/students/[id]/page.tsx) if one doesn't exist.
   - Both entry points should call the same underlying mutation/component —
     do not duplicate the dialog.

4. Surface backend validation errors (level mismatch, section full) as clear
   inline messages, not silent failures or generic toasts.

Show me your plan for which files you'll touch before writing code, then show
diffs.
```