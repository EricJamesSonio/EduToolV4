import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import type { GetGradingScalesQuery } from "@/api/admin/grading-scale.api";

export const useGradingScales = (query?: GetGradingScalesQuery) => {
  return useQuery({
    queryKey: ["gradingScales", query],
    queryFn: () => gradingScaleApi.getAll(query),
  });
};

export const useCreateGradingScale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gradingScaleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
    },
  });
};

export const useUpdateGradingScale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      gradingScaleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
    },
  });
};