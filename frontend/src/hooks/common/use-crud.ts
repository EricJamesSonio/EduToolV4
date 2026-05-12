import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createStandardMutationOptions } from "@/lib/error-handling";
import { QUERY_CONFIGS } from "@/lib/query-client";

/**
 * Generic CRUD hook utilities for React Query
 * Provides standardized patterns for create, read, update, delete operations
 */

export interface CrudApi<T extends { id: string }, CreateData = Partial<T>, UpdateData = Partial<T>> {
  getAll?: (query?: any) => Promise<T[]>;
  getOne?: (id: string) => Promise<T>;
  create?: (data: CreateData) => Promise<T>;
  update?: (id: string, data: UpdateData) => Promise<T>;
  delete?: (id: string) => Promise<void>;
  archive?: (id: string) => Promise<void>;
}

export interface CrudHookOptions<T extends { id: string }, CreateData = Partial<T>, UpdateData = Partial<T>> {
  entityName: string;
  queryKey: string | string[];
  api: CrudApi<T, CreateData, UpdateData>;
  queryOptions?: any;
  mutationOptions?: any;
}

/**
 * Generic hook for fetching list of items
 */
export function useCrudList<T extends { id: string }>(
  options: CrudHookOptions<T> & { query?: any }
) {
  const { entityName, queryKey, api, query: queryFilter, queryOptions = {} } = options;

  return useQuery({
    queryKey: Array.isArray(queryKey) ? [...queryKey, 'list', queryFilter] : [queryKey, 'list', queryFilter],
    queryFn: () => api.getAll?.(queryFilter) || Promise.resolve([]),
    enabled: !!api.getAll,
    ...QUERY_CONFIGS.list,
    ...queryOptions,
  });
}

/**
 * Generic hook for fetching single item by ID
 */
export function useCrudDetail<T extends { id: string }>(
  options: CrudHookOptions<T> & { id: string }
) {
  const { entityName, queryKey, api, id, queryOptions = {} } = options;

  return useQuery({
    queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
    queryFn: () => api.getOne?.(id) || Promise.resolve(null),
    enabled: !!api.getOne && !!id,
    ...QUERY_CONFIGS.detail,
    ...queryOptions,
  });
}

/**
 * Generic hook for creating items
 */
export function useCrudCreate<T extends { id: string }, CreateData = Partial<T>>(
  options: CrudHookOptions<T, CreateData>
) {
  const { entityName, queryKey, api, mutationOptions } = options;
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: entityName,
    operation: 'create',
    ...mutationOptions,
  });

  return useMutation({
    mutationFn: api.create,
    onSuccess: (newItem) => {
      // Add new item to cache
      if (newItem?.id) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? [...queryKey, 'detail', newItem.id] : [queryKey, 'detail', newItem.id],
          newItem
        );
      }

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'list'] : [queryKey, 'list'],
      });

      standardOptions.onSuccess?.(newItem);
    },
    onError: standardOptions.onError,
  });
}

/**
 * Generic hook for updating items
 */
export function useCrudUpdate<T extends { id: string }, UpdateData = Partial<T>>(
  options: CrudHookOptions<T, any, UpdateData>
) {
  const { entityName, queryKey, api, mutationOptions } = options;
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: entityName,
    operation: 'update',
    ...mutationOptions,
  });

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateData }) => api.update?.(id, data)!,
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
      });

      // Snapshot the previous value
      const previousItem = queryClient.getQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id]
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
        (old: T) => old ? { ...old, ...data } : null
      );

      return { previousItem };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousItem) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? [...queryKey, 'detail', variables.id] : [queryKey, 'detail', variables.id],
          context.previousItem
        );
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure server state is reflected
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', variables.id] : [queryKey, 'detail', variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'list'] : [queryKey, 'list'],
      });
      standardOptions.onSettled?.(data, error, variables as any);
    },
  });
}

/**
 * Generic hook for deleting items
 */
export function useCrudDelete<T extends { id: string }>(
  options: CrudHookOptions<T>
) {
  const { entityName, queryKey, api, mutationOptions } = options;
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: entityName,
    operation: 'delete',
    ...mutationOptions,
  });

  return useMutation({
    mutationFn: api.delete,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
      });

      // Snapshot the previous value
      const previousItem = queryClient.getQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id]
      );

      // Remove item from cache
      queryClient.removeQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
      });

      return { previousItem };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousItem) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? [...queryKey, 'detail', variables] : [queryKey, 'detail', variables],
          context.previousItem
        );
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      // Invalidate list queries to refresh
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'list'] : [queryKey, 'list'],
      });
      standardOptions.onSettled?.(data, error, variables as any);
    },
  });
}

/**
 * Generic hook for archiving items
 */
export function useCrudArchive<T extends { id: string }>(
  options: CrudHookOptions<T>
) {
  const { entityName, queryKey, api, mutationOptions } = options;
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: entityName,
    operation: 'archive',
    ...mutationOptions,
  });

  return useMutation({
    mutationFn: api.archive,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
      });

      // Snapshot the previous value
      const previousItem = queryClient.getQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id]
      );

      // Optimistically update archived status
      queryClient.setQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
        (old: T) => old ? { ...old, archived: true } : null
      );

      return { previousItem };
    },
    onError: (err, variables, context: any) => {
      // Rollback on error
      if (context?.previousItem) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? [...queryKey, 'detail', variables] : [queryKey, 'detail', variables],
          context.previousItem
        );
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure server state is reflected
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', variables] : [queryKey, 'detail', variables],
      });
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'list'] : [queryKey, 'list'],
      });
      standardOptions.onSettled?.(data, error, variables as any);
    },
  });
}
