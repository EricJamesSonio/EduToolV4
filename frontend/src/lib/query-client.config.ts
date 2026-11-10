import { QueryClient } from '@tanstack/react-query';
import { backoffDelay, isTransientError } from '@/lib/retry';

export const QUERY_PRESETS = {
  static:   { staleTime: 30 * 60 * 1000, gcTime: 60 * 60 * 1000 },
  user:     { staleTime: 5 * 60 * 1000,  gcTime: 15 * 60 * 1000 },
  list:     { staleTime: 60 * 1000,      gcTime: 10 * 60 * 1000 },
  detail:   { staleTime: 5 * 60 * 1000,  gcTime: 15 * 60 * 1000 },
  realtime: { staleTime: 30 * 1000,      gcTime: 5 * 60 * 1000, refetchInterval: 30 * 1000 },
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default to the 'list' preset. Static owners must declare
      // preset: 'static' explicitly (useAppQuery throws in dev without one).
      staleTime: QUERY_PRESETS.list.staleTime,
      gcTime: QUERY_PRESETS.list.gcTime,
      // Fail fast on real errors so the UI can show its error state with a
      // Retry button. Only transient failures (network, 408, 429, 502-504)
      // retry, at most twice, with backoff.
      retry: (failureCount, error: unknown) =>
        isTransientError(error) && failureCount < 2,
      retryDelay: (attemptIndex) => backoffDelay(attemptIndex, 500, 4000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Never auto-retry writes: a retried POST can duplicate data.
      retry: false,
    },
  },
});

export default queryClient;