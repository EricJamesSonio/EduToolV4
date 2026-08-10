# Phase 6 — Frontend: Platform Owner Review UI

## Goal

Platform owner sees pending requests, reviews details, and can approve, reject, or flag specific fields for revision.

## Steps

1. **Investigate first.** Read `frontend/src/app/platform/requests/page.tsx` and `components/platform/RequestDetailDialog.tsx` — these already exist and likely already render request details and handle approve/reject in some form. Report what exists before building new UI on top of it.

2. **Extend the existing request detail view** (rather than building a parallel one) to add:
   - A "Request Revision" action alongside existing approve/reject actions
   - When "Request Revision" is chosen: a per-field flagging interface — each field in the request shows a toggle/checkbox ("flag this field") and, when flagged, a short text input for the note. Submits as the `fieldNotes` object Phase 3's endpoint expects.
   - If the request's current status is `needs_revision`, show the existing flags/notes in the detail view (read-only summary of what was already sent) alongside the option to send an updated set

3. **Reject flow**: confirm/extend the existing reject action to optionally include a reason (matches Phase 3/4's `reason?` parameter).

4. **List view** (`platform/requests/page.tsx`): confirm `needs_revision` renders with a distinct status badge alongside existing `pending`/`approved`/`rejected` badges (check `StatusBadge.tsx` for how new status variants get added there).

## Acceptance check

- Platform owner can approve, reject (with optional reason), or request-revision (flagging specific fields with notes) from the same detail view
- A `needs_revision` request shows a distinct status badge in the list
- Re-reviewing a resubmitted (auto-reopened to `pending`) request shows a clean slate, not stale flags from the prior round

---

## AI Prompt

```
Context: EduTool frontend (Next.js). Backend from Phases 1-4 exists: reject and
request-revision endpoints, revision_notes on RegistrationRequest.

Step 1 — investigate: read frontend/src/app/platform/requests/page.tsx and
frontend/src/components/platform/RequestDetailDialog.tsx in full. Report what
approve/reject UI already exists there before building anything new.

Step 2: Extend RequestDetailDialog.tsx (do not build a parallel/duplicate
detail view) to add:
- A "Request Revision" action button alongside whatever approve/reject
  actions already exist
- When selected, a per-field flagging UI: each of the request's fields shows a
  flag toggle and, when flagged, a short text note input. On submit, this
  calls the request-revision endpoint with a fieldNotes object matching what
  the backend expects (field name -> note string, only for flagged fields)
- If the request's current status is 'needs_revision', show its existing
  revision_notes as a read-only summary in the detail view

Step 3: Confirm or extend the existing reject action to support an optional
reason field, matching the backend's { reason?: string } parameter.

Step 4: In platform/requests/page.tsx, confirm the list's status badge
rendering (check StatusBadge.tsx) handles a 'needs_revision' status distinctly
from pending/approved/rejected — add it if missing.

Show me your Step 1 findings first, then diffs.
```
