/**
 * queryKeys.factory.ts
 *
 * The actual key definitions now live in ./queryKeys, split one file per
 * domain (admin / educator / student / auth / platform) since this single
 * file had grown to ~500 lines mixing five unrelated domains. This file is
 * kept only so existing `from '@/hooks/queryKeys.factory'` imports keep
 * working without a repo-wide find/replace. New code should import from
 * './queryKeys' directly.
 */

export { queryKeys, default } from './queryKeys';
export type { QueryFilters } from './queryKeys';
