import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { educatorApi } from "@/api/admin/educator.api";

export const useEducators = (search?: string) => {
  return useQuery({
    queryKey: ["educators", search],
    queryFn: () => educatorApi.getAll(search),
  });
};

export const useEducator = (id: string) => {
  return useQuery({
    queryKey: ["educators", id],
    queryFn: () => educatorApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateEducator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: educatorApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educators"] });
    },
  });
};

export const useUpdateEducator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      educatorApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educators"] });
    },
  });
};

export const useDeleteEducator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: educatorApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["educators"] });
    },
  });
};

export const useResetEducatorPassword = () => {
  return useMutation({
    mutationFn: educatorApi.resetPassword,
  });
};