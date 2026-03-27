import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { programApi } from "@/api/admin/program.api";
import type { CreateProgramRequest, UpdateProgramRequest } from "@/api/admin/program.api";
import type { Program } from "@/types/admin/program.types";

export const usePrograms = (): UseQueryResult<Program[], Error> => {
  return useQuery({
    queryKey: ["programs"],
    queryFn: programApi.getAll,
  });
};

export const useCreateProgram = (): UseMutationResult<Program, Error, CreateProgramRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: programApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
};

export const useUpdateProgram = (): UseMutationResult<Program, Error, { id: string; data: UpdateProgramRequest }> => {
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