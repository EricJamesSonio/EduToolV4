// ===== File: frontend/src/api/educator/attendance.api.ts =====

import client from "@/api/client";

export interface AttendanceRecordInput {
  studentId: string;
  status: "present" | "absent" | "late" | "excused";
}

export interface WeekSessions {
  week_number: number;
  sessions: AttendanceSession[];
}

/**
 * ⚠️ IMPORTANT:
 * Backend "getSessions" returns:
 * [
 *   { week_number, sessions: AttendanceSession[] }
 * ]
 */
export interface AttendanceSession {
  id: string;
  class_id: string;
  week_number: number;
  sub_index: number;
  date: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;   // add
  student_code: string;   // add
  status: "present" | "absent" | "late" | "excused";
}

export interface SessionStudent {
  id: string;
  name: string;
  code: string;
}

export interface SessionWithRecords extends AttendanceSession {
  records: AttendanceRecord[];
  students: SessionStudent[];
}

export interface AttendanceGridStudent {
  id: string;
  name: string;
  code: string;
}

export interface AttendanceGridSession {
  id: string;
  date: string;
  weekNumber: number;
  subIndex: number;
  records: Record<string, string>; // studentId → status
}

export interface AttendanceGridData {
  students: AttendanceGridStudent[];
  sessions: AttendanceGridSession[];
}

export const attendanceApi = {
  // ======================================================
  // GET ATTENDANCE GRID (Excel-like)
  // ======================================================
  getAttendanceGrid: async (
    classId: string,
  ): Promise<AttendanceGridData> => {
    const res = await client.get(`/classes/${classId}/attendance/grid`);
    return res.data.data ?? res.data;
  },

  // ======================================================
  // GET WEEK GROUPED SESSIONS
  // ======================================================
  getSessions: async (
    classId: string,
    weekNumber?: number
  ): Promise<WeekSessions[]> => {
    const res = await client.get(`/classes/${classId}/attendance/sessions`, {
      params: weekNumber ? { weekNumber } : undefined,
    });

    // backend may return raw OR wrapped depending on interceptor
    return res.data.data ?? res.data;
  },

  // ======================================================
  // GET SINGLE SESSION (WITH RECORDS)
  // ======================================================
  getSession: async (
    classId: string,
    sessionId: string
  ): Promise<SessionWithRecords> => {
    const res = await client.get(
      `/classes/${classId}/attendance/sessions/${sessionId}`
    );

    return res.data.data ?? res.data;
  },

  // ======================================================
  // BULK SET ATTENDANCE
  // ======================================================
  bulkSet: async (
    classId: string,
    sessionId: string,
    records: AttendanceRecordInput[]
  ): Promise<{ message: string; count: number }> => {
    const res = await client.post(
      `/classes/${classId}/attendance/sessions/${sessionId}/records`,
      { records }
    );

    return res.data;
  },

  // ======================================================
  // UPDATE SINGLE RECORD
  // ======================================================
  updateRecord: async (
    classId: string,
    sessionId: string,
    recordId: string,
    status: "present" | "absent" | "late" | "excused"
  ): Promise<AttendanceRecord> => {
    const res = await client.patch(
      `/classes/${classId}/attendance/sessions/${sessionId}/records/${recordId}`,
      { status }
    );

    return res.data;
  },
};