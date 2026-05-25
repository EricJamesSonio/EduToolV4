import { QueryClient, DefaultOptions } from '@tanstack/react-query';

/**
 * Global React Query configuration
 * Centralized settings for cache behavior, retries, and error handling
 * Used across all hooks to maintain consistency
 */

const queryConfig: DefaultOptions = {
  queries: {
    // Cache fresh data for 5 minutes by default
    staleTime: 1000 * 60 * 5,
    
    // Keep unused data in cache for 10 minutes
    gcTime: 1000 * 60 * 10,
    
    // Retry failed requests 2 times with exponential backoff
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch stale data when window regains focus
    refetchOnWindowFocus: true,
    
    // Don't refetch on mount if data is fresh
    refetchOnMount: false,
    
    // Disable initial refetch on stale data
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once on failure
    retry: 1,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
};

/**
 * Singleton QueryClient instance
 * Reused across entire application to avoid multiple client instances
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

export default queryClient;