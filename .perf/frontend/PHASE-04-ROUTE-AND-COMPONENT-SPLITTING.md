# Phase 04 — Route and Component Splitting

**Priority:** Before Phase 02  
**Risk:** Low to medium  
**Goal:** Remove confirmed heavy optional UI from initial route entries without changing behavior.

This phase has two independent batches:

- **Phase 04A — Defer admin create dialogs and Zod.**
- **Phase 04B — Defer the student-detail hierarchy/ReactFlow modal.**

Both changes should be measured with fresh route manifests. “The import is dynamic” is not an acceptance criterion by itself.

## Phase 04A — Defer admin create dialogs

### Evidence

The approximately **265 KB raw Zod chunk** (`03f0ywctsn4hn.js`) appears in the initial entry for:

- `/admin/students` — 987 KB total
- `/admin/educators` — 976 KB total
- `/admin/registrars` — 962 KB total

The dialogs are already rendered conditionally only when the user opens them, but their static imports still place the modules and Zod in the entry bundle.

Relevant files:

- `frontend/src/app/admin/students/page.tsx`
- `frontend/src/app/admin/educators/page.tsx`
- `frontend/src/app/admin/registrars/page.tsx`
- `frontend/src/components/admin/student/CreateStudentDialog.tsx`
- `frontend/src/components/admin/educator/CreateEducatorDialog.tsx`
- `frontend/src/components/admin/registrar/CreateRegistrarDialog.tsx`
- `frontend/src/utils/validation.util.ts`

The create dialogs import shared validation helpers from `validation.util.ts`, which imports Zod. This pulls the schema library into any route that statically bundles the dialog.

### Change

Use `next/dynamic` for the appropriate create dialogs:

- `CreateStudentDialog`
- `CreateEducatorDialog`
- `CreateRegistrarDialog`

Preserve:

- the existing conditional `{createOpen && ...}` rendering;
- all props and callbacks;
- validation schemas and error messages;
- loading and server-error behavior;
- focus, close, and reopen behavior.

Do not change the validation module in this batch unless a separate, measured reason exists. Do not dynamically load unrelated dialogs without evidence.

### Acceptance criteria

- Fresh build and typecheck pass.
- After the fresh build, inspect the new route manifests.
- Confirm whether `03f0ywctsn4hn.js` (or the equivalent Zod chunk) has actually left the initial entries for all three routes.
- Record the new raw entry totals.
- Open and close each dialog.
- Test valid submission, invalid submission, server error, loading state, and reopen after success.
- Confirm no duplicate or missing query invalidation.

### Notes

A dynamic import may add a small delay on first open. That is acceptable for rarely opened create dialogs if the initial route benefit is measured. Prefetch-on-hover can be considered later, but is not part of this batch.

## Phase 04B — Defer ReactFlow

### Evidence

The approximately **180 KB raw ReactFlow chunk** (`17.0z-20w_-mb.js`) appears in the initial JavaScript for `/admin/students/[id]` (935 KB total), even though the graph is only shown in a modal.

Import chain:

`frontend/src/app/admin/students/[id]/page.tsx`
→ `frontend/src/components/admin/student/detail/SubjectCompletionPanel.tsx`
→ `frontend/src/components/admin/subject/hierarchy/SubjectHierarchyModal.tsx`
→ `frontend/src/components/admin/subject/hierarchy/SubjectHierarchyGraph.tsx`
→ `@xyflow/react`

The modal is rendered only when the hierarchy state is set. The completion panel itself may be visible in a tab, so the smallest appropriate boundary matters.

### Change

Inspect the current `SubjectCompletionPanel.tsx` and dynamically load the smallest boundary that removes ReactFlow from the initial student-detail entry.

Prefer deferring the modal or graph boundary over deferring the entire completion panel. Do not break:

- the completion list;
- tab behavior;
- modal open/close;
- graph selection and status rendering;
- accessibility and focus behavior.

Do not modify the hierarchy routes that genuinely need the graph on first render unless separately measured.

### Acceptance criteria

- Fresh build and typecheck pass.
- Confirm `17.0z-20w_-mb.js` (or the equivalent ReactFlow chunk) is absent from the initial `/admin/students/[id]` entry.
- Confirm the chunk loads when the hierarchy modal opens.
- Record the new raw entry total.
- Open the completion tab and hierarchy modal; verify nodes, edges, statuses, selection, and close behavior.
- Test direct navigation and client-side navigation to the route.

## Exit criteria

- Both batches have fresh before/after manifest measurements.
- The targeted chunks are absent from the intended initial entries, or the investigation documents why not.
- Dialog and hierarchy behavior is unchanged.
- No unrelated dialogs or pages were lazily loaded without evidence.
