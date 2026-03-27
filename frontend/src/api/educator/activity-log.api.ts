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

export const activityLogApi = {
  getAll: async (query?: GetActivityLogQuery): Promise<ActivityLog[]> => {
    const res = await client.get<ActivityLog[]>("/activity-log", {
      params: query,
    });
    return res.data;
  },
};