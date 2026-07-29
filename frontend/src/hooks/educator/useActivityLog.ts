import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import {
  activityLogApi,
  GetActivityLogQuery,
  ActivityLog,
} from "@/api/educator/activity-log.api";
import { queryKeys } from "@/hooks/queryKeys.factory";

export const useActivityLog = (query?: GetActivityLogQuery) => {
  return useAsyncQuery<ActivityLog[]>(
    queryKeys.educator.activityLog.list(query),
    () => activityLogApi.getAll(query),
  );
};
