import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { semesterApi } from "@/api/admin/semester.api";

export const useSemesters = () => {
  return useQuery({
    queryKey: ["semesters"],
    queryFn: semesterApi.getAll,
  });
};

export const useCreateSemester = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: semesterApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
};

export const useUpdateSemester = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      semesterApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
};

export const useDeleteSemester = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: semesterApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["semesters"] });
    },
  });
};