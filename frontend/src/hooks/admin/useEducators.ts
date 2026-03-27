import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { educatorApi } from "@/api/admin/educator.api";
import type { CreateEducatorRequest, CreateEducatorResponse, UpdateEducatorRequest } from "@/api/admin/educator.api";
import type { Educator } from "@/types/admin/educator.types";

export const useEducators = (search?: string): UseQueryResult<Educator[], Error> => {
  return useQuery({
    queryKey: ["educators", search],
    queryFn: () => educatorApi.getAll(search),
  });
};

export const useEducator = (id: string): UseQueryResult<Educator, Error> => {
  return useQuery({
    queryKey: ["educators", id],
    queryFn: () => educatorApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateEducator = (): UseMutationResult<CreateEducatorResponse, Error, CreateEducatorRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: educatorApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educators"] });
    },
  });
};

export const useUpdateEducator = (): UseMutationResult<Educator, Error, { id: string; data: UpdateEducatorRequest }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEducatorRequest }) =>
      educatorApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educators"] });
    },
  });
};

export const useDeleteEducator = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: educatorApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educators"] });
    },
  });
};

export const useResetEducatorPassword = (): UseMutationResult<{ id: string; plainPassword: string }, Error, string> => {
  return useMutation({
    mutationFn: educatorApi.resetPassword,
  });
};