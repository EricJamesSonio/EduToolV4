import client from "@/api/client";

export interface TimelineEvent {
  type: string;
  timestamp: string;
  schoolYearId: string;
  data: Record<string, unknown>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const academicHistoryApi = {
  getTimeline: async (
    studentId: string,
    params?: { schoolYearId?: string; sort?: "asc" | "desc" },
  ): Promise<TimelineEvent[]> => {
    const res = await client.get<ApiResponse<TimelineEvent[]>>(
      `/academic-history/${studentId}/timeline`,
      { params },
    );
    return res.data.data;
  },

  getFullHistory: async (studentId: string): Promise<unknown[]> => {
    const res = await client.get<ApiResponse<unknown[]>>(
      `/academic-history/${studentId}`,
    );
    return res.data.data;
  },

  getMyTimeline: async (params?: { schoolYearId?: string; sort?: "asc" | "desc" }): Promise<TimelineEvent[]> => {
    const res = await client.get<ApiResponse<TimelineEvent[]>>(
      `/student/academic-history/timeline`,
      { params },
    );
    return res.data.data;
  },

  getMyHistory: async (): Promise<unknown[]> => {
    const res = await client.get<ApiResponse<unknown[]>>(`/student/academic-history`);
    return res.data.data;
  },
};
