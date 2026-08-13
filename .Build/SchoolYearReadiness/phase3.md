# Phase 3 — Frontend: Checklist UI

## Goal

Show the readiness checklist, reusing `ReadinessDialog.tsx`'s existing visual pattern rather than building a new dialog style from scratch.

## Steps

1. **Investigate first.** Read `frontend/src/components/educator/grades/ReadinessDialog.tsx` in full — this is the pattern to mirror (structure, styling, how it lists pass/fail items).

2. **API layer**: add the `GET /school-years/:id/readiness` call to `api/admin/school-year.api.ts`.

3. **Component**: `components/admin/school-years/SchoolYearReadinessDialog.tsx` — lists each of the 7 checks, pass/fail per item, and for failing items shows the count + a short list of affected entities (subject/section/class names) from the backend's `entities` field. Style matches `ReadinessDialog.tsx`.

4. **Wire it in**: find wherever the "mark ready" action currently lives (`SchoolYearCard.tsx` or the school year detail page) and:
   - On attempting to mark ready: call the mark-ready endpoint; if it's rejected (Phase 2's block), show this dialog populated with the returned issues instead of a generic error toast
   - Optionally, add a "Check readiness" action that calls the read-only endpoint directly, so an admin can check status anytime without attempting the actual transition

## Acceptance check

- Attempting to mark an incomplete school year ready shows the checklist dialog with specific failing items, not a generic error
- The dialog's visual style is consistent with the existing `ReadinessDialog.tsx`, not a new one-off design

---

## AI Prompt

```
Context: EduTool frontend (Next.js). Backend readiness check + hard block +
read-only endpoint exist (Phases 1-2).

Step 1 — investigate: read frontend/src/components/educator/grades/ReadinessDialog.tsx
in full — this is the pattern to mirror for structure and styling.

Step 2: Add the GET /school-years/:id/readiness call to
frontend/src/api/admin/school-year.api.ts.

Step 3: Build components/admin/school-years/SchoolYearReadinessDialog.tsx —
lists all 7 checks, pass/fail per item, failing items show count + affected
entity names from the backend's entities field. Match ReadinessDialog.tsx's
visual style.

Step 4: Find where the "mark ready" action currently lives (check
SchoolYearCard.tsx and the school year detail page) and wire this in: on a
rejected mark-ready attempt, show this dialog with the returned issues
instead of a generic error. Also add a standalone "Check readiness" action
that calls the read-only endpoint directly.

Show me your Step 1 findings, then diffs.
```
