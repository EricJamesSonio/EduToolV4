# Phase 6 — Frontend: Admin/Registrar Concern Center Messages

## Goal

Staff-facing inbox: list all concerns in the org, filter, reply, resolve/reopen, manage categories. Available to both admin and registrar (per the earlier registrar-scoping decisions, add this to the registrar-visible nav set).

## What to build

1. **`frontend/src/api/admin/concern.api.ts`** — calls for: list all (with filters), get thread, reply, resolve, reopen, category CRUD.

2. **`frontend/src/hooks/admin/useConcerns.ts`** and **`useConcernCategories.ts`** — following existing `hooks/admin/` conventions (check `useSections.ts` for list+filter+pagination shape, `useGradingScales.ts` or similar for a CRUD-with-mutations shape to mirror for categories).

3. **`frontend/src/app/admin/concerns/page.tsx`**:
   - Filter bar: status, category, sender role — reuse whatever filter-bar pattern `StudentFilterBar.tsx`/`ClassesFilterBar.tsx` establishes
   - List: reuse `DataTable.tsx`, columns for subject/category/status/sender/last activity
   - Thread panel (side panel or dedicated row-click view — check `SectionDetailPanel.tsx` for a panel pattern already in use) with reply box, resolve/reopen buttons
   - Category management: a simple inline section or modal (`components/admin/concern/CategoryManagerDialog.tsx`) — list categories, add new, edit label, toggle active. Do not add a delete button — deactivate only, matching the backend's design.

4. **Nav**: add "Concerns" to `AdminSidebar.tsx`'s item list, and mark it `registrarVisible: true` in the same nav-config mechanism built during the Registrar Portal phases (Phase 4 of that plan) — this feature is explicitly available to both admin and registrar, no restriction between them.

## Acceptance check

- Admin and registrar-flagged accounts both see "Concerns" in nav and have identical capability on this page (list, filter, reply, resolve, reopen, manage categories) — no difference in what's rendered based on `isRegistrar` for this specific feature
- Category manager: adding a category makes it immediately available in the student submit form's dropdown; deactivating one removes it from that dropdown without affecting existing concerns that reference it

---

## AI Prompt

```
Context: EduTool frontend. Backend staff endpoints from Phase 4 exist:
GET /concerns/staff, GET /concerns/staff/:id, POST /concerns/staff/:id/reply,
PATCH /concerns/staff/:id/resolve, PATCH /concerns/staff/:id/reopen,
POST /concerns/categories, PATCH /concerns/categories/:id.

The registrar nav-scoping mechanism (a per-item `registrarVisible` flag) was
built in an earlier feature (Registrar Portal, Phase 4) — find it in
frontend/src/components/layout/AdminSidebar.tsx before adding a new item.

Task:
1. Add frontend/src/api/admin/concern.api.ts with calls for: listAll (accepting
   status/category/senderRole filters + pagination), getThread, reply, resolve,
   reopen, and category CRUD (create, update).

2. Add frontend/src/hooks/admin/useConcerns.ts and useConcernCategories.ts
   following the existing hooks/admin/ conventions — check useSections.ts for
   the list+filter+pagination hook shape to mirror.

3. Build frontend/src/app/admin/concerns/page.tsx:
   - Filter bar (status/category/senderRole) — check ClassesFilterBar.tsx or
     StudentFilterBar.tsx for the pattern to reuse
   - List via DataTable.tsx
   - A thread/detail panel with reply box and resolve/reopen actions — check
     SectionDetailPanel.tsx for an existing panel pattern to mirror
   - A category manager (new component, components/admin/concern/CategoryManagerDialog.tsx)
     — list, add, edit label, toggle active. No delete action — deactivate only.

4. Add "Concerns" to the AdminSidebar.tsx nav config, using the SAME
   registrarVisible mechanism already in that file (set it visible for
   registrar — this feature is available to both admin and registrar equally,
   with no capability difference between them on this page).

Show me the file structure you plan to create before writing code, then diffs.
```
