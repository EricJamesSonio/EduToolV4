# TICK-GROUPY-001 — Migrate groupy + landing raw query keys to factory (realtime)

Status: in-progress
Priority: high
Created: 2026-08-26
Created by: agent
Assigned to: agent
Started: 2026-08-26
Worktree: ../EduToolV4-worktrees/TICK-GROUPY-001-groupy-landing-keys
Branch: agent/TICK-GROUPY-001-groupy-landing-keys

## Problem

Groupy hooks use raw useQuery/useInfiniteQuery with ad-hoc roots groupy-messages/groupy-poll/groupy-unread etc. bypassing useAppQuery VALID_ROOTS guard; landing useLandingOrganizations uses ['landing','organizations'] root not in factory. No factory registration → no centralized invalidation, socket invalidation uses ad-hoc keys.

## Goal

1. Extend queryKeys factory with groupy domain (and landing/platform mapping) using useAsyncQuery / useAppQuery where appropriate, or document map to platform.
2. Replace raw keys in groupyCache/useGroupyUnread/useGroupyMessages/useGroupyPollDetail/useGroupyStickers/useGroupyMembers/useGroupyActiveMeeting and landing hook with factory keys and meta preset.
3. Ensure groupy real-time invalidation via factory all keys.

## Relevant Areas

- shared/skills/frontend/MUST-HAVES.md, shared/skills/realtime/MUST-HAVES.md
- frontend/src/hooks/queryKeys/*, frontend/src/hooks/useAppQuery.ts VALID_ROOTS
- frontend/src/hooks/groupy/*
- frontend/src/hooks/landing/useLandingOrganizations.ts

## Acceptance Criteria

- [ ] No raw groupy-* or landing keys via grep
- [ ] groupy hooks use factory keys with meta preset
- [ ] tsc --skipLibCheck pass

## Confidence

Score: 92/100
- Requirement clarity: 94
- Codebase verification: 92
- Architecture fit: 92
- Edge cases: 88
- Blast radius: 90

## Tests

- Targeted: not run
- Full suite: not run

## Blocker

None.

## Activity Log

2026-08-26 — Claimed

## Commits

None yet.

## Notes

Phase 4 of React Query factory fix.
