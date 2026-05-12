import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  activityLogApi,
  GetActivityLogQuery,
  ActivityLog,
} from "@/api/educator/activity-log.api";
import { createStandardMutationOptions } from "@/lib/error-handling";
import { QUERY_CONFIGS } from "@/lib/query-client";

const ACTIVITY_LOG_KEY = "educator-activity-log";

export const useActivityLog = (
  query?: GetActivityLogQuery
): UseQueryResult<ActivityLog[]> => {
  return useQuery({
    queryKey: [ACTIVITY_LOG_KEY, query],
    queryFn: () => activityLogApi.getAll(query),
    ...QUERY_CONFIGS.list,
  });
};