import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { levelApi, UpdateDefaultLevelsRequest } from "@/api/admin/level.api";
import type { LevelDefault, SchoolYearLevel } from "@/types/admin/level.types";

export const useDefaultLevels = (): UseQueryResult<LevelDefault[], Error> => {
  return useQuery({
    queryKey: ["levels", "defaults"],
    queryFn: levelApi.getDefaults,
  });
};

export const useUpdateDefaultLevels = (): UseMutationResult<LevelDefault[], Error, UpdateDefaultLevelsRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: levelApi.updateDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
    },
  });
};

export const useLevelsByYear = (schoolYearId: string): UseQueryResult<SchoolYearLevel[], Error> => {
  return useQuery({
    queryKey: ["levels", schoolYearId],
    queryFn: () => levelApi.getByYear(schoolYearId),
    enabled: !!schoolYearId,
  });
};

export const useUpdateLevel = (): UseMutationResult<SchoolYearLevel, Error, { id: string; name: string }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      levelApi.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
    },
  });
};