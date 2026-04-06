import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { programApi } from "@/api/admin/program.api";
import type { CreateProgramRequest, UpdateProgramRequest } from "@/api/admin/program.api";
import type { Program } from "@/types/admin/program.types";

// schoolYearId is required for the backend to return results
// (service returns [] when schoolYearId is absent)
export const usePrograms = (schoolYearId?: string): UseQueryResult<Program[], Error> => {
  return useQuery({
    queryKey: ["programs", schoolYearId],
    queryFn: () => programApi.getAll(schoolYearId),
    enabled: !!schoolYearId, // don't fire until we have a schoolYearId
  });
};

export const useCreateProgram = (): UseMutationResult<
  Program,
  Error,
  CreateProgramRequest
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: programApi.create,
    onSuccess: (_, variables) => {
      // invalidate only the relevant school year bucket
      queryClient.invalidateQueries({
        queryKey: ["programs", variables.schoolYearId],
      });
    },
  });
};

export const useUpdateProgram = (): UseMutationResult<
  Program,
  Error,
  { id: string; data: UpdateProgramRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramRequest }) =>
      programApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
};

export const useDeleteProgram = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: programApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
};