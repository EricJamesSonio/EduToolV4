import apiClient from "@/api/client";

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  unrecorded: number;
}

export interface AttendanceSessionEntry {
  sessionId: string;
  date: string;
  weekNumber: number;
  subIndex: number;
  status: "present" | "absent" | "late" | "excused" | null;
}

export interface StudentAttendanceResponse {
  summary: AttendanceSummary;
  sessions: AttendanceSessionEntry[];
}

export const studentAttendanceApi = {
  getOwn: async (classId: string): Promise<StudentAttendanceResponse> => {
    const { data } = await apiClient.get(
      `/student/classes/${classId}/attendance`
    );
    return data;
  },
};