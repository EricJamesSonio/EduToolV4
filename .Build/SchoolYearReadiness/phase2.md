# Phase 2 — Backend: Wire Hard Block into Mark-Ready Endpoint

## Goal

The actual status-transition action (whatever Phase 1's investigation found) calls the readiness check and refuses to proceed if it fails.

## Steps

1. In the mark-ready/status-transition handler found in Phase 1, call `checkSchoolYearReadiness()` before performing the status update.

2. If `ready: false`, throw a `ConflictException` (or whatever exception type this codebase's similar "can't proceed, here's why" cases already use — check `SectionService.remove()`'s `hasStudents` check for precedent) with the full `issues` array attached in a way the frontend can render as a checklist — not just a flattened string message. Check how other structured-error responses in this codebase are shaped (if any) before deciding the exact response format; if there's no existing precedent, a reasonable shape is the exception's response body directly containing the `ReadinessResult`.

3. **Add a separate, read-only endpoint** — `GET /school-years/:id/readiness` — that returns the same `ReadinessResult` without attempting the status change. This lets the frontend show a live checklist _before_ the admin even attempts to mark it ready, rather than only finding out via a failed attempt.

## Acceptance check

- Attempting to mark an incomplete school year ready is rejected with the full issues list in the response, not just a generic error
- `GET /school-years/:id/readiness` returns the same data without side effects, callable at any time
- A fully-passing school year's mark-ready action proceeds exactly as it did before this change

---

## AI Prompt

```
Context: EduTool backend (NestJS). checkSchoolYearReadiness() exists (Phase 1).

Task:
1. In the school year status-transition handler identified in Phase 1's
   investigation, call checkSchoolYearReadiness() before performing the
   update. If ready is false, throw an exception carrying the full issues
   array in its response body — check SectionService.remove()'s hasStudents
   check for the precedent this codebase uses for "blocked, here's why"
   responses, and match that style/exception type.

2. Add GET /school-years/:id/readiness — a read-only endpoint returning the
   same ReadinessResult, callable independently of attempting to mark ready.

3. Confirm the existing mark-ready path still works unchanged for a school
   year that actually passes all checks — this should be additive, not a
   behavior change for the success case.

Show me diffs before applying.
```
