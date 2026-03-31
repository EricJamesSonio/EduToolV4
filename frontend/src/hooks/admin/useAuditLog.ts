// frontend/src/hooks/admin/useAuditLog.ts

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { auditLogApi, activityLogApi } from "@/api/admin/audit-log.api";
import type { AuditLog, ActivityLog } from "@/types/admin/audit-log.types";
import type { GetAuditLogQuery, GetActivityLogQuery } from "@/api/admin/audit-log.api";

export const useAuditLogs = (
  query?: GetAuditLogQuery,
): UseQueryResult<AuditLog[], unknown> => {
  return useQuery<AuditLog[], unknown>({
    queryKey: ["auditLogs", query],
    queryFn: () => auditLogApi.getAll(query),
  });
};

export const useActivityLogs = (
  query?: GetActivityLogQuery,
): UseQueryResult<ActivityLog[], unknown> => {
  return useQuery<ActivityLog[], unknown>({
    queryKey: ["activityLogs", query],
    queryFn: () => activityLogApi.getAll(query),
  });
};