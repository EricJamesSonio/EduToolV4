import apiClient from "@/api/client";

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  data: Notification[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const notificationApi = {
  // Perf Phase 4: server-paginated to match GET /notifications {data, meta}.
  // (No active callers at the time of this change — kept contract-correct.)
  getAll: async (
    unreadOnly?: boolean,
    page = 1,
    limit = 20,
  ): Promise<NotificationPage> => {
    const { data } = await apiClient.get("/notifications", {
      params: {
        ...(unreadOnly !== undefined ? { unreadOnly } : {}),
        page,
        limit,
      },
    });
    return data?.data ?? data;
  },

  dismiss: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};