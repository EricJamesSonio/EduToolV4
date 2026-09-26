import { UseQueryResult } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { auditLogApi, activityLogApi } from "@/api/admin/audit-log.api";
import type { AuditLog, ActivityLog } from "@/types/admin/audit-log.types";
import type { GetAuditLogQuery, GetActivityLogQuery } from "@/api/admin/audit-log.api";
import type { PaginatedResponse } from "@/types/api.types";

export const useAuditLogs = (
  query?: GetAuditLogQuery,
): UseQueryResult<PaginatedResponse<AuditLog>, Error> => {
  // Perf Phase 4: server-paginated 'list' (60s stale) instead of polling the
  // full log every 15s. Audit history doesn't need realtime freshness.
  return useAsyncQuery<PaginatedResponse<AuditLog>>(
    [...queryKeys.admin.auditLog.all, 'list', query] as const,
    () => auditLogApi.getAll(query),
    { meta: { preset: 'list' } },
  );
};

export const useActivityLogs = (
  query?: GetActivityLogQuery,
): UseQueryResult<PaginatedResponse<ActivityLog>, Error> => {
  return useAsyncQuery<PaginatedResponse<ActivityLog>>(
    [...queryKeys.admin.activityLog.all, 'list', query] as const,
    () => activityLogApi.getAll(query),
    { meta: { preset: 'list' } },
  );
};