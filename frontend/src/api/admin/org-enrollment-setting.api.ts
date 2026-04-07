import client from "@/api/client";
import type {
  OrgEnrollmentSetting,
  UpsertOrgEnrollmentSettingRequest,
} from "@/types/admin/org-enrollment-setting.types";

interface ApiResponse<T> {
  success: boolean;
  data:    T;
}

export const orgEnrollmentSettingApi = {
  get: async (): Promise<OrgEnrollmentSetting> => {
    const res = await client.get<ApiResponse<OrgEnrollmentSetting>>(
      "/org-enrollment-settings",
    );
    return res.data.data;
  },

  upsert: async (
    data: UpsertOrgEnrollmentSettingRequest,
  ): Promise<OrgEnrollmentSetting> => {
    const res = await client.put<ApiResponse<OrgEnrollmentSetting>>(
      "/org-enrollment-settings",
      data,
    );
    return res.data.data;
  },
};