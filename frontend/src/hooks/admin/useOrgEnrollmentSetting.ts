import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { orgEnrollmentSettingApi } from "@/api/admin/org-enrollment-setting.api";
import type {
  OrgEnrollmentSetting,
  UpsertOrgEnrollmentSettingRequest,
} from "@/types/admin/org-enrollment-setting.types";

export const useOrgEnrollmentSetting = () => {
  return useAsyncQuery<OrgEnrollmentSetting>(
    queryKeys.admin.orgEnrollmentSetting.detail(),
    orgEnrollmentSettingApi.get,
  );
};

export const useUpsertOrgEnrollmentSetting = () => {
  return useMutationWithInvalidation<OrgEnrollmentSetting, Error, UpsertOrgEnrollmentSettingRequest>(
    orgEnrollmentSettingApi.upsert,
    {
      invalidateKeys: [queryKeys.admin.orgEnrollmentSetting.detail()],
    },
  );
};
