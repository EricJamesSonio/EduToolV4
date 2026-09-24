import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { adminQueryKeys } from "@/hooks/queryKeys/admin.keys";
import { orgScheduleConfigApi } from "@/api/admin/org-schedule-config.api";

export function useOrgScheduleConfig() {
  return useAsyncQuery(
    adminQueryKeys.orgScheduleConfig.detail(),
    orgScheduleConfigApi.get,
    { meta: { preset: "static", feature: "organization" } },
  );
}