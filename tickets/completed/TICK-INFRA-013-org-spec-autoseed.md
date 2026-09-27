# TICK-INFRA-013 — Update organization spec for autoSeedNewSchoolYears field

Status: completed
Priority: low
Created: 2026-09-26
Created by: agent
Assigned to: agent
Started: 2026-09-26
Worktree: ../EduToolV4-worktrees/TICK-INFRA-013-org-spec-autoseed
Branch: agent/TICK-INFRA-013-org-spec-autoseed

## Problem

Commit `5cfe8417` ("Update organization module", another agent) added `autoSeedNewSchoolYears` to `getOwn`'s response shape without updating `organization.service.spec.ts` → "maps org to response" now fails on the extra key (verified: 1 failed / 24 passed in that suite; all Phase-6 cache tests in the file still green). Test-only drift, no production behavior in question.

## Goal

1. Update the "maps org to response" expectation to include the new field (and cover its null default), following the existing expectation style in that file.
2. Verify the full organization suite green, plus tsc on the touched spec.

## Relevant Areas

- backend/src/modules/organization/__TEST__/organization.service.spec.ts
- shared/skills/testing/MUST-HAVES.md

## Acceptance Criteria

- [ ] Organization suite 26/26 green (25 existing + assertions updated, no skipping)
- [ ] No other files touched

## Confidence

Score: 96/100
- Requirement clarity: 25, Codebase verification: 25 (read spec + service diff), Architecture fit: 20, Edge cases: 13 (null default covered), Blast radius: 13 (spec-only change, zero prod code)
Proceeding.

## Tests

- Targeted: organization suite 25/25 green (incl. null-default assertion)
- Full suite: verified on development post-merge (see merge validation)
- Development integration: merged (62446907)

## Blocker

None.

## Activity Log

2026-09-26 — Claimed (new INFRA-013, counter 12→13) during verification follow-up. One-line expectation drift from another agent's field addition; spec-only fix.
Confidence: 96/100. No open assumption.
2026-09-27 — Implemented (d99a9e07): expectations synced incl. null→false default; suite 25/25 green, lint clean. Merged to development (62446907). Completed.

## Commits

None yet.

## Notes

If the org team prefers a different mapped shape, say so — this just syncs the spec to the shipped behavior.
