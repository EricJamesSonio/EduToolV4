import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Enhanced QueryClient configuration with optimized defaults
 * for the EduTool application
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Enhanced retry logic with different strategies for different error types
        retry: (failureCount, error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response?.status;

          // Don't retry on client errors (4xx) except 408, 429
          if (status && status >= 400 && status < 500) {
            if (status === 408 || status === 429) return failureCount < 3;
            return false;
          }

          // Retry server errors (5xx) up to 3 times
          if (status && status >= 500) return failureCount < 3;

          // Retry network errors up to 3 times
          if (error instanceof Error && error.name === 'NetworkError') return failureCount < 3;

          // Default retry for other errors
          return failureCount < 2;
        },

        // Exponential backoff for retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Stale time configuration based on data type
        staleTime: 1000 * 60 * 2, // 2 minutes default

        // Cache time - keep data in cache for 10 minutes
        gcTime: 1000 * 60 * 10,

        // Don't refetch on window focus by default for better UX
        refetchOnWindowFocus: false,

        // Refetch on reconnect
        refetchOnReconnect: true,

        // Error handling
        throwOnError: false, // Let components handle errors gracefully
      },

      mutations: {
        // Retry mutations on network errors
        retry: (failureCount, error: unknown) => {
          const status = (error as { response?: { status?: number } })?.response?.status;

          // Don't retry on client errors
          if (status && status >= 400 && status < 500) return false;

          // Retry network/server errors once
          return failureCount < 1;
        },

        // Exponential backoff for mutation retries
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

        // Don't throw errors by default - handle them in mutation callbacks
        throwOnError: false,
      },
    },

  });
}

/**
 * Default query configurations for different data types
 */
export const QUERY_CONFIGS = {
  // Real-time data that updates frequently
  realtime: {
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60, // 1 minute
  },

  // User-specific data that changes occasionally
  user: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  },

  // Static/reference data that rarely changes
  static: {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  },

  // List data that changes moderately
  list: {
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
  },

  // Detail data that changes less frequently
  detail: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  },
} as const;

/**
 * Helper function to create query options with specific configurations
 */
export function createQueryOptions<T>(
  config: Partial<typeof QUERY_CONFIGS[keyof typeof QUERY_CONFIGS]> = {}
) {
  return {
    ...QUERY_CONFIGS.list,
    ...config,
  } as const;
}
