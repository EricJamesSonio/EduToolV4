// ===== File: frontend/src/hooks/admin/useOrganization.ts =====

import {
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
      // ✅ IMPORTANT FIX:
      // Keep data fresh so UI always reflects latest mutation
      staleTime: 0,

      // Optional: improves UX consistency after tab switch / refocus
      refetchOnMount: true,
      refetchOnWindowFocus: true,
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
  return useMutationWithInvalidation<
    Organization,
    Error,
    UpdateOrganizationRequest
  >(
    (data) => organizationApi.updateOrg(data),
    {
      invalidateKeys: [
        queryKeys.admin.organization.detail(),
        queryKeys.admin.organization.accountsCheck(),
      ],

      // ❌ REMOVED: setQueryData
      // React Query will refetch properly after invalidation

      onSuccess: () => {
        // optional: lightweight feedback hook point only
        // toast can stay in component layer (correct separation)
      },
    }
  );
};