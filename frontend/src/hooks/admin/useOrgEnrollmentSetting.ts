import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { orgEnrollmentSettingApi } from "@/api/admin/org-enrollment-setting.api";
import type {
  OrgEnrollmentSetting,
  UpsertOrgEnrollmentSettingRequest,
} from "@/types/admin/org-enrollment-setting.types";

const KEY = ["admin", "org-enrollment-setting"] as const;

export const useOrgEnrollmentSetting = (): UseQueryResult<
  OrgEnrollmentSetting,
  Error
> =>
  useQuery({
    queryKey: KEY,
    queryFn: orgEnrollmentSettingApi.get,
  });

export const useUpsertOrgEnrollmentSetting = (): UseMutationResult<
  OrgEnrollmentSetting,
  Error,
  UpsertOrgEnrollmentSettingRequest
> => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: orgEnrollmentSettingApi.upsert,
    onSuccess: (updated) => {
      qc.setQueryData<OrgEnrollmentSetting>(KEY, updated);
    },
  });
};