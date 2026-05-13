# Fix React Query Cache Invalidation for Course and Level Deletion

This plan addresses the issue where deleting courses or levels doesn't real-time sync in the UI due to imprecise React Query cache invalidation.

## Problem Analysis

All hooks have React Query integration, but the cache invalidation is too generic:

**useCourses.ts:**
- Query uses: `courseKeys.list({ schoolYearId, programId })` = `['courses', 'list', { schoolYearId, programId }]`
- Delete invalidates: `courseKeys.lists()` = `['courses', 'list']`
- Issue: Invalidating only the base key may not trigger refetch of queries with specific filters

**useLevels.ts:**
- Query uses: `levelKeys.list({ schoolYearId })` = `['levels', 'list', { schoolYearId }]`
- Delete invalidates: `levelKeys.lists()` = `['levels', 'list']`
- Issue: Same problem - generic invalidation may not refetch filtered queries

**useStrands.ts:**
- Query uses: `strandKeys.list({ schoolYearId, programId })` = `['strands', 'list', { schoolYearId, programId }]`
- Delete invalidates: `strandKeys.lists()` = `['strands', 'list']`
- Issue: Same problem

## Solution

Update the mutation hooks to accept context (schoolYearId, programId) and invalidate the specific query keys that match the filters used in the components.

### Changes Required:

1. **useCourses.ts** - Update mutations to accept and use context for precise invalidation
2. **useLevels.ts** - Update mutations to accept and use context for precise invalidation  
3. **useStrands.ts** - Update mutations to accept and use context for precise invalidation
4. **Update components** - Pass context to mutation hooks when calling them

This ensures that when a course/level/strand is deleted, the exact query that fetched it is invalidated, triggering an immediate refetch.
