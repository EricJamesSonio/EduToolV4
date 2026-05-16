// ===== File: frontend/src/hooks/admin/useOrganization.ts =====

import {
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { queryKeys } from "@/hooks/queryKeys.factory";
import { organizationApi } from "@/api/admin/organization.api";

import type { Organization } from "@/types/admin/organization.types";
import type { UpdateOrganizationRequest } from "@/api/admin/organization.api";

// ======================================================
// FETCH ORGANIZATION
// ======================================================

export const useOrganization = (): UseQueryResult<
  Organization | null,
  Error
> => {
  return useAsyncQuery<Organization | null>(
    queryKeys.admin.organization.detail(),
    () => organizationApi.getOrg(),
    {
      staleTime: 1000 * 60 * 5,
    }
  );
};

// ======================================================
// UPDATE ORGANIZATION
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
  >((data) => organizationApi.updateOrg(data), {
    invalidateKeys: [
      queryKeys.admin.organization.detail(),
      queryKeys.admin.organization.accountsCheck(),
    ],

    onSuccess: (updated) => {
      queryClient.setQueryData(
        queryKeys.admin.organization.detail(),
        updated
      );
    },
  });
};