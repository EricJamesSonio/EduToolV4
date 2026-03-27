import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sectionApi } from "@/api/admin/section.api";

export const useSections = (levelId?: string) => {
  return useQuery({
    queryKey: ["sections", levelId],
    queryFn: () => sectionApi.getAll(levelId),
  });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sectionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      sectionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
};

export const useDeleteSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sectionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
};