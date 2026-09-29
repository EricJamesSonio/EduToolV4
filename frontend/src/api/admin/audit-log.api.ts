// frontend/src/api/admin/audit-log.api.ts

import client from "@/api/client";
import type { AuditLog, ActivityLog } from "@/types/admin/audit-log.types";
import type { PaginatedResponse } from "@/types/api.types";

export interface GetAuditLogQuery {
  from?: string;       // ISO date string
  to?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  page?: number;
  limit?: number;
}

export interface GetActivityLogQuery {
  classId?: string;
  action?: string;
  actionContains?: string;
  from?: string;       // ISO date string
  to?: string;
  page?: number;
  limit?: number;
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
  // Perf Phase 4: server-paginated {data, meta}. Callers pass page/limit and
  // read meta.total instead of slicing the full history client-side.
  getAll: async (
    query?: GetAuditLogQuery,
  ): Promise<PaginatedResponse<AuditLog>> => {
    const res = await client.get<{
      success: boolean;
      data: PaginatedResponse<AuditLog>;
    }>("/audit-log", { params: query });
    const page = toCamelCase(res.data.data) as PaginatedResponse<AuditLog>;
    return page;
  },
};

export const activityLogApi = {
  getAll: async (
    query?: GetActivityLogQuery,
  ): Promise<PaginatedResponse<ActivityLog>> => {
    const res = await client.get<{
      success: boolean;
      data: PaginatedResponse<ActivityLog>;
    }>("/activity-log", { params: query });
    const page = toCamelCase(res.data.data) as PaginatedResponse<ActivityLog>;
    return page;
  },
};