# TICK-EDUCATOR-002 — Atomic teachable bundle + capacity tracking in slot picker

Status: in-progress
Priority: high
Created: 2026-10-05
Created by: agent
Assigned to: agent
Started: 2026-10-05
Worktree: ../EduToolV4-worktrees/TICK-EDUCATOR-002-teachable-bundle-capacity
Branch: agent/TICK-EDUCATOR-002-teachable-bundle-capacity

## Problem

1. Teachable save is two sequential mutations (links, then slots). Ticking a subject with zero section picks saves a section-less link with no warning; if the slots call fails (409/400) after links committed, the educator keeps a section-less link (no rollback). The seed effect also re-runs on late data and wipes in-progress picks.
2. Capacity is enforced only at Save (server 400). The modal shows a footer line only — no percentage bar, no per-subject cost, no per-pick guard — so an educator with e.g. Saturday-only availability can be over-assigned click by click.

## Goal

(a) One atomic bundle endpoint: validate everything, then write links + slots in one transaction.
(b) Block empty-section saves with reason; seed-once guard (reset on close/educator/year change).
(c) Live capacity bar + per-subject cost; block over-capacity slot clicks with toast. Client mirrors server formula; server stays authority.
(d) Verification fixes only, then gates + QA checklist.

## Relevant Areas

- backend/src/modules/educator/educator-subject.service.ts (setSlots, setTeachableSubjects/replaceSet, capacity, loadCapacityParts)
- backend/src/modules/educator/educator-subject.repository.ts (replaceSet, setSlots)
- backend/src/modules/educator/educator.controller.ts
- backend/src/modules/educator/dto/educator.dto.ts
- backend/src/modules/educator/__TEST__/educator-subject.spec.ts (+ new bundle spec)
- frontend/src/components/admin/educator/TeachableSubjectsModal.tsx
- frontend/src/hooks/admin/useEducators.ts (useAppMutation bundle hook)
- frontend/src/hooks/queryKeys/admin.keys.ts (bundle keys)
- frontend/src/api/admin/educator.api.ts (bundle client fn)

## Acceptance Criteria

- [ ] Bundle endpoint validates the union of setSlots + link-path rules; per-validation rejection tests; link table unchanged after any failure
- [ ] Concurrent saves can't both pass capacity (lock or re-read in-txn); approach reported
- [ ] Save disabled unless every ticked subject has >= 1 slot, with reason text
- [ ] Seed runs once per open; reset on close/educator/year change; open->close->reopen test
- [ ] Client capacity math mirrors server exactly (shared helper or fixture-parity test)
- [ ] Modal calls bundle via useAppMutation + queryKeys keys, invalidating teachable/slots/capacity; no raw api calls in component
- [ ] Old endpoints unchanged; EducatorTeachableSubjectsCard + carry-over tests still pass
- [ ] Manual QA checklist executed (see Notes)

## Confidence

- Score: not yet claimed — per owner instruction, confidence only after suites pass.

## Tests

- Targeted: educator-subject bundle spec (new), educator-subject.spec (regression), modal behavior tests
- Gates: BE/FE tsc, eslint on touched files, relevant suites; build left to CI

## Blocker

None.

## Activity Log

2026-10-05 — Claimed (counter EDUCATOR 1 -> 2). Base verified: e4f0c6f4 is origin/development HEAD (merge-base 0), CLASS-004 markers present. Worktree from origin/development.

## Commits

(none yet)

## Notes

Owner conditions: (3) commits split a/b/c/d; (4) parity list + per-validation tests; (5) concurrency approach reported; (8) useAppMutation + queryKeys invalidation; (9) old endpoints untouched. QA checklist: empty-section Save blocked with reason; over-capacity click blocked with toast; atomic failure leaves links unchanged; modal reopen shows fresh state; other callers still work.
