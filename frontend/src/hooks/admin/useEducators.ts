import { UseQueryResult, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { educatorApi } from "@/api/admin/educator.api";
import type { CreateEducatorRequest, CreateEducatorResponse, UpdateEducatorRequest } from "@/api/admin/educator.api";
import type { Educator } from "@/types/admin/educator.types";
import { toast } from "sonner";

// Fetch educators with optional search
export const useEducators = (search?: string): UseQueryResult<Educator[], Error> => {
  return useAsyncQuery<Educator[]>(
    [...queryKeys.admin.educators.list({ search })] as const,
    () => educatorApi.getAll(search),
    {
      staleTime: 1000 * 60,
    },
  );
};

// Fetch single educator
export const useEducator = (id: string): UseQueryResult<Educator, Error> => {
  return useAsyncQuery<Educator>(
    queryKeys.admin.educators.detail(id),
    () => educatorApi.getOne(id),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    },
  );
};

// Create educator
export const useCreateEducator = (): UseMutationResult<CreateEducatorResponse, Error, CreateEducatorRequest> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<CreateEducatorResponse, Error, CreateEducatorRequest>(
    (data) => educatorApi.create(data),
    {
      invalidateKeys: [queryKeys.admin.educators.list()],
      onSuccess: (newEducator) => {
        queryClient.setQueryData(queryKeys.admin.educators.detail(newEducator.id), newEducator);
        toast.success("Educator created successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to create educator");
      },
    },
  );
};

// Update educator
export const useUpdateEducator = (): UseMutationResult<Educator, Error, { id: string; data: UpdateEducatorRequest }> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<Educator, Error, { id: string; data: UpdateEducatorRequest }>(
    ({ id, data }) => educatorApi.update(id, data),
    {
      invalidateKeys: [queryKeys.admin.educators.list()],
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.admin.educators.detail(id) });

        const previousEducator = queryClient.getQueryData(queryKeys.admin.educators.detail(id));

        queryClient.setQueryData(queryKeys.admin.educators.detail(id), (old: Educator) =>
          old ? { ...old, ...data } : null
        );

        return { previousEducator };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousEducator) {
          queryClient.setQueryData(queryKeys.admin.educators.detail(variables.id), context.previousEducator);
        }
        toast.error("Failed to update educator");
      },
      onSuccess: () => {
        toast.success("Educator updated successfully");
      },
    },
  );
};

// Delete educator
export const useDeleteEducator = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<void, Error, string>(
    (id) => educatorApi.delete(id),
    {
      invalidateKeys: [queryKeys.admin.educators.list()],
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.admin.educators.detail(id) });

        const previousEducator = queryClient.getQueryData(queryKeys.admin.educators.detail(id));

        queryClient.removeQueries({ queryKey: queryKeys.admin.educators.detail(id) });

        return { previousEducator };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousEducator) {
          queryClient.setQueryData(queryKeys.admin.educators.detail(variables), context.previousEducator);
        }
        toast.error("Failed to delete educator");
      },
      onSuccess: () => {
        toast.success("Educator deleted successfully");
      },
    },
  );
};

// Reset educator password
export const useResetEducatorPassword = (): UseMutationResult<{ id: string; plainPassword: string }, Error, string> => {
  return useMutationWithInvalidation<{ id: string; plainPassword: string }, Error, string>(
    (id) => educatorApi.resetPassword(id),
    {
      invalidateKeys: [],
      onSuccess: () => {
        toast.success("Password reset successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to reset password");
      },
    },
  );
};