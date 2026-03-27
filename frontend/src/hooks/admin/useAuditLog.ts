import { useQuery } from "@tanstack/react-query";
import { auditLogApi } from "@/api/admin/audit-log.api";
import type { GetAuditLogQuery } from "@/api/admin/audit-log.api";

export const useAuditLogs = (query?: GetAuditLogQuery) => {
  return useQuery({
    queryKey: ["auditLogs", query],
    queryFn: () => auditLogApi.getAll(query),
  });
};