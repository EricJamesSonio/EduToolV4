import apiClient from "@/api/client";

export interface StudentMeetingItem {
  id: string;
  title: string;
  startTime: string;
  status: "scheduled" | "ended";
  isInvited: boolean;
  joinRequest: {
    id: string;
    status: "pending" | "accepted" | "declined";
  } | null;
}

export interface MeetingToken {
  token: string;
  channel: string;
  appId: string;
  uid: number;
  warning?: string;
}

export const studentMeetingApi = {
  getAll: async (classId: string): Promise<StudentMeetingItem[]> => {
    const { data } = await apiClient.get(
      `/student/classes/${classId}/meetings`
    );
    return data;
  },

  requestJoin: async (
    meetingId: string
  ): Promise<{ id: string; status: "pending" }> => {
    const { data } = await apiClient.post(
      `/meetings/${meetingId}/join-request`
    );
    return data;
  },

  getToken: async (meetingId: string): Promise<MeetingToken> => {
    const { data } = await apiClient.get(`/meetings/${meetingId}/token`);
    return data;
  },
};