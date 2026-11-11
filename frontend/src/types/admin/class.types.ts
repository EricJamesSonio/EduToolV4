export type ClassStatus = "active" | "archived";

export interface ClassSchedule {
  id: string;
  classId: string;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  /** Optional room for this slot. null/undefined = no room assigned. */
  roomId?: string | null;
  /** Denormalized room name, so the UI can show it without a second fetch. */
  roomName?: string | null;
}

export type EnrollmentStatus = "active" | "pending" | "removed";

export interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  studentName?: string;
  studentIdNumber?: string;
  status: EnrollmentStatus;
  enrolledAt?: string;
}

export interface Class {
  id: string;
  orgId: string;
  subjectId: string;
  subjectName?: string;
  sectionId: string | null;
  sectionName?: string;
  sectionCapacity?: number | null;
  semesterId: string;
  semesterName?: string;
  semesterStartDate?: string | null;
  semesterEndDate?: string | null;
  schoolYearId: string;
  schoolYearTitle?: string;
  educatorId: string;
  educatorName?: string;
  educatorEmail?: string | null;
  capacity: number;
  enrolledCount: number;
  status: ClassStatus;
  isArchived?: boolean;
  title?: string;
  schedules: ClassSchedule[];
  createdAt: string;
  updatedAt?: string;
  programId?: string;
  programName?: string;
  levelName?: string;
  /** Student's active placement rank for this class's school year. */
  studentLevelRank?: number | null;
  courseName?: string;
  strandName?: string;
  templateId?: string | null;
  has_prerequisite_warning?: boolean;
  prerequisite_warnings?: Array<{
    subject_id: string;
    subject_name: string;
    reason: string;
  }>;
}