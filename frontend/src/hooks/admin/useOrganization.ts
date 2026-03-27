import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { organizationApi } from "@/api/admin/organization.api";
import type { Organization } from "@/types/admin/organization.types";
import type { UpdateOrganizationRequest } from "@/api/admin/organization.api";

// Hook for fetching organization data
export const useOrganization = (): UseQueryResult<Organization, unknown> => {
  return useQuery<Organization>({
    queryKey: ["organization"],
    queryFn: organizationApi.getOrg,
  });
};

// Hook for updating organization data
export const useUpdateOrganization = (): UseMutationResult<
  Organization,
  unknown,
  UpdateOrganizationRequest
> => {
  const queryClient = useQueryClient();

  return useMutation<Organization, unknown, UpdateOrganizationRequest>({
    mutationFn: organizationApi.updateOrg,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
  });
};