import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { organizationApi, Organization } from "@/api/admin/organization.api";

// Hook for fetching organization data
export const useOrganization = (): UseQueryResult<Organization, unknown> => {
  return useQuery<Organization>({
    queryKey: ["organization"],
    queryFn: organizationApi.getOrg,
  });
};

// Hook for updating organization data
export const useUpdateOrganization = (): UseMutationResult<Organization, unknown, Partial<Organization>> => {
  const queryClient = useQueryClient();

  return useMutation<Organization, unknown, Partial<Organization>>({
    mutationFn: organizationApi.updateOrg,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
};