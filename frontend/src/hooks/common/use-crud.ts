import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStandardMutationOptions } from "@/lib/error-handling";
import { QUERY_PRESETS } from "@/lib/query-client.config";
import { useAppQuery } from "@/hooks/useAppQuery";

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

export function useCrudList<T extends { id: string }>(
  options: CrudHookOptions<T> & { query?: any }
) {
  const { entityName, queryKey, api, query: queryFilter, queryOptions = {} } = options;

  return useAppQuery(
    Array.isArray(queryKey) ? [...queryKey, 'list', queryFilter] : [queryKey, 'list', queryFilter],
    () => api.getAll?.(queryFilter) || Promise.resolve([]),
    {
      enabled: !!api.getAll,
      ...QUERY_PRESETS.list,
      ...queryOptions,
      meta: { preset: 'list', feature: entityName },
    },
  );
}

export function useCrudDetail<T extends { id: string }>(
  options: CrudHookOptions<T> & { id: string }
) {
  const { entityName, queryKey, api, id, queryOptions = {} } = options;

  return useAppQuery(
    Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
    () => api.getOne?.(id) || Promise.resolve(null),
    {
      enabled: !!api.getOne && !!id,
      ...QUERY_PRESETS.detail,
      ...queryOptions,
      meta: { preset: 'detail', feature: entityName },
    },
  );
}

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
      if (newItem?.id) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? [...queryKey, 'detail', newItem.id] : [queryKey, 'detail', newItem.id],
          newItem
        );
      }
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'list'] : [queryKey, 'list'],
      });
      standardOptions.onSuccess?.(newItem);
    },
    onError: standardOptions.onError,
  });
}

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
    mutationFn: ({ id, data }: { id: string; data: UpdateData }) => {
  if (!api.update) {
    throw new Error(`update is not implemented for ${entityName}`);
  }
  return api.update(id, data);
},
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
      });
      const previousItem = queryClient.getQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id]
      );
      queryClient.setQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
        (old: T) => old ? { ...old, ...data } : null
      );
      return { previousItem };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousItem) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? [...queryKey, 'detail', variables.id] : [queryKey, 'detail', variables.id],
          context.previousItem
        );
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
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
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
      });
      const previousItem = queryClient.getQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id]
      );
      queryClient.removeQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
      });
      return { previousItem };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousItem) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? [...queryKey, 'detail', variables] : [queryKey, 'detail', variables],
          context.previousItem
        );
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'list'] : [queryKey, 'list'],
      });
      standardOptions.onSettled?.(data, error, variables as any);
    },
  });
}

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
      await queryClient.cancelQueries({
        queryKey: Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
      });
      const previousItem = queryClient.getQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id]
      );
      queryClient.setQueryData(
        Array.isArray(queryKey) ? [...queryKey, 'detail', id] : [queryKey, 'detail', id],
        (old: T) => old ? { ...old, archived: true } : null
      );
      return { previousItem };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousItem) {
        queryClient.setQueryData(
          Array.isArray(queryKey) ? [...queryKey, 'detail', variables] : [queryKey, 'detail', variables],
          context.previousItem
        );
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
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
