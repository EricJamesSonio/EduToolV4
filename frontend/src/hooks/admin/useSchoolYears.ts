import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { schoolYearApi } from "@/api/admin/school-year.api";

export const useSchoolYears = () => {
  return useQuery({
    queryKey: ["schoolYears"],
    queryFn: schoolYearApi.getAll,
  });
};

export const useCreateSchoolYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schoolYearApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });
};

export const useUpdateSchoolYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      schoolYearApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });
};

export const useActivateSchoolYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schoolYearApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });
};

export const useEndSchoolYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schoolYearApi.end,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });
};