import apiClient from "@/api/client";

export interface Notification {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getAll: async (unreadOnly?: boolean): Promise<Notification[]> => {
    const { data } = await apiClient.get("/notifications", {
      params: unreadOnly !== undefined ? { unreadOnly } : undefined,
    });
    return data;
  },

  dismiss: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },
};