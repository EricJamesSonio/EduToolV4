// ===== File: frontend/src/types/educator/attendance.types.ts =====

export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "excused";

// ======================================================
// SESSION (LIST VIEW ONLY)
// ======================================================
export interface AttendanceSession {
  id: string;
  class_id: string;
  week_number: number;
  sub_index: number;
  date: string;
}

// ======================================================
// RECORD (REAL DB STRUCTURE)
// ======================================================
export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
}

// ======================================================
// SESSION DETAIL (WITH RECORDS)
// ======================================================
export interface SessionWithRecords extends AttendanceSession {
  records: AttendanceRecord[];
}

// ======================================================
// GROUPED WEEK RESPONSE
// ======================================================
export interface WeekSessions {
  week_number: number;
  sessions: AttendanceSession[];
}