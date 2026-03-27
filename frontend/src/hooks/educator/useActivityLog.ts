import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  activityLogApi,
  GetActivityLogQuery,
  ActivityLog,
} from "@/api/educator/activity-log.api";

const ACTIVITY_LOG_KEY = "activity-log";

export const useActivityLog = (
  classId?: string,
  query?: GetActivityLogQuery
): UseQueryResult<ActivityLog[]> => {
  return useQuery({
    queryKey: [ACTIVITY_LOG_KEY, classId, query],
    queryFn: () => activityLogApi.getAll({ ...query, classId }),
    enabled: !!classId,
  });
};