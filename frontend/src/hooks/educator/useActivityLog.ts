// src/hooks/educator/useActivityLog.ts
import { useQuery } from "@tanstack/react-query";
import { activityLogApi, GetActivityLogQuery } from "@/api/educator/activity-log.api";

const ACTIVITY_LOG_KEY = "activity-log";

export const useActivityLog = (classId?: string, query?: GetActivityLogQuery) => {
  return useQuery({
    queryKey: [ACTIVITY_LOG_KEY, classId, query],
    queryFn: () => activityLogApi.getAll({ ...query, classId }),
    enabled: !!classId,
  });
};