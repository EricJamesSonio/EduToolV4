import client from "@/api/client";

export interface StudentMeeting {
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

export interface MeetingTokenResponse {
  token: string;
  channel: string;
  appId: string;
  uid: number;
  classId: string;
  warning?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const studentMeetingApi = {
  getAll: async (classId: string): Promise<StudentMeeting[]> => {
    const res = await client.get<StudentMeeting[]>(
      `/student/classes/${classId}/meetings`
    );
    return res.data;
  },
  getOne: async (classId: string, meetingId: string): Promise<StudentMeeting> => {
    const res = await client.get<StudentMeeting>(
      `/student/classes/${classId}/meetings/${meetingId}`
    );
    return res.data;
  },
  requestJoin: async (meetingId: string): Promise<{ id: string; status: "pending" }> => {
    const res = await client.post<{ id: string; status: "pending" }>(
      `/meetings/${meetingId}/join-request`
    );
    return res.data;
  },
  getToken: async (meetingId: string): Promise<MeetingTokenResponse> => {
    const res = await client.get<ApiResponse<MeetingTokenResponse>>(
      `/meetings/${meetingId}/token`
    );
    return res.data.data;
  },
};