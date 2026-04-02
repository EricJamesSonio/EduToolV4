import client from "@/api/client";
import type {
  AttendanceSession,
  AttendanceRecord,
} from "@/types/educator/attendance.types";

export interface AttendanceRecordInput {
  studentId: string;
  status: "present" | "absent" | "late" | "excused";
}

export interface WeekSessions {
  week_number: number;
  sessions: AttendanceSession[];
}

export interface SessionWithRecords extends AttendanceSession {
  records: AttendanceRecord[];
}

export const attendanceApi = {
getSessions: async (classId: string, weekNumber?: number): Promise<WeekSessions[]> => {
  const res = await client.get<{ success: boolean; data: WeekSessions[] }>(
    `/classes/${classId}/attendance/sessions`,
    { params: weekNumber ? { weekNumber } : undefined }
  );
  return res.data.data;  // unwrap envelope
},

getSession: async (classId: string, sessionId: string): Promise<SessionWithRecords> => {
  const res = await client.get<{ success: boolean; data: SessionWithRecords }>(
    `/classes/${classId}/attendance/sessions/${sessionId}`
  );
  return res.data.data;  // unwrap envelope
},
  bulkSet: async (
    classId: string,
    sessionId: string,
    records: AttendanceRecordInput[]
  ): Promise<{ message: string; count: number }> => {
    const res = await client.post<{ message: string; count: number }>(
      `/classes/${classId}/attendance/sessions/${sessionId}/records`,
      { records }
    );
    return res.data;
  },
  updateRecord: async (
    classId: string,
    sessionId: string,
    recordId: string,
    status: "present" | "absent" | "late" | "excused"
  ): Promise<AttendanceRecord> => {
    const res = await client.patch<AttendanceRecord>(
      `/classes/${classId}/attendance/sessions/${sessionId}/records/${recordId}`,
      { status }
    );
    return res.data;
  },
};