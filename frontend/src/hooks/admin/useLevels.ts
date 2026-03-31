// frontend/src/hooks/admin/useLevels.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { levelApi, UpdateDefaultLevelsRequest } from "@/api/admin/level.api";
import type { Level, LevelDefault } from "@/types/admin/level.types";

// ── GET default levels ───────────────────────────────────────────────────────
export const useDefaultLevels = (): UseQueryResult<LevelDefault[], Error> => {
  return useQuery<LevelDefault[], Error>({
    queryKey: ["levels", "defaults"],
    queryFn: levelApi.getDefaults,
  });
};

// ── UPDATE default levels ────────────────────────────────────────────────────
export const useUpdateDefaultLevels = (): UseMutationResult<
  LevelDefault[],
  Error,
  UpdateDefaultLevelsRequest
> => {
  const queryClient = useQueryClient();
  return useMutation<LevelDefault[], Error, UpdateDefaultLevelsRequest>({
    mutationFn: levelApi.updateDefaults,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
    },
  });
};

// ── GET levels by school year ────────────────────────────────────────────────
export const useLevelsByYear = (schoolYearId: string): UseQueryResult<Level[], Error> => {
  return useQuery<Level[], Error>({
    queryKey: ["levels", schoolYearId],
    queryFn: () => levelApi.getBySchoolYear(schoolYearId),
    enabled: !!schoolYearId,
  });
};

// ── UPDATE single level ─────────────────────────────────────────────────────
export const useUpdateLevel = (): UseMutationResult<
  Level,
  Error,
  { id: string; name: string }
> => {
  const queryClient = useQueryClient();
  return useMutation<Level, Error, { id: string; name: string }>({
    mutationFn: ({ id, name }) => levelApi.updateOne(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["levels"] });
    },
  });
};