import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminRubricApi } from "@/api/admin/rubric.api";

export const useRubric = () => {
  return useQuery({
    queryKey: ["rubric"],
    queryFn: adminRubricApi.getDefault,
  });
};

export const useUpdateRubric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminRubricApi.updateDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rubric"] });
    },
  });
};