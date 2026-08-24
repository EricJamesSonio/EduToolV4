# Phase 6 — Educator Teaching History

**Mode:** Start in Plan Mode. Build Mode only after Eric approves.

**Depends on:** Phase 0 only — can run in parallel with Phases 1–5 any time after Phase 0 is signed off.

## Goal

Small, additive-only change — no new tables. A query surfacing what an educator taught across all school years, including classes that were later archived (soft-deleted), since teaching history should not disappear just because a class was archived.

## Files to read before planning

- `backend/src/modules/class/class.repository.ts` (existing `findActiveClassesByEducator` — note it filters `deleted_at: null`; this phase needs the opposite for history purposes)
- `backend/src/modules/educator/educator.controller.ts` and `educator.service.ts` (to decide whether this route belongs here or on `class.controller.ts` — check which module currently owns educator-facing queries versus class-facing queries)

## Planned change

- New method on `class.repository.ts`: `findTeachingHistoryByEducator(educatorId, orgId)` — `findMany` on `Class` filtered by `educator_id` + `org_id`, **without** the `deleted_at: null` filter that every other class query in this repository uses, grouped or orderable by `school_year_id`.
- Expose via whichever controller Phase-0-informed investigation says is the right home — state confidence on this choice; if <90%, ask Eric rather than picking arbitrarily, since this is a small but real API-surface decision.

## Build Mode verification

- Unit test: an educator with one active class and one soft-deleted (archived) class in different school years — confirm both appear in the result, unlike every other existing class query which would only return the active one.
- All gates from `02-rules-buildmode.md`.

## Exit criteria

- Test passes with real output.
- Eric reviews and approves.
