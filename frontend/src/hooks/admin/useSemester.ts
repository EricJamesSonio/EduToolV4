import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { semesterApi, CreateSemesterRequest, UpdateSemesterRequest } from "@/api/admin/semester.api";
import type { Semester } from "@/types/admin/semester.types";

// Fetch all semesters
export const useSemesters = (): UseQueryResult<Semester[], unknown> => {
  return useQuery({
    queryKey: ["semesters"],
    queryFn: semesterApi.getAll,
  });
};

// Create a new semester
export const useCreateSemester = (): UseMutationResult<Semester, unknown, CreateSemesterRequest> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: semesterApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
};

// Update an existing semester
export const useUpdateSemester = (): UseMutationResult<
  Semester,
  unknown,
  { id: string; data: UpdateSemesterRequest }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSemesterRequest }) =>
      semesterApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
};

// Delete a semester
export const useDeleteSemester = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: semesterApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
};