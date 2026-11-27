import apiClient from "@/api/client";
import type {
  LiveMeeting,
  LiveMeetingToken,
} from "@/types/admin/live-meeting.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const liveMeetingApi = {
  getLive: async (): Promise<LiveMeeting[]> => {
    const { data } = await apiClient.get<ApiResponse<LiveMeeting[]>>(
      "/admin/meetings/live",
    );
    return data?.data ?? [];
  },

  getToken: async (meetingId: string): Promise<LiveMeetingToken> => {
    const { data } = await apiClient.get<ApiResponse<LiveMeetingToken>>(
      `/admin/meetings/${meetingId}/token`,
    );
    return data.data;
  },
};