import { useQuery, useMutation, useQueryClient, type QueryKey, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useAppQuery } from '@/hooks/useAppQuery';
import { QUERY_PRESETS } from '@/lib/query-client.config';

type PresetKey = keyof typeof QUERY_PRESETS;

interface AppMeta {
  preset?: PresetKey;
  feature?: string;
}

export function useAsyncQuery<
  TData = unknown,
  TError = AxiosError,
>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<
    UseQueryOptions<TData, TError, TData, QueryKey>,
    'queryKey' | 'queryFn'
  > & { meta?: AppMeta },
) {
  const preset = options?.meta?.preset ?? 'list';
  if (process.env.NODE_ENV === 'development' && !options?.meta?.preset) {
    console.warn(
      `[useAsyncQuery] Missing meta.preset for key "${JSON.stringify(queryKey)}". ` +
      `Defaulting to "list". Add meta: { preset: 'static' | 'user' | 'list' | 'detail' | 'realtime' }.`
    );
  }

  return useAppQuery(queryKey, queryFn, {
    ...options,
    meta: { preset, feature: options?.meta?.feature ?? 'unknown' },
  });
}


export function useAsyncMutation<
  TData = unknown,
  TError = AxiosError,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn,
    ...options,
  });
}


export function usePaginatedQuery<
  TData = unknown,
  TError = AxiosError,
>(
  queryKey: QueryKey,
  queryFn: (
    page: number,
    pageSize: number
  ) => Promise<TData>,
  {
    page = 1,
    pageSize = 10,
    ...options
  }: Omit<
    UseQueryOptions<TData, TError, TData, QueryKey>,
    'queryKey' | 'queryFn'
  > & {
    page?: number;
    pageSize?: number;
    meta?: AppMeta;
  } = {},
) {
  const preset = options?.meta?.preset ?? 'list';
  if (process.env.NODE_ENV === 'development' && !options?.meta?.preset) {
    console.warn(
      `[usePaginatedQuery] Missing meta.preset for key "${JSON.stringify(queryKey)}". ` +
      `Defaulting to "list".`
    );
  }

  return useAppQuery(
    [...queryKey, page, pageSize],
    () => queryFn(page, pageSize),
    {
      ...options,
      meta: { preset, feature: options?.meta?.feature ?? 'unknown' },
    },
  );
}


export function useFilteredQuery<
  TData = unknown,
  TError = AxiosError,
  TFilters extends Record<string, unknown> = Record<string, unknown>,
>(
  queryKey: QueryKey,
  queryFn: (filters: TFilters) => Promise<TData>,
  {
    filters = {} as TFilters,
    ...options
  }: Omit<
    UseQueryOptions<TData, TError, TData, QueryKey>,
    'queryKey' | 'queryFn'
  > & {
    filters?: TFilters;
    meta?: AppMeta;
  } = {},
) {
  const preset = options?.meta?.preset ?? 'list';
  if (process.env.NODE_ENV === 'development' && !options?.meta?.preset) {
    console.warn(
      `[useFilteredQuery] Missing meta.preset for key "${JSON.stringify(queryKey)}". ` +
      `Defaulting to "list".`
    );
  }

  return useAppQuery(
    [...queryKey, filters],
    () => queryFn(filters),
    {
      ...options,
      meta: { preset, feature: options?.meta?.feature ?? 'unknown' },
    },
  );
}


export function useDependentQuery<
  TData = unknown,
  TError = AxiosError,
>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<
    UseQueryOptions<TData, TError, TData, QueryKey>,
    'queryKey' | 'queryFn'
  > & { meta?: AppMeta },
) {
  const preset = options?.meta?.preset ?? 'list';
  if (process.env.NODE_ENV === 'development' && !options?.meta?.preset) {
    console.warn(
      `[useDependentQuery] Missing meta.preset for key "${JSON.stringify(queryKey)}". ` +
      `Defaulting to "list".`
    );
  }

  return useAppQuery(queryKey, queryFn, {
    ...options,
    meta: { preset, feature: options?.meta?.feature ?? 'unknown' },
  });
}


export function useMutationWithInvalidation<
  TData = unknown,
  TError = AxiosError,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: (
    variables: TVariables
  ) => Promise<TData>,
  {
    invalidateKeys,
    ...options
  }: Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn'
  > & {
    invalidateKeys?: QueryKey[];
  } = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    ...options,
    onSuccess: (data, variables, context) => {
      invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      options.onSuccess?.(data, variables, context);
    },
  });
}


export function useBatchMutation<
  TData = unknown,
  TError = AxiosError,
  TVariables = void,
  TContext = unknown,
>(
  mutationFn: (
    variables: TVariables
  ) => Promise<TData>,

  {
    onBatchSuccess,
    ...options
  }: UseMutationOptions<TData, TError, TVariables, TContext> & {
    onBatchSuccess?: (results: TData[]) => void;
  } = {},
) {
  const mutation = useMutation({
    mutationFn,
    ...options,
  });

  const mutateInBatch = async (
    variablesArray: TVariables[],
  ) => {
    const results = await Promise.all(
      variablesArray.map((v) =>
        mutation.mutateAsync(v),
      ),
    );
    onBatchSuccess?.(results);
    return results;
  };

  return {
    ...mutation,
    mutateInBatch,
  };
}


type OptimisticContext<T> = {
  previousData?: T;
};

export function useMutationWithOptimisticUpdate<
  TData = unknown,
  TError = AxiosError,
  TVariables = void,
  TCache = unknown,
>(
  queryKey: QueryKey,
  mutationFn: (
    variables: TVariables
  ) => Promise<TData>,
  {
    updateFn,
    ...options
  }: Omit<
    UseMutationOptions<TData, TError, TVariables, OptimisticContext<TCache>>,
    'mutationFn'
  > & {
    updateFn?: (
      oldData: TCache | undefined,
      newData: TVariables,
    ) => TCache;
  } = {},
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData<TCache>(queryKey);
      if (updateFn) {
        queryClient.setQueryData<TCache>(queryKey, (old) => updateFn(old, newData));
      }
      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      options.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
