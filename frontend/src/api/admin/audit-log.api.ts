// frontend/src/api/admin/audit-log.api.ts

import client from "@/api/client";
import type { AuditLog, ActivityLog } from "@/types/admin/audit-log.types";

export interface GetAuditLogQuery {
  from?: string;       // ISO date string
  to?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}

export interface GetActivityLogQuery {
  classId?: string;
  from?: string;       // ISO date string
  to?: string;
}

export const auditLogApi = {
  getAll: async (query?: GetAuditLogQuery): Promise<AuditLog[]> => {
    const res = await client.get<AuditLog[]>("/audit-log", { params: query });
    return res.data;
  },
};

export const activityLogApi = {
  getAll: async (query?: GetActivityLogQuery): Promise<ActivityLog[]> => {
    const res = await client.get<ActivityLog[]>("/activity-log", { params: query });
    return res.data;
  },
};