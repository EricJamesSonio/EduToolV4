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

function toCamelCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>).reduce(
      (acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        (acc as Record<string, unknown>)[camelKey] = toCamelCase(
          (obj as Record<string, unknown>)[key],
        );
        return acc;
      },
      {} as Record<string, unknown>,
    );
  }
  return obj;
}

export const auditLogApi = {
  getAll: async (query?: GetAuditLogQuery): Promise<AuditLog[]> => {
    const res = await client.get<{ success: boolean; data: AuditLog[] }>(
      "/audit-log",
      { params: query }
    );
    return toCamelCase(res.data.data) as AuditLog[];
  },
};

export const activityLogApi = {
  getAll: async (query?: GetActivityLogQuery): Promise<ActivityLog[]> => {
    const res = await client.get<{ success: boolean; data: ActivityLog[] }>(
      "/activity-log",
      { params: query }
    );
    return toCamelCase(res.data.data) as ActivityLog[];
  },
};