import { useQuery, type UseQueryOptions, type QueryKey, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_PRESETS, queryClient } from '@/lib/query-client.config';

const VALID_ROOTS = ['admin', 'educator', 'student', 'auth', 'platform'];

export function useAppQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'> & {
    meta: { preset: keyof typeof QUERY_PRESETS; feature?: string };
  },
): UseQueryResult<TData, TError> {
  if (process.env.NODE_ENV === 'development') {
    const root = String(queryKey[0] ?? '');
    if (!VALID_ROOTS.includes(root)) {
      throw new Error(
        `[useAppQuery] Invalid query key root "${root}". ` +
        `All keys must come from queryKeys.factory.ts ` +
        `(valid roots: ${VALID_ROOTS.join(', ')}).`
      );
    }
    if (!options?.meta?.preset) {
      throw new Error(
        `[useAppQuery] Missing meta.preset for key "${JSON.stringify(queryKey)}". ` +
        `You must specify one of: ${Object.keys(QUERY_PRESETS).join(' | ')}`
      );
    }
    const status = queryClient.getQueryData(queryKey) ? 'CACHE_HIT' : 'FETCH';
    console.log(`[RQ] ${options.meta.preset} ${JSON.stringify(queryKey)} → ${status}`);
  }

  const { meta, ...restOptions } = options;
  const preset = QUERY_PRESETS[meta.preset];

  return useQuery({
    queryKey,
    queryFn,
    ...preset,
    ...restOptions,
    meta: meta as Record<string, unknown>,
  });
}
