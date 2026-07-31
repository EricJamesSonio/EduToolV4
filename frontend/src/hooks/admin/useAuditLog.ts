import { UseQueryResult } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { auditLogApi, activityLogApi } from "@/api/admin/audit-log.api";
import type { AuditLog, ActivityLog } from "@/types/admin/audit-log.types";
import type { GetAuditLogQuery, GetActivityLogQuery } from "@/api/admin/audit-log.api";

export const useAuditLogs = (
  query?: GetAuditLogQuery,
): UseQueryResult<AuditLog[], Error> => {
  return useAsyncQuery<AuditLog[]>(
    [...queryKeys.admin.auditLog.all, 'list', query] as const,
    () => auditLogApi.getAll(query),
    { staleTime: 0, refetchInterval: 15000, meta: { preset: 'realtime' } },
  );
};

export const useActivityLogs = (
  query?: GetActivityLogQuery,
): UseQueryResult<ActivityLog[], Error> => {
  return useAsyncQuery<ActivityLog[]>(
    [...queryKeys.admin.activityLog.all, 'list', query] as const,
    () => activityLogApi.getAll(query),
  );
};