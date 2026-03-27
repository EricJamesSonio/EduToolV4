import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { semesterApi } from "@/api/admin/semester.api";
import type { CreateSemesterRequest, UpdateSemesterRequest } from "@/api/admin/semester.api";
import type { Semester } from "@/types/admin/semester.types";

export const useSemesters = (): UseQueryResult<Semester[], Error> => {
  return useQuery({
    queryKey: ["semesters"],
    queryFn: semesterApi.getAll,
  });
};

export const useCreateSemester = (): UseMutationResult<Semester, Error, CreateSemesterRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: semesterApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
};

export const useUpdateSemester = (): UseMutationResult<Semester, Error, { id: string; data: UpdateSemesterRequest }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSemesterRequest }) =>
      semesterApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
};

export const useDeleteSemester = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: semesterApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
};