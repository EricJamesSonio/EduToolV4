export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  status: AttendanceStatus;
  /** true if auto-set because student submitted an assessment that day */
  autoSet: boolean;
  updatedAt: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  weekNumber: number;
  sessionNumber: number;  // e.g. 1 = first session of the week
  label: string;          // e.g. "Session 3.1"
  date: string;
  records: AttendanceRecord[];
  createdAt: string;
  updatedAt: string;
}