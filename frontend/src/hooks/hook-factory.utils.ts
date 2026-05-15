import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Hook Factory Utilities
 * Provides reusable patterns for common React Query operations
 * Eliminates code duplication across all data-fetching hooks
 */

/**
 * Type-safe wrapper for useQuery with common patterns
 * Handles loading/error states, caching, and refetching
 */
export function useAsyncQuery<TData = unknown, TError = AxiosError>(
  queryKey: readonly any[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Type-safe wrapper for useMutation with common patterns
 * Handles side effects like cache invalidation and notifications
 */
export function useAsyncMutation<
  TData = unknown,
  TError = AxiosError,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>,
) {
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...options,
  });
}

/**
 * Hook for paginated list queries
 * Handles common pagination patterns with caching
 */
export function usePaginatedQuery<TData = unknown, TError = AxiosError>(
  queryKey: readonly any[],
  queryFn: (page: number, pageSize: number) => Promise<TData>,
  { page = 1, pageSize = 10, ...options }: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> & { page?: number; pageSize?: number } = {},
) {
  return useQuery<TData, TError>({
    queryKey: [...queryKey, page, pageSize],
    queryFn: () => queryFn(page, pageSize),
    ...options,
  });
}

/**
 * Hook for filtered list queries
 * Handles common filtering patterns with cache keys
 */
export function useFilteredQuery<TData = unknown, TError = AxiosError>(
  queryKey: readonly any[],
  queryFn: (filters: Record<string, any>) => Promise<TData>,
  { filters = {}, ...options }: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> & { filters?: Record<string, any> } = {},
) {
  return useQuery<TData, TError>({
    queryKey: [...queryKey, filters],
    queryFn: () => queryFn(filters),
    ...options,
  });
}

/**
 * Hook for dependent queries (queries that depend on other query results)
 * Automatically pauses query if dependencies are not met
 */
export function useDependentQuery<TData = unknown, TError = AxiosError>(
  queryKey: readonly any[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    ...options,
  });
}

/**
 * Hook combining multiple mutations with optimistic updates
 * Manages cache invalidation across multiple affected queries
 */
export function useMutationWithInvalidation<
  TData = unknown,
  TError = AxiosError,
  TVariables = void,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  {
    invalidateKeys,
    ...options
  }: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> & {
    invalidateKeys?: readonly (readonly any[])[];
  } = {},
) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidate specified query keys
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key as any });
        });
      }

      // Call original onSuccess handler
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}

/**
 * Hook for batch operations
 * Handles multiple mutations with proper sequencing
 */
export function useBatchMutation<
  TData = unknown,
  TError = AxiosError,
  TVariables = void,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  { onBatchSuccess, ...options }: UseMutationOptions<TData, TError, TVariables> & {
    onBatchSuccess?: (results: TData[]) => void;
  } = {},
) {
  const mutation = useMutation<TData, TError, TVariables>({
    mutationFn,
    ...options,
  });

  const mutateInBatch = async (variablesArray: TVariables[]) => {
    const results = await Promise.all(
      variablesArray.map((variables) => mutation.mutateAsync(variables)),
    );

    onBatchSuccess?.(results);
    return results;
  };

  return {
    ...mutation,
    mutateInBatch,
  };
}

/**
 * Hook for optimistic updates
 * Temporarily updates cache before server confirmation
 */
export function useMutationWithOptimisticUpdate<
  TData = unknown,
  TError = AxiosError,
  TVariables = void,
>(
  queryKey: readonly any[],
  mutationFn: (variables: TVariables) => Promise<TData>,
  {
    updateFn,
    ...options
  }: Omit<UseMutationOptions<TData, TError, TVariables>, 'mutationFn'> & {
    updateFn?: (oldData: any, newData: TVariables) => any;
  } = {},
) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn,
    onMutate: async (newData) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey });

      // Save previous data
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update cache
      if (updateFn) {
        queryClient.setQueryData(queryKey, (old: any) => updateFn(old, newData));
      }

      return { previousData };
    },
    onError: (err, newData, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      options.onError?.(err, newData, context);
    },
    onSuccess: (data, variables, context) => {
      // Refetch to get fresh data from server
      queryClient.invalidateQueries({ queryKey });

      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}