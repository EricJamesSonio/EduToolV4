export type AttendanceStatus = "present" | "absent" | "late" | "excused";

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
  status: AttendanceStatus;
}

export interface SessionWithRecords extends AttendanceSession {
  records: AttendanceRecord[];
}

export interface WeekSessions {
  week_number: number;
  sessions: AttendanceSession[];
}