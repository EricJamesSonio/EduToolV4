import { QueryClient } from '@tanstack/react-query';
import { createAppError, isAuthError, isNetworkError, isServerError } from '../utils/errorHandler';

/**
 * Shared TanStack Query client with global error-aware retry defaults.
 * Keeps network/auth/validation failures from retrying and caps server retries.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const appError = createAppError(error);

        if (isAuthError(error) || isNetworkError(error) || appError.type === 'VALIDATION') {
          return false;
        }

        if (isServerError(error) && failureCount < 2) {
          return true;
        }

        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: {
      retry: (failureCount, error) => {
        const appError = createAppError(error);

        if (isAuthError(error) || isNetworkError(error) || appError.type === 'VALIDATION') {
          return false;
        }

        if (isServerError(error) && failureCount < 1) {
          return true;
        }

        return false;
      },
    },
  },
});
