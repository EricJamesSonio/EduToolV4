// ===== File: frontend/src/hooks/admin/useOrganization.ts =====

import { useQueryClient, UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { organizationApi } from "@/api/admin/organization.api";

import type { Organization } from "@/types/admin/organization.types";
import type { UpdateOrganizationRequest } from "@/api/admin/organization.api";

// ======================================================
// ✅ FETCH ORGANIZATION (NOW CONSISTENT)
// ======================================================
export const useOrganization = (): UseQueryResult<Organization | null, Error> => {
  return useAsyncQuery<Organization | null>(
    queryKeys.admin.organization.detail(),
    () => organizationApi.getOrg(),
    {
      staleTime: 1000 * 60 * 5,
    }
  );
};

// ======================================================
// ✅ UPDATE ORGANIZATION (ALIGNED PATTERN)
// ======================================================
export const useUpdateOrganization = (): UseMutationResult<
  Organization,
  Error,
  UpdateOrganizationRequest
> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<
    Organization,
    Error,
    UpdateOrganizationRequest
  >(
    (data) => organizationApi.updateOrg(data),
    {
      invalidateKeys: [queryKeys.admin.organization.detail()],
      onSuccess: (updated) => {
        queryClient.setQueryData(
          queryKeys.admin.organization.detail(),
          updated
        );
      },
    }
  );
};