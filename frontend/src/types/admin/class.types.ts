export type ClassStatus = "active" | "archived";

export interface ClassSchedule {
  id: string;
  classId: string;
  weekday: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
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
  semesterId: string;
  semesterName?: string;
  schoolYearId: string;
  schoolYearTitle?: string;
  educatorId: string;
  educatorName?: string;
  capacity: number;
  enrolledCount: number;
  status: ClassStatus;
  isArchived?: boolean;      // ← add this
  title?: string;            // ← add this (derived/joined from backend)
  schedules: ClassSchedule[];
  createdAt: string;
  updatedAt?: string;
}