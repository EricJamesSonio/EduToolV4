import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { sectionApi } from "@/api/admin/section.api";
import type { CreateSectionRequest, UpdateSectionRequest } from "@/api/admin/section.api";
import type { Section } from "@/types/admin/section.types";

export const useSections = (levelId?: string): UseQueryResult<Section[], Error> => {
  return useQuery({
    queryKey: ["sections", levelId],
    queryFn: () => sectionApi.getAll(levelId),
  });
};

export const useCreateSection = (): UseMutationResult<Section, Error, CreateSectionRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sectionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
};

export const useUpdateSection = (): UseMutationResult<Section, Error, { id: string; data: UpdateSectionRequest }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSectionRequest }) =>
      sectionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
};

export const useDeleteSection = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sectionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
  });
};