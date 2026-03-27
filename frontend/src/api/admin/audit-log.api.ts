import client from "@/api/client";

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface GetAuditLogQuery {
  from?: string;
  to?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}

export const auditLogApi = {
  getAll: async (query?: GetAuditLogQuery): Promise<AuditLog[]> => {
    const res = await client.get<AuditLog[]>("/audit-log", { params: query });
    return res.data;
  },
};