import client from "@/api/client";
import type {
  OrgScheduleConfig,
  UpsertOrgScheduleConfigRequest,
} from "@/types/admin/org-schedule-config.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const orgScheduleConfigApi = {
  get: async (): Promise<OrgScheduleConfig> => {
    const res = await client.get<ApiResponse<OrgScheduleConfig>>(
      "/org-schedule-config",
    );
    return res.data.data;
  },

  upsert: async (
    data: UpsertOrgScheduleConfigRequest,
  ): Promise<OrgScheduleConfig> => {
    const res = await client.put<ApiResponse<OrgScheduleConfig>>(
      "/org-schedule-config",
      data,
    );
    return res.data.data;
  },
};
