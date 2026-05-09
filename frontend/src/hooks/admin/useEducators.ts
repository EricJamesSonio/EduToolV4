import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { educatorApi } from "@/api/admin/educator.api";
import type { CreateEducatorRequest, CreateEducatorResponse, UpdateEducatorRequest } from "@/api/admin/educator.api";
import type { Educator } from "@/types/admin/educator.types";
import { educatorKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";

export const useEducators = (search?: string): UseQueryResult<Educator[], Error> => {
  return useQuery({
    queryKey: educatorKeys.list({ search }),
    queryFn: () => educatorApi.getAll(search),
    staleTime: 1000 * 60, // 1 minute for educator lists
  });
};

export const useEducator = (id: string): UseQueryResult<Educator, Error> => {
  return useQuery({
    queryKey: educatorKeys.detail(id),
    queryFn: () => educatorApi.getOne(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes for individual educator data
  });
};

export const useCreateEducator = (): UseMutationResult<CreateEducatorResponse, Error, CreateEducatorRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: educatorApi.create,
    onSuccess: (newEducator) => {
      queryClient.setQueryData(educatorKeys.detail(newEducator.id), newEducator);
      queryClient.invalidateQueries({ queryKey: educatorKeys.lists() });
      toast.success("Educator created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create educator");
    },
  });
};

export const useUpdateEducator = (): UseMutationResult<Educator, Error, { id: string; data: UpdateEducatorRequest }> => {
  const queryClient = useQueryClient();

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
      toast.error("Failed to update educator");
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: educatorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: educatorKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Educator updated successfully");
    },
  });
};

export const useDeleteEducator = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

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
      toast.error("Failed to delete educator");
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: educatorKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Educator deleted successfully");
    },
  });
};

export const useResetEducatorPassword = (): UseMutationResult<{ id: string; plainPassword: string }, Error, string> => {
  return useMutation({
    mutationFn: educatorApi.resetPassword,
    onSuccess: () => {
      toast.success("Password reset successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to reset password");
    },
  });
};