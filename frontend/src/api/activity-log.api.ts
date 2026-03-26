import apiClient from "@/api/client";

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityLogFilters {
  classId?: string;
  from?: string;
  to?: string;
}

export const activityLogApi = {
  getAll: async (filters?: ActivityLogFilters): Promise<ActivityLog[]> => {
    const { data } = await apiClient.get("/activity-log", { params: filters });
    return data;
  },
};