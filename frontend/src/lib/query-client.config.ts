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
      retry: (failureCount, error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) {
          if (status === 408 || status === 429) return failureCount < 3;
          return false;
        }
        if (status && status >= 500) return failureCount < 3;
        if (error instanceof Error && error.name === 'NetworkError') return failureCount < 3;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
