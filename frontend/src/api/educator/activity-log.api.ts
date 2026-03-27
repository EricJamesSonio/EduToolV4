import client from "@/api/client";

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface GetActivityLogQuery {
  classId?: string;
  from?: string;
  to?: string;
}

// 👇 backend response type
interface ActivityLogResponse {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export const activityLogApi = {
  getAll: async (query?: GetActivityLogQuery): Promise<ActivityLog[]> => {
    const res = await client.get<ActivityLogResponse[]>("/activity-log", {
      params: query,
    });

    return res.data.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      actorId: log.actor_id,
      metadata: log.metadata,
      createdAt: log.created_at,
    }));
  },
};