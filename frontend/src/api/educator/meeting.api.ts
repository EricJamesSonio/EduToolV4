import apiClient from "@/api/client";

export type MeetingStatus = "scheduled" | "ended";

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  status: MeetingStatus;
}

export interface MeetingToken {
  token: string;
  channel: string;
  appId: string;
  uid: number;
  warning?: string;
}

export interface CreateMeetingDto {
  title: string;
  description?: string;
  startTime: string;
  invitedStudentIds?: string[];
}

export interface UpdateMeetingDto {
  title?: string;
  description?: string;
  startTime?: string;
  invitedStudentIds?: string[];
}

export interface JoinRequestResponse {
  id: string;
  status: "pending" | "accepted" | "declined";
}

export const meetingApi = {
  getAll: async (classId: string): Promise<Meeting[]> => {
    const { data } = await apiClient.get(`/classes/${classId}/meetings`);
    return data;
  },

  getOne: async (classId: string, meetingId: string): Promise<Meeting> => {
    const { data } = await apiClient.get(
      `/classes/${classId}/meetings/${meetingId}`
    );
    return data;
  },

  create: async (
    classId: string,
    dto: CreateMeetingDto
  ): Promise<Meeting> => {
    const { data } = await apiClient.post(
      `/classes/${classId}/meetings`,
      dto
    );
    return data;
  },

  update: async (
    classId: string,
    meetingId: string,
    dto: UpdateMeetingDto
  ): Promise<Meeting> => {
    const { data } = await apiClient.patch(
      `/classes/${classId}/meetings/${meetingId}`,
      dto
    );
    return data;
  },

  delete: async (classId: string, meetingId: string): Promise<void> => {
    await apiClient.delete(`/classes/${classId}/meetings/${meetingId}`);
  },

  end: async (
    classId: string,
    meetingId: string
  ): Promise<{ success: true; message: string }> => {
    const { data } = await apiClient.post(
      `/classes/${classId}/meetings/${meetingId}/end`
    );
    return data;
  },

  respondToJoinRequest: async (
    meetingId: string,
    reqId: string,
    status: "accepted" | "declined"
  ): Promise<void> => {
    await apiClient.patch(`/meetings/${meetingId}/join-request/${reqId}`, {
      status,
    });
  },

  getToken: async (meetingId: string): Promise<MeetingToken> => {
    const { data } = await apiClient.get(`/meetings/${meetingId}/token`);
    return data;
  },
};