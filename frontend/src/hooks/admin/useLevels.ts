import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { levelApi } from "@/api/admin/level.api";

export const useDefaultLevels = () => {
  return useQuery({
    queryKey: ["levels", "defaults"],
    queryFn: levelApi.getDefaults,
  });
};

export const useUpdateDefaultLevels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: levelApi.updateDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
    },
  });
};

export const useLevelsByYear = (schoolYearId: string) => {
  return useQuery({
    queryKey: ["levels", schoolYearId],
    queryFn: () => levelApi.getByYear(schoolYearId),
    enabled: !!schoolYearId,
  });
};

export const useUpdateLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      levelApi.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
    },
  });
};