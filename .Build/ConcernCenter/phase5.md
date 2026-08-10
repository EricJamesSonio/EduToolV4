# Phase 5 — Frontend: Reusable Concern Center (Student)

## Goal

The reusable component itself, mounted for students only this pass. Built so it isn't internally student-specific — the API calls determine scope, the component just renders what it's given.

## What to build

1. **`frontend/src/api/student/concern.api.ts`** (or a shared `api/shared/concern.api.ts` if that fits your existing convention better — check how other student-only APIs are organized first) — calls for: get categories, submit concern, list mine, get thread, reply.

2. **`frontend/src/hooks/student/useConcerns.ts`** — TanStack Query hooks following the existing `hook-factory.utils.ts` pattern used elsewhere (check `useStudentAssessments.ts` or similar for the exact shape to mirror).

3. **`frontend/src/components/shared/concern-center/ConcernCenterFeature.tsx`** — the reusable piece:
   - Submit form: category dropdown (from `GET /concerns/categories`), subject, message body
   - "My Concerns" list: subject, category badge, status badge, last activity time — reuse `DataTable.tsx` or `ListItemCard.tsx` per whatever list pattern fits best here (check both before picking)
   - Thread view: messages in chronological order, sender name + timestamp, reply box at the bottom
   - Empty state: reuse `EmptyState.tsx`
   - Do not import anything from `student/`-specific paths inside this component — pass data in via props/hooks so it stays genuinely reusable for a future educator mount

4. **`frontend/src/app/student/concerns/page.tsx`** — thin wrapper: renders `<ConcernCenterFeature />`, wires in the student-specific API hooks from step 2.

5. **Nav**: add "Concerns" to `StudentSidebar.tsx`. Do not touch `EducatorSidebar.tsx` or `AdminSidebar.tsx` in this phase.

## Acceptance check

- Student can view categories, submit a concern, see it in their list, open the thread, reply, and see status update to `open` if it was resolved and they replied
- No `student/`-specific imports inside `ConcernCenterFeature.tsx`

---

## AI Prompt

```
Context: EduTool frontend (Next.js App Router + React + TanStack Query). Backend
endpoints from Phases 2 and 4 exist: GET /concerns/categories, POST /concerns,
GET /concerns/mine, GET /concerns/:id, POST /concerns/:id/reply.

Task:
1. Add frontend/src/api/student/concern.api.ts with calls for: getCategories,
   submitConcern, listMine, getConcernThread, replyToConcern. Follow the exact
   pattern of an existing file in api/student/ (check assessment.api.ts for style).

2. Add frontend/src/hooks/student/useConcerns.ts using the existing
   hook-factory.utils.ts pattern (check how useStudentAssessments.ts is built and
   mirror that shape) — expose hooks for categories, my-list, thread, submit
   mutation, reply mutation.

3. Build frontend/src/components/shared/concern-center/ConcernCenterFeature.tsx:
   - Submit form (category select + subject + body)
   - List of the caller's own concerns (check DataTable.tsx and ListItemCard.tsx,
     pick whichever fits a support-ticket-style list better)
   - Thread view (messages chronological, reply box)
   - Use EmptyState.tsx for the empty-list state
   - This component must not import anything from a student/-specific path —
     accept data and callbacks via props so it's reusable for an educator mount
     later without modification.

4. Add frontend/src/app/student/concerns/page.tsx as a thin wrapper that renders
   ConcernCenterFeature and wires in the hooks from step 2.

5. Add a "Concerns" nav item to frontend/src/components/layout/StudentSidebar.tsx.
   Do not touch EducatorSidebar.tsx or AdminSidebar.tsx in this phase.

Show me the file structure you plan to create before writing code, then diffs.
```
