// frontend/src/api/student/notification.api.ts
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

export interface NotificationSummary {
  /** Total unread across every type — drives the red bell badge. */
  unreadCount: number;
  /** Unread per type, e.g. { concern_created: 5, application_submitted: 10 } */
  byType: Record<string, number>;
}

export const notificationApi = {
  // Server-paginated to match GET /notifications {data, meta}.
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

  getSummary: async (): Promise<NotificationSummary> => {
    const { data } = await apiClient.get("/notifications/summary");
    return data?.data ?? data;
  },

  markRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.patch("/notifications/read-all");
  },

  dismiss: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};