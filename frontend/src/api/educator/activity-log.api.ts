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
  action?: string;
  actionContains?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface PageMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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

function toActivityLog(log: ActivityLogResponse): ActivityLog {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entity_type,
    entityId: log.entity_id,
    actorId: log.actor_id,
    metadata: log.metadata,
    createdAt: log.created_at,
  };
}

export const activityLogApi = {
  // Perf Phase 4: server-paginated {data, meta}.
  // NOTE (pre-existing bug, fixed here): this client previously called
  // res.data.map(...) but the backend wraps every response as
  // {success, data}, so .map threw and the educator activity page always
  // rendered empty. Now unwraps correctly — flagged in TICK-INFRA-006.
  getAll: async (
    query?: GetActivityLogQuery,
  ): Promise<{ data: ActivityLog[]; meta: PageMeta }> => {
    const res = await client.get<{
      success: boolean;
      data: { data: ActivityLogResponse[]; meta: PageMeta };
    }>("/activity-log", { params: query });

    return {
      data: res.data.data.data.map(toActivityLog),
      meta: res.data.data.meta,
    };
  },
};