import apiClient from "@/api/client";
import type {
  Meeting,
  MeetingToken,
  CreateMeetingDto,
  UpdateMeetingDto,
  EnrolledStudent,
} from "@/types/educator/meeting.types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

/* ================= RAW API TYPES ================= */

interface RawInvite {
  id: string;
  student_id?: string;
  studentId?: string;
}

interface RawJoinRequest {
  id: string;
  student_id?: string;
  studentId?: string;
  status: "pending" | "accepted" | "declined";
}

interface RawMeeting {
  id: string;
  title: string;
  description?: string | null;
  start_time?: string;
  startTime?: string;
  status: Meeting["status"];
  invites?: RawInvite[];
  join_requests?: RawJoinRequest[];
  joinRequests?: RawJoinRequest[];
}

interface RawStudent {
  id: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  email?: string;
}

/* ================= MAPPERS ================= */

function mapMeeting(raw: RawMeeting): Meeting {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? undefined,
    startTime: raw.start_time ?? raw.startTime ?? "",
    status: raw.status,
    invites: (raw.invites ?? []).map((i) => ({
      id: i.id,
      studentId: i.student_id ?? i.studentId ?? "",
    })),
    joinRequests: (raw.join_requests ?? raw.joinRequests ?? []).map((r) => ({
      id: r.id,
      studentId: r.student_id ?? r.studentId ?? "",
      status: r.status,
    })),
  };
}

/* ================= API ================= */

export const meetingApi = {
  getAll: async (classId: string): Promise<Meeting[]> => {
    const { data } = await apiClient.get<ApiResponse<RawMeeting[]>>(
      `/classes/${classId}/meetings`
    );
    const raw = data?.data ?? [];
    return raw.map(mapMeeting);
  },

  getOne: async (classId: string, meetingId: string): Promise<Meeting> => {
    const { data } = await apiClient.get<ApiResponse<RawMeeting>>(
      `/classes/${classId}/meetings/${meetingId}`
    );
    return mapMeeting(data.data);
  },

  create: async (classId: string, dto: CreateMeetingDto): Promise<Meeting> => {
    const { data } = await apiClient.post<ApiResponse<RawMeeting>>(
      `/classes/${classId}/meetings`,
      dto
    );
    return mapMeeting(data.data);
  },

  update: async (
    classId: string,
    meetingId: string,
    dto: UpdateMeetingDto
  ): Promise<Meeting> => {
    const { data } = await apiClient.patch<ApiResponse<RawMeeting>>(
      `/classes/${classId}/meetings/${meetingId}`,
      dto
    );
    return mapMeeting(data.data);
  },

  delete: async (classId: string, meetingId: string): Promise<void> => {
    await apiClient.delete(`/classes/${classId}/meetings/${meetingId}`);
  },

  end: async (
    classId: string,
    meetingId: string
  ): Promise<{ success: true; message: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      `/classes/${classId}/meetings/${meetingId}/end`
    );
    return { success: true, message: data.data.message };
  },

  getToken: async (meetingId: string): Promise<MeetingToken> => {
    const { data } = await apiClient.get<ApiResponse<MeetingToken>>(
      `/meetings/${meetingId}/token`
    );
    return data.data;
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

  getEnrolledStudents: async (
    classId: string
  ): Promise<EnrolledStudent[]> => {
    const { data } = await apiClient.get<ApiResponse<RawStudent[]>>(
      `/classes/${classId}/students`
    );

    return data.data.map((s) => ({
      id: s.id,
      fullName: s.full_name ?? s.fullName ?? s.name ?? "",
      email: s.email ?? "",
    }));
  },
};