import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import {
  activityLogApi,
  GetActivityLogQuery,
  ActivityLog,
  PageMeta,
} from "@/api/educator/activity-log.api";
import { queryKeys } from "@/hooks/queryKeys.factory";

export const useActivityLog = (query?: GetActivityLogQuery) => {
  // Perf Phase 4: server-paginated {data, meta}; page/limit ride in the query
  // key so page changes refetch.
  return useAsyncQuery<{ data: ActivityLog[]; meta: PageMeta }>(
    queryKeys.educator.activityLog.list(query),
    () => activityLogApi.getAll(query),
  );
};
