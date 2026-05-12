import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { educatorApi } from "@/api/admin/educator.api";
import type { CreateEducatorRequest, CreateEducatorResponse, UpdateEducatorRequest } from "@/api/admin/educator.api";
import type { Educator } from "@/types/admin/educator.types";
import { educatorKeys } from "@/hooks/queryKeys";
import { createStandardMutationOptions } from "@/lib/error-handling";
import { QUERY_CONFIGS } from "@/lib/query-client";
import { toast } from "sonner";

export const useEducators = (search?: string): UseQueryResult<Educator[], Error> => {
  return useQuery({
    queryKey: educatorKeys.list({ search }),
    queryFn: () => educatorApi.getAll(search),
    ...QUERY_CONFIGS.list,
  });
};

export const useEducator = (id: string): UseQueryResult<Educator, Error> => {
  return useQuery({
    queryKey: educatorKeys.detail(id),
    queryFn: () => educatorApi.getOne(id),
    enabled: !!id,
    ...QUERY_CONFIGS.detail,
  });
};

export const useCreateEducator = (): UseMutationResult<CreateEducatorResponse, Error, CreateEducatorRequest> => {
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: "Educator",
    operation: "create",
  });

  return useMutation({
    mutationFn: educatorApi.create,
    onSuccess: (newEducator) => {
      queryClient.setQueryData(educatorKeys.detail(newEducator.id), newEducator);
      queryClient.invalidateQueries({ queryKey: educatorKeys.lists() });
      standardOptions.onSuccess?.(newEducator);
    },
    onError: standardOptions.onError,
  });
};

export const useUpdateEducator = (): UseMutationResult<Educator, Error, { id: string; data: UpdateEducatorRequest }> => {
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: "Educator",
    operation: "update",
  });

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEducatorRequest }) =>
      educatorApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: educatorKeys.detail(id) });

      const previousEducator = queryClient.getQueryData(educatorKeys.detail(id));

      queryClient.setQueryData(educatorKeys.detail(id), (old: Educator) =>
        old ? { ...old, ...data } : null
      );

      return { previousEducator };
    },
    onError: (err, variables, context) => {
      if (context?.previousEducator) {
        queryClient.setQueryData(educatorKeys.detail(variables.id), context.previousEducator);
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: educatorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: educatorKeys.lists() });
      standardOptions.onSettled?.(data, error, variables as any);
    },
    onSuccess: () => {
      standardOptions.onSuccess?.();
    },
  });
};

export const useDeleteEducator = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: "Educator",
    operation: "delete",
  });

  return useMutation({
    mutationFn: educatorApi.delete,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: educatorKeys.detail(id) });

      const previousEducator = queryClient.getQueryData(educatorKeys.detail(id));

      queryClient.removeQueries({ queryKey: educatorKeys.detail(id) });

      return { previousEducator };
    },
    onError: (err, variables, context) => {
      if (context?.previousEducator) {
        queryClient.setQueryData(educatorKeys.detail(variables), context.previousEducator);
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: educatorKeys.lists() });
      standardOptions.onSettled?.(data, error, variables as any);
    },
    onSuccess: () => {
      standardOptions.onSuccess?.();
    },
  });
};

export const useResetEducatorPassword = (): UseMutationResult<{ id: string; plainPassword: string }, Error, string> => {
  const standardOptions = createStandardMutationOptions({
    entity: "Educator",
    operation: "resetPassword",
  });

  return useMutation({
    mutationFn: educatorApi.resetPassword,
    onSuccess: () => {
      standardOptions.onSuccess?.();
    },
    onError: standardOptions.onError,
  });
};