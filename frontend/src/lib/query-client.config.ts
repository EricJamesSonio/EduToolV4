import { QueryClient } from '@tanstack/react-query';

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
      staleTime: QUERY_PRESETS.static.staleTime,
      gcTime: QUERY_PRESETS.static.gcTime,
      // Fail fast: list/detail queries should resolve to a terminal state as
      // soon as possible so the UI can render empty/error instead of sitting on
      // a spinner while retries exhaust with exponential backoff. Only transient
      // rate-limit errors get a single quick retry; everything else surfaces
      // immediately and relies on the in-UI "Retry" buttons.
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 408 || status === 429) return failureCount < 1;
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 4000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

export default queryClient;
